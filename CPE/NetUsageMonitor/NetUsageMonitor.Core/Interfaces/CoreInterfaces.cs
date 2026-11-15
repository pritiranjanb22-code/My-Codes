namespace NetUsageMonitor.Core.Interfaces;

using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;

public interface ITrafficCollector
{
    CollectorType Type { get; }
    Task<CollectorResult> CollectAsync(Device device, CancellationToken cancellationToken = default);
    Task<bool> TestConnectionAsync(Device device, CancellationToken cancellationToken = default);
    Task<List<NetworkInterface>> DiscoverInterfacesAsync(Device device, CancellationToken cancellationToken = default);
    void Dispose();
}

public class CollectorResult
{
    public bool Success { get; set; }
    public SampleStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public ulong ReceivedCounter { get; set; }
    public ulong TransmittedCounter { get; set; }
    public double? LatencyMs { get; set; }
    public bool InterfaceUp { get; set; }
    public long InterfaceSpeed { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public static CollectorResult SuccessResult(ulong inOctets, ulong outOctets, double? latency = null, bool interfaceUp = true, long speed = 0)
        => new() { Success = true, Status = SampleStatus.Success, ReceivedCounter = inOctets, TransmittedCounter = outOctets, LatencyMs = latency, InterfaceUp = interfaceUp, InterfaceSpeed = speed };
    
    public static CollectorResult Failure(SampleStatus status, string message)
        => new() { Success = false, Status = status, ErrorMessage = message };
}

public interface ICounterProcessor
{
    TrafficSample ProcessSample(Device device, CollectorResult current, CollectorResult? previous);
    DailyUsage? AggregateDaily(int deviceId, DateOnly date, IEnumerable<TrafficSample> samples);
    MonthlyUsage? AggregateMonthly(int deviceId, int year, int month, IEnumerable<TrafficSample> samples);
}

public interface IUsageCalculator
{
    DataSize CalculateDownload(ulong currentIn, ulong previousIn, bool is64Bit);
    DataSize CalculateUpload(ulong currentOut, ulong previousOut, bool is64Bit);
    DataSize CalculateTotal(DataSize download, DataSize upload);
    (DataSize download, DataSize upload, bool wrapped) CalculateDifferences(ulong currentIn, ulong previousIn, ulong currentOut, ulong previousOut, bool use64Bit);
}

public interface IDatabaseService
{
    Task InitializeAsync();
    Task<Device?> GetDeviceAsync(int id);
    Task<List<Device>> GetAllDevicesAsync();
    Task<Device> AddDeviceAsync(Device device);
    Task<Device> UpdateDeviceAsync(Device device);
    Task DeleteDeviceAsync(int id);
    Task<List<TrafficSample>> GetTrafficSamplesAsync(int deviceId, DateTime from, DateTime to);
    Task AddTrafficSampleAsync(TrafficSample sample);
    Task AddTrafficSamplesAsync(IEnumerable<TrafficSample> samples);
    Task<DailyUsage?> GetDailyUsageAsync(int deviceId, DateOnly date);
    Task<List<DailyUsage>> GetDailyUsageAsync(int deviceId, DateOnly from, DateOnly to);
    Task UpsertDailyUsageAsync(DailyUsage usage);
    Task<MonthlyUsage?> GetMonthlyUsageAsync(int deviceId, int year, int month);
    Task<List<MonthlyUsage>> GetMonthlyUsageAsync(int deviceId, int fromYear, int fromMonth, int toYear, int toMonth);
    Task UpsertMonthlyUsageAsync(MonthlyUsage usage);
    Task<ApplicationSettings> GetSettingsAsync();
    Task UpdateSettingsAsync(ApplicationSettings settings);
    Task<List<AlertRule>> GetAlertRulesAsync(int deviceId);
    Task<AlertRule> AddAlertRuleAsync(AlertRule rule);
    Task<AlertRule> UpdateAlertRuleAsync(AlertRule rule);
    Task DeleteAlertRuleAsync(int id);
    Task<List<Alert>> GetActiveAlertsAsync();
    Task<Alert> AddAlertAsync(Alert alert);
    Task AcknowledgeAlertAsync(long alertId, string acknowledgedBy);
    Task CleanupOldDataAsync(int retentionDays);
    
    // Audit
    Task AddAuditLogAsync(AuditLog auditLog);
    Task<List<AuditLog>> GetAuditLogsAsync(DateTime? from = null, DateTime? to = null, string? user = null, string? entityType = null);
    Task<AuditLog?> GetAuditLogAsync(long id);
    
    // User Credentials
    Task<UserCredential?> GetUserCredentialAsync(string username);
    Task<UserCredential> AddUserCredentialAsync(UserCredential user);
    Task UpdateUserCredentialAsync(UserCredential user);
}

public interface ICredentialStore
{
    Task StoreAsync(string key, string value);
    Task<string?> RetrieveAsync(string key);
    Task DeleteAsync(string key);
    Task<bool> ExistsAsync(string key);
}

public interface IAlertService
{
    Task CheckAlertsAsync(Device device, TrafficSample sample);
    Task<List<Alert>> GetActiveAlertsAsync();
    Task AcknowledgeAlertAsync(long alertId, string user);
    event EventHandler<Alert>? AlertTriggered;
}

public interface IPollingService
{
    Task StartAsync(CancellationToken cancellationToken = default);
    Task StopAsync();
    event EventHandler<DeviceStatus>? DeviceStatusChanged;
    event EventHandler<TrafficSample>? SampleCollected;
}

public interface IReportService
{
    Task<UsageReport> GenerateReportAsync(ReportParameters parameters);
    Task<byte[]> ExportCsvAsync(UsageReport report);
    Task<byte[]> ExportExcelAsync(UsageReport report);
}

public class ReportParameters
{
    public List<int> DeviceIds { get; set; } = new();
    public List<string> FriendNames { get; set; } = new();
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public ReportPeriod Period { get; set; } = ReportPeriod.ThisMonth;
    public bool IncludeHourly { get; set; } = false;
}

public class UsageReport
{
    public ReportParameters Parameters { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public List<UsageSummary> Summaries { get; set; } = new();
    public List<DailyUsagePoint> DailyData { get; set; } = new();
    public List<HourlyUsagePoint> HourlyData { get; set; } = new();
    public UsageComparison Comparison { get; set; } = new();
}

public class DailyUsagePoint
{
    public DateOnly Date { get; set; }
    public string FriendName { get; set; } = string.Empty;
    public long DownloadBytes { get; set; }
    public long UploadBytes { get; set; }
    public long TotalBytes { get; set; }
}

public class HourlyUsagePoint
{
    public DateTime Hour { get; set; }
    public string FriendName { get; set; } = string.Empty;
    public long DownloadBytes { get; set; }
    public long UploadBytes { get; set; }
    public long TotalBytes { get; set; }
}

public class UsageComparison
{
    public string FriendAName { get; set; } = string.Empty;
    public string FriendBName { get; set; } = string.Empty;
    public long FriendADownload { get; set; }
    public long FriendBDownload { get; set; }
    public long FriendAUpload { get; set; }
    public long FriendBUpload { get; set; }
    public long FriendATotal { get; set; }
    public long FriendBTotal { get; set; }
    public double FriendAPercentage => FriendATotal + FriendBTotal > 0 ? (double)FriendATotal / (FriendATotal + FriendBTotal) * 100 : 0;
    public double FriendBPercentage => FriendATotal + FriendBTotal > 0 ? (double)FriendBTotal / (FriendATotal + FriendBTotal) * 100 : 0;
}

public interface ISetupWizard
{
    Task<WizardResult> RunAsync();
    event EventHandler<WizardStep>? StepChanged;
}

public class WizardStep
{
    public int StepNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsComplete { get; set; }
    public bool HasError { get; set; }
    public string? ErrorMessage { get; set; }
}

public class WizardResult
{
    public bool Success { get; set; }
    public List<Device> ConfiguredDevices { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

public interface IDiagnosticService
{
    Task<DiagnosticResult> RunDiagnosticsAsync(int deviceId);
    Task<DiagnosticResult> RunFullDiagnosticsAsync();
}

public class DiagnosticResult
{
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public bool DeviceReachable { get; set; }
    public bool SnmpAvailable { get; set; }
    public string? SnmpVersion { get; set; }
    public List<NetworkInterface> Interfaces { get; set; } = new();
    public string? SelectedInterface { get; set; }
    public ulong CurrentInOctets { get; set; }
    public ulong CurrentOutOctets { get; set; }
    public DateTime? LastCounterChange { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}

public interface IAuditService
{
    Task LogAsync(string user, string action, string entityType, int? entityId, string oldValues, string newValues);
    Task<List<AuditLog>> GetAuditLogsAsync(DateTime? from = null, DateTime? to = null, string? user = null, string? entityType = null);
    Task<AuditLog?> GetAuditLogAsync(long id);
}

public interface IAuthService
{
    Task<bool> ValidateCredentialsAsync(string username, string password);
    Task<UserCredential?> GetUserAsync(string username);
    Task<UserCredential> CreateUserAsync(string username, string password, string role = "Admin");
    Task<bool> ChangePasswordAsync(string username, string oldPassword, string newPassword);
    Task<bool> IsLockedOutAsync(string username);
    Task RecordFailedAttemptAsync(string username);
    Task ResetFailedAttemptsAsync(string username);
}