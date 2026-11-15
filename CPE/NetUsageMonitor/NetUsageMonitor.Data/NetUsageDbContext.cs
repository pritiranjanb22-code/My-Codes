namespace NetUsageMonitor.Data;

using Microsoft.EntityFrameworkCore;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Data.Configurations;

public class NetUsageDbContext : DbContext
{
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<SnmpSettings> SnmpSettings => Set<SnmpSettings>();
    public DbSet<RouterApiSettings> RouterApiSettings => Set<RouterApiSettings>();
    public DbSet<TrafficSample> TrafficSamples => Set<TrafficSample>();
    public DbSet<DailyUsage> DailyUsage => Set<DailyUsage>();
    public DbSet<MonthlyUsage> MonthlyUsage => Set<MonthlyUsage>();
    public DbSet<AlertRule> AlertRules => Set<AlertRule>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<ApplicationSettings> ApplicationSettings => Set<ApplicationSettings>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<UserCredential> UserCredentials => Set<UserCredential>();

    public NetUsageDbContext(DbContextOptions<NetUsageDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.ApplyConfiguration(new DeviceConfiguration());
        modelBuilder.ApplyConfiguration(new SnmpSettingsConfiguration());
        modelBuilder.ApplyConfiguration(new RouterApiSettingsConfiguration());
        modelBuilder.ApplyConfiguration(new TrafficSampleConfiguration());
        modelBuilder.ApplyConfiguration(new DailyUsageConfiguration());
        modelBuilder.ApplyConfiguration(new MonthlyUsageConfiguration());
        modelBuilder.ApplyConfiguration(new AlertRuleConfiguration());
        modelBuilder.ApplyConfiguration(new AlertConfiguration());
        modelBuilder.ApplyConfiguration(new ApplicationSettingsConfiguration());
        modelBuilder.ApplyConfiguration(new AuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new UserCredentialConfiguration());
        
        modelBuilder.Entity<ApplicationSettings>().HasData(
            new ApplicationSettings { Id = 1 }
        );
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            var dbPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "NetUsageMonitor",
                "netusagemonitor.db");
            
            Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
            optionsBuilder.UseSqlite($"Data Source={dbPath}");
        }
    }
}

public class NetUsageDbContextFactory : IDesignTimeDbContextFactory<NetUsageDbContext>
{
    public NetUsageDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<NetUsageDbContext>();
        var dbPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "NetUsageMonitor",
            "netusagemonitor.db");
        
        Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
        optionsBuilder.UseSqlite($"Data Source={dbPath}");
        return new NetUsageDbContext(optionsBuilder.Options);
    }
}