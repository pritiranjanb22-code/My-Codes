namespace NetUsageMonitor.Core.Models;

public class Device
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FriendName { get; set; } = string.Empty;
    public DeviceType DeviceType { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public int Port { get; set; } = 161;
    public bool MonitoringEnabled { get; set; } = true;
    public CollectorType CollectorType { get; set; } = CollectorType.Snmp;
    public string? InterfaceId { get; set; }
    public string? InterfaceName { get; set; }
    public string? InterfaceDescription { get; set; }
    public long? InterfaceSpeed { get; set; }
    public bool ReverseDirection { get; set; } = false;
    public int PollingIntervalSeconds { get; set; } = 60;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSuccessfulPoll { get; set; }
    public DateTime? LastFailedPoll { get; set; }
    public string? LastError { get; set; }
    public int ConsecutiveFailures { get; set; } = 0;
    
    public SnmpSettings? SnmpSettings { get; set; }
    public RouterApiSettings? RouterApiSettings { get; set; }
    public List<TrafficSample> TrafficSamples { get; set; } = new();
    public List<DailyUsage> DailyUsage { get; set; } = new();
    public List<MonthlyUsage> MonthlyUsage { get; set; } = new();
    public List<AlertRule> AlertRules { get; set; } = new();
}

public class SnmpSettings
{
    public int Id { get; set; }
    public int DeviceId { get; set; }
    public SnmpVersion Version { get; set; } = SnmpVersion.V2c;
    public string Community { get; set; } = "public";
    public string? Username { get; set; }
    public string? AuthProtocol { get; set; }
    public string? AuthPassword { get; set; }
    public string? PrivProtocol { get; set; }
    public string? PrivPassword { get; set; }
    public int TimeoutMs { get; set; } = 5000;
    public int Retries { get; set; } = 2;
    public Device? Device { get; set; }
}

public class RouterApiSettings
{
    public int Id { get; set; }
    public int DeviceId { get; set; }
    public string ApiType { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? ApiKey { get; set; }
    public Dictionary<string, string> CustomHeaders { get; set; } = new();
    public Device? Device { get; set; }
}

public class TrafficSample
{
    public long Id { get; set; }
    public int DeviceId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public ulong ReceivedCounter { get; set; }
    public ulong TransmittedCounter { get; set; }
    public long DownloadBytes { get; set; }
    public long UploadBytes { get; set; }
    public long TotalBytes { get; set; }
    public SampleStatus Status { get; set; } = SampleStatus.Success;
    public string? ErrorMessage { get; set; }
    public double? LatencyMs { get; set; }
    public Device? Device { get; set; }
}

public class DailyUsage
{
    public long Id { get; set; }
    public int DeviceId { get; set; }
    public DateOnly Date { get; set; }
    public long DownloadBytes { get; set; }
    public long UploadBytes { get; set; }
    public long TotalBytes { get; set; }
    public Device? Device { get; set; }
}

public class MonthlyUsage
{
    public long Id { get; set; }
    public int DeviceId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public long DownloadBytes { get; set; }
    public long UploadBytes { get; set; }
    public long TotalBytes { get; set; }
    public Device? Device { get; set; }
}

public class AlertRule
{
    public int Id { get; set; }
    public int DeviceId { get; set; }
    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; } = AlertSeverity.Warning;
    public long ThresholdBytes { get; set; }
    public bool Enabled { get; set; } = true;
    public bool NotifyWindows { get; set; } = true;
    public bool NotifyInApp { get; set; } = true;
    public DateTime? LastTriggered { get; set; }
    public int TriggerCount { get; set; } = 0;
    public Device? Device { get; set; }
}

public class Alert
{
    public long Id { get; set; }
    public int? DeviceId { get; set; }
    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcknowledgedAt { get; set; }
    public string? AcknowledgedBy { get; set; }
    public bool IsActive { get; set; } = true;
    public Device? Device { get; set; }
}

public class ApplicationSettings
{
    public int Id { get; set; } = 1;
    public int DefaultPollingIntervalSeconds { get; set; } = 60
    public DataUnit DefaultUnits { get; set; } = DataUnit.Gigabytes;
    public bool UseBinaryUnits { get; set; } = false;
    public int RetentionDays { get; set; } = 365;
    public ThemeMode Theme { get; set; } = ThemeMode.System;
    public bool NotificationsEnabled { get; set; } = true;
    public bool StartMinimized { get; set; } = false;
    public bool MinimizeToTray { get; set; } = true;
    public bool AutoStartMonitoring { get; set; } = true;
    public string? Language { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class NetworkInterface
{
    public string Index { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public long Speed { get; set; }
    public bool IsUp { get; set; }
    public bool IsWan { get; set; }
    public ulong InOctets { get; set; }
    public ulong OutOctets { get; set; }
    public ulong HCInOctets { get; set; }
    public ulong HCOutOctets { get; set; }
}

public class TrafficRate
{
    public DateTime Timestamp { get; set; }
    public double DownloadBps { get; set; }
    public double UploadBps { get; set; }
    public double TotalBps { get; set; }
}

public class UsageSummary
{
    public string FriendName { get; set; } = string.Empty;
    public long DownloadBytes { get; set; }
    public long UploadBytes { get; set; }
    public long TotalBytes { get; set; }
    public double PeakDownloadMbps { get; set; }
    public double PeakUploadMbps { get; set; }
    public double AverageDailyDownloadMbps { get; set; }
    public double AverageDailyUploadMbps { get; set; }
    public int DaysWithData { get; set; }
    public DateTime? PeriodStart { get; set; }
    public DateTime? PeriodEnd { get; set; }
}

public class DeviceStatus
{
    public int DeviceId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string FriendName { get; set; } = string.Empty;
    public bool IsOnline { get; set; }
    public DateTime? LastPoll { get; set; }
    public DateTime? LastSuccess { get; set; }
    public string? LastError { get; set; }
    public int ConsecutiveFailures { get; set; }
    public double CurrentDownloadMbps { get; set; }
    public double CurrentUploadMbps { get; set; }
    public ulong CurrentInOctets { get; set; }
    public ulong CurrentOutOctets { get; set; }
    public bool InterfaceUp { get; set; }
    public long InterfaceSpeed { get; set; }
}

public class AuditLog
{
    public long Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string User { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string OldValues { get; set; } = string.Empty;
    public string NewValues { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}

public class UserCredential
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Salt { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLogin { get; set; }
    public int FailedAttempts { get; set; } = 0;
    public DateTime? LockoutUntil { get; set; }
}