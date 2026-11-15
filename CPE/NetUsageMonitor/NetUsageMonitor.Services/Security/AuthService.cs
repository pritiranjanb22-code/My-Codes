namespace NetUsageMonitor.Services.Security;

using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Data;

public class AuditService : IAuditService
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<AuditService> _logger;

    public AuditService(IDatabaseService databaseService, ILogger<AuditService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    public async Task LogAsync(string user, string action, string entityType, int? entityId, string oldValues, string newValues)
    {
        try
        {
            var auditLog = new AuditLog
            {
                Timestamp = DateTime.UtcNow,
                User = user ?? Environment.UserName,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                IpAddress = GetLocalIpAddress()
            };

            await _databaseService.AddAuditLogAsync(auditLog);
            
            _logger.LogInformation("Audit: {User} {Action} {EntityType} {EntityId}", user, action, entityType, entityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log");
        }
    }

    public async Task<List<AuditLog>> GetAuditLogsAsync(DateTime? from = null, DateTime? to = null, string? user = null, string? entityType = null)
    {
        return await _databaseService.GetAuditLogsAsync(from, to, user, entityType);
    }

    public async Task<AuditLog?> GetAuditLogAsync(long id)
    {
        return await _databaseService.GetAuditLogAsync(id);
    }

    private string GetLocalIpAddress()
    {
        try
        {
            var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    return ip.ToString();
            }
        }
        catch { }
        return "unknown";
    }
}

public class AuthService : IAuthService
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<AuthService> _logger;
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public AuthService(IDatabaseService databaseService, ILogger<AuthService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    public async Task<bool> ValidateCredentialsAsync(string username, string password)
    {
        var user = await GetUserAsync(username);
        if (user == null || !user.IsActive)
            return false;

        if (await IsLockedOutAsync(username))
            return false;

        var hash = HashPassword(password, user.Salt);
        if (hash != user.PasswordHash)
        {
            await RecordFailedAttemptAsync(username);
            return false;
        }

        await ResetFailedAttemptsAsync(username);
        user.LastLogin = DateTime.UtcNow;
        await _databaseService.UpdateUserCredentialAsync(user);
        return true;
    }

    public async Task<UserCredential?> GetUserAsync(string username)
    {
        return await _databaseService.GetUserCredentialAsync(username);
    }

    public async Task<UserCredential> CreateUserAsync(string username, string password, string role = "Admin")
    {
        var salt = GenerateSalt();
        var hash = HashPassword(password, salt);

        var user = new UserCredential
        {
            Username = username,
            PasswordHash = hash,
            Salt = salt,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        return await _databaseService.AddUserCredentialAsync(user);
    }

    public async Task<bool> ChangePasswordAsync(string username, string oldPassword, string newPassword)
    {
        var user = await GetUserAsync(username);
        if (user == null)
            return false;

        var oldHash = HashPassword(oldPassword, user.Salt);
        if (oldHash != user.PasswordHash)
            return false;

        user.PasswordHash = HashPassword(newPassword, user.Salt);
        await _databaseService.UpdateUserCredentialAsync(user);
        return true;
    }

    public async Task<bool> IsLockedOutAsync(string username)
    {
        var user = await GetUserAsync(username);
        if (user == null)
            return false;

        if (user.LockoutUntil.HasValue && user.LockoutUntil.Value > DateTime.UtcNow)
            return true;

        if (user.FailedAttempts >= MaxFailedAttempts)
        {
            user.LockoutUntil = DateTime.UtcNow.Add(LockoutDuration);
            await _databaseService.UpdateUserCredentialAsync(user);
            return true;
        }

        return false;
    }

    public async Task RecordFailedAttemptAsync(string username)
    {
        var user = await GetUserAsync(username);
        if (user == null)
            return;

        user.FailedAttempts++;
        if (user.FailedAttempts >= MaxFailedAttempts)
        {
            user.LockoutUntil = DateTime.UtcNow.Add(LockoutDuration);
        }
        await _databaseService.UpdateUserCredentialAsync(user);
    }

    public async Task ResetFailedAttemptsAsync(string username)
    {
        var user = await GetUserAsync(username);
        if (user == null)
            return;

        user.FailedAttempts = 0;
        user.LockoutUntil = null;
        await _databaseService.UpdateUserCredentialAsync(user);
    }

    private static string GenerateSalt()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string HashPassword(string password, string salt)
    {
        using var pbkdf2 = new Rfc2898DeriveBytes(password, Convert.FromBase64String(salt), 100000, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(32);
        return Convert.ToBase64String(hash);
    }
}