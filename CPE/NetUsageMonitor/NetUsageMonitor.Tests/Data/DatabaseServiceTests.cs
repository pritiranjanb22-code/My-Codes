namespace NetUsageMonitor.Tests.Data;

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Data;
using NetUsageMonitor.Data.Repositories;
using Xunit;

public class DatabaseServiceTests : IDisposable
{
    private readonly NetUsageDbContext _context;
    private readonly DatabaseService _service;
    private readonly Mock<ILogger<DatabaseService>> _loggerMock;

    public DatabaseServiceTests()
    {
        var options = new DbContextOptionsBuilder<NetUsageDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new NetUsageDbContext(options);
        _loggerMock = new Mock<ILogger<DatabaseService>>();
        _service = new DatabaseService(_context, _loggerMock.Object);
        _context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    [Fact]
    public async Task AddDeviceAsync_SavesDeviceToDatabase()
    {
        var device = new Device
        {
            Name = "Test Router",
            FriendName = "Friend A",
            DeviceType = DeviceType.Router,
            IpAddress = "192.168.1.1",
            Port = 161,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Snmp,
            PollingIntervalSeconds = 60
        };

        var saved = await _service.AddDeviceAsync(device);

        saved.Id.Should().BeGreaterThan(0);
        saved.Name.Should().Be("Test Router");
        saved.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task GetDeviceAsync_ReturnsDeviceWithSettings()
    {
        var device = new Device
        {
            Name = "Test Router",
            FriendName = "Friend A",
            DeviceType = DeviceType.Router,
            IpAddress = "192.168.1.1",
            SnmpSettings = new SnmpSettings { Version = SnmpVersion.V2c, Community = "public" }
        };
        await _service.AddDeviceAsync(device);

        var retrieved = await _service.GetDeviceAsync(device.Id);

        retrieved.Should().NotBeNull();
        retrieved!.Name.Should().Be("Test Router");
        retrieved.SnmpSettings.Should().NotBeNull();
        retrieved.SnmpSettings!.Community.Should().Be("public");
    }

    [Fact]
    public async Task GetAllDevicesAsync_ReturnsAllDevices()
    {
        await _service.AddDeviceAsync(new Device { Name = "Router1", FriendName = "Friend A", DeviceType = DeviceType.Router, IpAddress = "192.168.1.1" });
        await _service.AddDeviceAsync(new Device { Name = "Router2", FriendName = "Friend B", DeviceType = DeviceType.Router, IpAddress = "192.168.1.2" });

        var devices = await _service.GetAllDevicesAsync();

        devices.Should().HaveCount(2);
    }

    [Fact]
    public async Task UpdateDeviceAsync_UpdatesDeviceProperties()
    {
        var device = await _service.AddDeviceAsync(new Device { Name = "Original", FriendName = "Friend A", DeviceType = DeviceType.Router, IpAddress = "192.168.1.1" });
        
        device.Name = "Updated";
        device.MonitoringEnabled = false;
        var updated = await _service.UpdateDeviceAsync(device);

        updated.Name.Should().Be("Updated");
        updated.MonitoringEnabled.Should().BeFalse();
        updated.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteDeviceAsync_RemovesDevice()
    {
        var device = await _service.AddDeviceAsync(new Device { Name = "ToDelete", FriendName = "Friend A", DeviceType = DeviceType.Router, IpAddress = "192.168.1.1" });
        
        await _service.DeleteDeviceAsync(device.Id);

        var retrieved = await _service.GetDeviceAsync(device.Id);
        retrieved.Should().BeNull();
    }

    [Fact]
    public async Task AddTrafficSampleAsync_SavesSample()
    {
        var device = await _service.AddDeviceAsync(new Device { Name = "Router", FriendName = "Friend A", DeviceType = DeviceType.Router, IpAddress = "192.168.1.1" });
        
        var sample = new TrafficSample
        {
            DeviceId = device.Id,
            Timestamp = DateTime.UtcNow,
            ReceivedCounter = 1000,
            TransmittedCounter = 500,
            DownloadBytes = 1000,
            UploadBytes = 500,
            TotalBytes = 1500,
            Status = SampleStatus.Success
        };

        await _service.AddTrafficSampleAsync(sample);

        var samples = await _service.GetTrafficSamplesAsync(device.Id, DateTime.UtcNow.AddMinutes(-5), DateTime.UtcNow.AddMinutes(5));
        samples.Should().HaveCount(1);
        samples[0].DownloadBytes.Should().Be(1000);
    }

    [Fact]
    public async Task UpsertDailyUsageAsync_CreatesOrUpdatesDailyUsage()
    {
        var device = await _service.AddDeviceAsync(new Device { Name = "Router", FriendName = "Friend A", DeviceType = DeviceType.Router, IpAddress = "192.168.1.1" });
        var date = DateOnly.FromDateTime(DateTime.UtcNow);

        await _service.UpsertDailyUsageAsync(new DailyUsage { DeviceId = device.Id, Date = date, DownloadBytes = 1000, UploadBytes = 500, TotalBytes = 1500 });
        
        var daily = await _service.GetDailyUsageAsync(device.Id, date);
        daily.Should().NotBeNull();
        daily!.DownloadBytes.Should().Be(1000);

        await _service.UpsertDailyUsageAsync(new DailyUsage { DeviceId = device.Id, Date = date, DownloadBytes = 2000, UploadBytes = 1000, TotalBytes = 3000 });
        
        daily = await _service.GetDailyUsageAsync(device.Id, date);
        daily!.DownloadBytes.Should().Be(2000);
    }

    [Fact]
    public async Task UpsertMonthlyUsageAsync_CreatesOrUpdatesMonthlyUsage()
    {
        var device = await _service.AddDeviceAsync(new Device { Name = "Router", FriendName = "Friend A", DeviceType = DeviceType.Router, IpAddress = "192.168.1.1" });
        var now = DateTime.UtcNow;

        await _service.UpsertMonthlyUsageAsync(new MonthlyUsage { DeviceId = device.Id, Year = now.Year, Month = now.Month, DownloadBytes = 1000, UploadBytes = 500, TotalBytes = 1500 });
        
        var monthly = await _service.GetMonthlyUsageAsync(device.Id, now.Year, now.Month);
        monthly.Should().NotBeNull();
        monthly!.DownloadBytes.Should().Be(1000);
    }

    [Fact]
    public async Task GetSettingsAsync_ReturnsDefaultSettings()
    {
        var settings = await _service.GetSettingsAsync();

        settings.Should().NotBeNull();
        settings.Id.Should().Be(1);
        settings.DefaultPollingIntervalSeconds.Should().Be(60);
    }

    [Fact]
    public async Task UpdateSettingsAsync_UpdatesSettings()
    {
        var settings = await _service.GetSettingsAsync();
        settings.DefaultPollingIntervalSeconds = 120;
        settings.Theme = ThemeMode.Dark;

        await _service.UpdateSettingsAsync(settings);

        var retrieved = await _service.GetSettingsAsync();
        retrieved.DefaultPollingIntervalSeconds.Should().Be(120);
        retrieved.Theme.Should().Be(ThemeMode.Dark);
    }

    [Fact]
    public async Task AlertRuleOperations_WorkCorrectly()
    {
        var device = await _service.AddDeviceAsync(new Device { Name = "Router", FriendName = "Friend A", DeviceType = DeviceType.Router, IpAddress = "192.168.1.1" });
        
        var rule = new AlertRule { DeviceId = device.Id, Type = AlertType.MonthlyUsageLimit, ThresholdBytes = 100_000_000_000 };
        var saved = await _service.AddAlertRuleAsync(rule);

        saved.Id.Should().BeGreaterThan(0);

        var rules = await _service.GetAlertRulesAsync(device.Id);
        rules.Should().HaveCount(1);

        rule.ThresholdBytes = 200_000_000_000;
        await _service.UpdateAlertRuleAsync(rule);

        rules = await _service.GetAlertRulesAsync(device.Id);
        rules[0].ThresholdBytes.Should().Be(200_000_000_000);

        await _service.DeleteAlertRuleAsync(rule.Id);
        rules = await _service.GetAlertRulesAsync(device.Id);
        rules.Should().BeEmpty();
    }
}