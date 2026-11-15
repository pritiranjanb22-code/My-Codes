namespace NetUsageMonitor.Data.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;

public class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    public void Configure(EntityTypeBuilder<Device> builder)
    {
        builder.ToTable("Devices");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).ValueGeneratedOnAdd();
        builder.Property(d => d.Name).IsRequired().HasMaxLength(100);
        builder.Property(d => d.FriendName).IsRequired().HasMaxLength(100);
        builder.Property(d => d.DeviceType).IsRequired().HasConversion<int>();
        builder.Property(d => d.IpAddress).IsRequired().HasMaxLength(45);
        builder.Property(d => d.Port).IsRequired().HasDefaultValue(161);
        builder.Property(d => d.MonitoringEnabled).IsRequired().HasDefaultValue(true);
        builder.Property(d => d.CollectorType).IsRequired().HasConversion<int>();
        builder.Property(d => d.InterfaceId).HasMaxLength(50);
        builder.Property(d => d.InterfaceName).HasMaxLength(100);
        builder.Property(d => d.InterfaceDescription).HasMaxLength(255);
        builder.Property(d => d.InterfaceSpeed).IsRequired(false);
        builder.Property(d => d.ReverseDirection).IsRequired().HasDefaultValue(false);
        builder.Property(d => d.PollingIntervalSeconds).IsRequired().HasDefaultValue(60);
        builder.Property(d => d.CreatedAt).IsRequired().HasDefaultValueSql("datetime('now')");
        builder.Property(d => d.UpdatedAt).IsRequired(false);
        builder.Property(d => d.LastSuccessfulPoll).IsRequired(false);
        builder.Property(d => d.LastFailedPoll).IsRequired(false);
        builder.Property(d => d.LastError).HasMaxLength(500);
        builder.Property(d => d.ConsecutiveFailures).IsRequired().HasDefaultValue(0);
        
        builder.HasIndex(d => d.FriendName);
        builder.HasIndex(d => d.IpAddress);
        builder.HasIndex(d => d.MonitoringEnabled);
        
        builder.HasOne(d => d.SnmpSettings)
            .WithOne(s => s.Device!)
            .HasForeignKey<SnmpSettings>(s => s.DeviceId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasOne(d => d.RouterApiSettings)
            .WithOne(r => r.Device!)
            .HasForeignKey<RouterApiSettings>(r => r.DeviceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SnmpSettingsConfiguration : IEntityTypeConfiguration<SnmpSettings>
{
    public void Configure(EntityTypeBuilder<SnmpSettings> builder)
    {
        builder.ToTable("SnmpSettings");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedOnAdd();
        builder.Property(s => s.DeviceId).IsRequired();
        builder.Property(s => s.Version).IsRequired().HasConversion<int>().HasDefaultValue(SnmpVersion.V2c);
        builder.Property(s => s.Community).HasMaxLength(100).HasDefaultValue("public");
        builder.Property(s => s.Username).HasMaxLength(100);
        builder.Property(s => s.AuthProtocol).HasMaxLength(50);
        builder.Property(s => s.AuthPassword).HasMaxLength(255);
        builder.Property(s => s.PrivProtocol).HasMaxLength(50);
        builder.Property(s => s.PrivPassword).HasMaxLength(255);
        builder.Property(s => s.TimeoutMs).IsRequired().HasDefaultValue(5000);
        builder.Property(s => s.Retries).IsRequired().HasDefaultValue(2);
    }
}

public class RouterApiSettingsConfiguration : IEntityTypeConfiguration<RouterApiSettings>
{
    public void Configure(EntityTypeBuilder<RouterApiSettings> builder)
    {
        builder.ToTable("RouterApiSettings");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedOnAdd();
        builder.Property(r => r.DeviceId).IsRequired();
        builder.Property(r => r.ApiType).IsRequired().HasMaxLength(50);
        builder.Property(r => r.BaseUrl).IsRequired().HasMaxLength(255);
        builder.Property(r => r.Username).HasMaxLength(100);
        builder.Property(r => r.Password).HasMaxLength(255);
        builder.Property(r => r.ApiKey).HasMaxLength(255);
        
        builder.Property(r => r.CustomHeaders)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
            .HasColumnType("TEXT");
    }
}

public class TrafficSampleConfiguration : IEntityTypeConfiguration<TrafficSample>
{
    public void Configure(EntityTypeBuilder<TrafficSample> builder)
    {
        builder.ToTable("TrafficSamples");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).ValueGeneratedOnAdd();
        builder.Property(t => t.DeviceId).IsRequired();
        builder.Property(t => t.Timestamp).IsRequired().HasDefaultValueSql("datetime('now')");
        builder.Property(t => t.ReceivedCounter).IsRequired().HasDefaultValue(0UL);
        builder.Property(t => t.TransmittedCounter).IsRequired().HasDefaultValue(0UL);
        builder.Property(t => t.DownloadBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(t => t.UploadBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(t => t.TotalBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(t => t.Status).IsRequired().HasConversion<int>().HasDefaultValue(SampleStatus.Success);
        builder.Property(t => t.ErrorMessage).HasMaxLength(500);
        builder.Property(t => t.LatencyMs).IsRequired(false);
        
        builder.HasIndex(t => new { t.DeviceId, t.Timestamp });
        builder.HasIndex(t => t.Timestamp);
        builder.HasIndex(t => t.Status);
        
        builder.HasOne(t => t.Device)
            .WithMany(d => d.TrafficSamples)
            .HasForeignKey(t => t.DeviceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class DailyUsageConfiguration : IEntityTypeConfiguration<DailyUsage>
{
    public void Configure(EntityTypeBuilder<DailyUsage> builder)
    {
        builder.ToTable("DailyUsage");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).ValueGeneratedOnAdd();
        builder.Property(d => d.DeviceId).IsRequired();
        builder.Property(d => d.Date).IsRequired().HasConversion(
            v => v.ToString("yyyy-MM-dd"),
            v => DateOnly.Parse(v));
        builder.Property(d => d.DownloadBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(d => d.UploadBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(d => d.TotalBytes).IsRequired().HasDefaultValue(0L);
        
        builder.HasIndex(d => new { d.DeviceId, d.Date }).IsUnique();
        builder.HasIndex(d => d.Date);
        
        builder.HasOne(d => d.Device)
            .WithMany(d => d.DailyUsage)
            .HasForeignKey(d => d.DeviceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MonthlyUsageConfiguration : IEntityTypeConfiguration<MonthlyUsage>
{
    public void Configure(EntityTypeBuilder<MonthlyUsage> builder)
    {
        builder.ToTable("MonthlyUsage");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedOnAdd();
        builder.Property(m => m.DeviceId).IsRequired();
        builder.Property(m => m.Year).IsRequired();
        builder.Property(m => m.Month).IsRequired();
        builder.Property(m => m.DownloadBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(m => m.UploadBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(m => m.TotalBytes).IsRequired().HasDefaultValue(0L);
        
        builder.HasIndex(m => new { m.DeviceId, m.Year, m.Month }).IsUnique();
        builder.HasIndex(m => new { m.Year, m.Month });
        
        builder.HasOne(m => m.Device)
            .WithMany(d => d.MonthlyUsage)
            .HasForeignKey(m => m.DeviceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AlertRuleConfiguration : IEntityTypeConfiguration<AlertRule>
{
    public void Configure(EntityTypeBuilder<AlertRule> builder)
    {
        builder.ToTable("AlertRules");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();
        builder.Property(a => a.DeviceId).IsRequired();
        builder.Property(a => a.Type).IsRequired().HasConversion<int>();
        builder.Property(a => a.Severity).IsRequired().HasConversion<int>().HasDefaultValue(AlertSeverity.Warning);
        builder.Property(a => a.ThresholdBytes).IsRequired().HasDefaultValue(0L);
        builder.Property(a => a.Enabled).IsRequired().HasDefaultValue(true);
        builder.Property(a => a.NotifyWindows).IsRequired().HasDefaultValue(true);
        builder.Property(a => a.NotifyInApp).IsRequired().HasDefaultValue(true);
        builder.Property(a => a.LastTriggered).IsRequired(false);
        builder.Property(a => a.TriggerCount).IsRequired().HasDefaultValue(0);
        
        builder.HasIndex(a => new { a.DeviceId, a.Type });
        
        builder.HasOne(a => a.Device)
            .WithMany(d => d.AlertRules)
            .HasForeignKey(a => a.DeviceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AlertConfiguration : IEntityTypeConfiguration<Alert>
{
    public void Configure(EntityTypeBuilder<Alert> builder)
    {
        builder.ToTable("Alerts");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();
        builder.Property(a => a.DeviceId).IsRequired(false);
        builder.Property(a => a.Type).IsRequired().HasConversion<int>();
        builder.Property(a => a.Severity).IsRequired().HasConversion<int>();
        builder.Property(a => a.Title).IsRequired().HasMaxLength(200);
        builder.Property(a => a.Message).IsRequired().HasMaxLength(1000);
        builder.Property(a => a.CreatedAt).IsRequired().HasDefaultValueSql("datetime('now')");
        builder.Property(a => a.AcknowledgedAt).IsRequired(false);
        builder.Property(a => a.AcknowledgedBy).HasMaxLength(100);
        builder.Property(a => a.IsActive).IsRequired().HasDefaultValue(true);
        
        builder.HasIndex(a => a.IsActive);
        builder.HasIndex(a => a.CreatedAt);
        builder.HasIndex(a => a.DeviceId);
        
        builder.HasOne(a => a.Device)
            .WithMany()
            .HasForeignKey(a => a.DeviceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class ApplicationSettingsConfiguration : IEntityTypeConfiguration<ApplicationSettings>
{
    public void Configure(EntityTypeBuilder<ApplicationSettings> builder)
    {
        builder.ToTable("ApplicationSettings");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.Property(a => a.DefaultPollingIntervalSeconds).IsRequired().HasDefaultValue(60);
        builder.Property(a => a.DefaultUnits).IsRequired().HasConversion<int>().HasDefaultValue(DataUnit.Gigabytes);
        builder.Property(a => a.UseBinaryUnits).IsRequired().HasDefaultValue(false);
        builder.Property(a => a.RetentionDays).IsRequired().HasDefaultValue(365);
        builder.Property(a => a.Theme).IsRequired().HasConversion<int>().HasDefaultValue(ThemeMode.System);
        builder.Property(a => a.NotificationsEnabled).IsRequired().HasDefaultValue(true);
        builder.Property(a => a.StartMinimized).IsRequired().HasDefaultValue(false);
        builder.Property(a => a.MinimizeToTray).IsRequired().HasDefaultValue(true);
        builder.Property(a => a.AutoStartMonitoring).IsRequired().HasDefaultValue(true);
        builder.Property(a => a.Language).HasMaxLength(10);
        builder.Property(a => a.UpdatedAt).IsRequired().HasDefaultValueSql("datetime('now')");
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();
        builder.Property(a => a.Timestamp).IsRequired().HasDefaultValueSql("datetime('now')");
        builder.Property(a => a.User).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
        builder.Property(a => a.EntityType).IsRequired().HasMaxLength(50);
        builder.Property(a => a.EntityId).IsRequired(false);
        builder.Property(a => a.OldValues).HasColumnType("TEXT");
        builder.Property(a => a.NewValues).HasColumnType("TEXT");
        builder.Property(a => a.IpAddress).HasMaxLength(45);
        
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.User);
        builder.HasIndex(a => new { a.EntityType, a.EntityId });
    }
}

public class UserCredentialConfiguration : IEntityTypeConfiguration<UserCredential>
{
    public void Configure(EntityTypeBuilder<UserCredential> builder)
    {
        builder.ToTable("UserCredentials");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedOnAdd();
        builder.Property(u => u.Username).IsRequired().HasMaxLength(100);
        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
        builder.Property(u => u.Salt).IsRequired().HasMaxLength(255);
        builder.Property(u => u.Role).IsRequired().HasMaxLength(20).HasDefaultValue("Admin");
        builder.Property(u => u.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(u => u.CreatedAt).IsRequired().HasDefaultValueSql("datetime('now')");
        builder.Property(u => u.LastLogin).IsRequired(false);
        builder.Property(u => u.FailedAttempts).IsRequired().HasDefaultValue(0);
        builder.Property(u => u.LockoutUntil).IsRequired(false);
        
        builder.HasIndex(u => u.Username).IsUnique();
    }
}