namespace NetUsageMonitor.Data.Repositories;

using Microsoft.EntityFrameworkCore;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Data;

public class DatabaseService : IDatabaseService
{
    private readonly NetUsageDbContext _context;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(NetUsageDbContext context, ILogger<DatabaseService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task InitializeAsync()
    {
        await _context.Database.EnsureCreatedAsync();
        _logger.LogInformation("Database initialized");
    }

    public async Task<Device?> GetDeviceAsync(int id)
        => await _context.Devices
            .Include(d => d.SnmpSettings)
            .Include(d => d.RouterApiSettings)
            .FirstOrDefaultAsync(d => d.Id == id);

    public async Task<List<Device>> GetAllDevicesAsync()
        => await _context.Devices
            .Include(d => d.SnmpSettings)
            .Include(d => d.RouterApiSettings)
            .OrderBy(d => d.FriendName)
            .ThenBy(d => d.Name)
            .ToListAsync();

    public async Task<Device> AddDeviceAsync(Device device)
    {
        device.CreatedAt = DateTime.UtcNow;
        _context.Devices.Add(device);
        await _context.SaveChangesAsync();
        return device;
    }

    public async Task<Device> UpdateDeviceAsync(Device device)
    {
        device.UpdatedAt = DateTime.UtcNow;
        _context.Devices.Update(device);
        await _context.SaveChangesAsync();
        return device;
    }

    public async Task DeleteDeviceAsync(int id)
    {
        var device = await _context.Devices.FindAsync(id);
        if (device != null)
        {
            _context.Devices.Remove(device);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<TrafficSample>> GetTrafficSamplesAsync(int deviceId, DateTime from, DateTime to)
        => await _context.TrafficSamples
            .Where(t => t.DeviceId == deviceId && t.Timestamp >= from && t.Timestamp <= to)
            .OrderBy(t => t.Timestamp)
            .ToListAsync();

    public async Task AddTrafficSampleAsync(TrafficSample sample)
    {
        sample.Timestamp = DateTime.UtcNow;
        _context.TrafficSamples.Add(sample);
        await _context.SaveChangesAsync();
    }

    public async Task AddTrafficSamplesAsync(IEnumerable<TrafficSample> samples)
    {
        foreach (var sample in samples)
            sample.Timestamp = DateTime.UtcNow;
        
        _context.TrafficSamples.AddRange(samples);
        await _context.SaveChangesAsync();
    }

    public async Task<DailyUsage?> GetDailyUsageAsync(int deviceId, DateOnly date)
        => await _context.DailyUsage
            .FirstOrDefaultAsync(d => d.DeviceId == deviceId && d.Date == date);

    public async Task<List<DailyUsage>> GetDailyUsageAsync(int deviceId, DateOnly from, DateOnly to)
        => await _context.DailyUsage
            .Where(d => d.DeviceId == deviceId && d.Date >= from && d.Date <= to)
            .OrderBy(d => d.Date)
            .ToListAsync();

    public async Task UpsertDailyUsageAsync(DailyUsage usage)
    {
        var existing = await _context.DailyUsage
            .FirstOrDefaultAsync(d => d.DeviceId == usage.DeviceId && d.Date == usage.Date);
        
        if (existing != null)
        {
            existing.DownloadBytes = usage.DownloadBytes;
            existing.UploadBytes = usage.UploadBytes;
            existing.TotalBytes = usage.TotalBytes;
            _context.DailyUsage.Update(existing);
        }
        else
        {
            _context.DailyUsage.Add(usage);
        }
        await _context.SaveChangesAsync();
    }

    public async Task<MonthlyUsage?> GetMonthlyUsageAsync(int deviceId, int year, int month)
        => await _context.MonthlyUsage
            .FirstOrDefaultAsync(m => m.DeviceId == deviceId && m.Year == year && m.Month == month);

    public async Task<List<MonthlyUsage>> GetMonthlyUsageAsync(int deviceId, int fromYear, int fromMonth, int toYear, int toMonth)
        => await _context.MonthlyUsage
            .Where(m => m.DeviceId == deviceId && 
                (m.Year > fromYear || (m.Year == fromYear && m.Month >= fromMonth)) &&
                (m.Year < toYear || (m.Year == toYear && m.Month <= toMonth)))
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync();

    public async Task UpsertMonthlyUsageAsync(MonthlyUsage usage)
    {
        var existing = await _context.MonthlyUsage
            .FirstOrDefaultAsync(m => m.DeviceId == usage.DeviceId && m.Year == usage.Year && m.Month == usage.Month);
        
        if (existing != null)
        {
            existing.DownloadBytes = usage.DownloadBytes;
            existing.UploadBytes = usage.UploadBytes;
            existing.TotalBytes = usage.TotalBytes;
            _context.MonthlyUsage.Update(existing);
        }
        else
        {
            _context.MonthlyUsage.Add(usage);
        }
        await _context.SaveChangesAsync();
    }

    public async Task<ApplicationSettings> GetSettingsAsync()
    {
        var settings = await _context.ApplicationSettings.FindAsync(1);
        return settings ?? new ApplicationSettings { Id = 1 };
    }

    public async Task UpdateSettingsAsync(ApplicationSettings settings)
    {
        settings.UpdatedAt = DateTime.UtcNow;
        _context.ApplicationSettings.Update(settings);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AlertRule>> GetAlertRulesAsync(int deviceId)
        => await _context.AlertRules.Where(a => a.DeviceId == deviceId).ToListAsync();

    public async Task<AlertRule> AddAlertRuleAsync(AlertRule rule)
    {
        _context.AlertRules.Add(rule);
        await _context.SaveChangesAsync();
        return rule;
    }

    public async Task<AlertRule> UpdateAlertRuleAsync(AlertRule rule)
    {
        _context.AlertRules.Update(rule);
        await _context.SaveChangesAsync();
        return rule;
    }

    public async Task DeleteAlertRuleAsync(int id)
    {
        var rule = await _context.AlertRules.FindAsync(id);
        if (rule != null)
        {
            _context.AlertRules.Remove(rule);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<Alert>> GetActiveAlertsAsync()
        => await _context.Alerts.Where(a => a.IsActive).OrderByDescending(a => a.CreatedAt).ToListAsync();

    public async Task<Alert> AddAlertAsync(Alert alert)
    {
        alert.CreatedAt = DateTime.UtcNow;
        _context.Alerts.Add(alert);
        await _context.SaveChangesAsync();
        return alert;
    }

    public async Task AcknowledgeAlertAsync(long alertId, string acknowledgedBy)
    {
        var alert = await _context.Alerts.FindAsync(alertId);
        if (alert != null)
        {
            alert.IsActive = false;
            alert.AcknowledgedAt = DateTime.UtcNow;
            alert.AcknowledgedBy = acknowledgedBy;
            await _context.SaveChangesAsync();
        }
    }

    public async Task CleanupOldDataAsync(int retentionDays)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
        
        var oldSamples = _context.TrafficSamples.Where(t => t.Timestamp < cutoffDate);
        _context.TrafficSamples.RemoveRange(oldSamples);
        
        var cutoffDateOnly = DateOnly.FromDateTime(cutoffDate);
        var oldDaily = _context.DailyUsage.Where(d => d.Date < cutoffDateOnly);
        _context.DailyUsage.RemoveRange(oldDaily);
        
        await _context.SaveChangesAsync();
        _logger.LogInformation("Cleaned up data older than {RetentionDays} days", retentionDays);
    }

    public async Task AddAuditLogAsync(AuditLog auditLog)
    {
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AuditLog>> GetAuditLogsAsync(DateTime? from = null, DateTime? to = null, string? user = null, string? entityType = null)
    {
        var query = _context.AuditLogs.AsQueryable();
        
        if (from.HasValue)
            query = query.Where(a => a.Timestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(a => a.Timestamp <= to.Value);
        if (!string.IsNullOrEmpty(user))
            query = query.Where(a => a.User.Contains(user));
        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(a => a.EntityType == entityType);
        
        return await query.OrderByDescending(a => a.Timestamp).ToListAsync();
    }

    public async Task<AuditLog?> GetAuditLogAsync(long id)
        => await _context.AuditLogs.FindAsync(id);

    public async Task<UserCredential?> GetUserCredentialAsync(string username)
        => await _context.UserCredentials.FirstOrDefaultAsync(u => u.Username == username);

    public async Task<UserCredential> AddUserCredentialAsync(UserCredential user)
    {
        _context.UserCredentials.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task UpdateUserCredentialAsync(UserCredential user)
    {
        _context.UserCredentials.Update(user);
        await _context.SaveChangesAsync();
    }
}