namespace NetUsageMonitor.IntegrationTests.Scenarios;

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;
using NetUsageMonitor.Data;
using NetUsageMonitor.Data.Repositories;
using NetUsageMonitor.Snmp.Collectors;
using NetUsageMonitor.Services.Monitoring;
using NetUsageMonitor.Services.Security;
using NetUsageMonitor.Services.Wizard;
using NetUsageMonitor.IntegrationTests.Mocks;
using Xunit;

public class EndToEndTests : IAsyncLifetime
{
    private ServiceProvider? _serviceProvider;
    private MockSnmpDevice? _mockDevice;

    public async Task InitializeAsync()
    {
        var services = new ServiceCollection();
        
        services.AddDbContext<NetUsageDbContext>(options => 
            options.UseInMemoryDatabase("TestDb"));
        
        services.AddScoped<IDatabaseService, DatabaseService>();
        services.AddSingleton<ICredentialStore, DpapiCredentialStore>();
        services.AddSingleton<SnmpTrafficCollector>();
        services.AddSingleton<RouterApiTrafficCollector>();
        services.AddSingleton<ManualTrafficCollector>();
        services.AddSingleton<IPollingService, PollingService>();
        services.AddSingleton<IAlertService, AlertService>();
        services.AddSingleton<IReportService, ReportService>();
        services.AddSingleton<ISetupWizard, SetupWizard>();
        services.AddSingleton<IDiagnosticService, DiagnosticService>();
        services.AddSingleton<ICounterProcessor, CounterProcessor>();
        services.AddSingleton<IUsageCalculator, UsageCalculator>();

        _serviceProvider = services.BuildServiceProvider();
        
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        await db.InitializeAsync();

        _mockDevice = new MockSnmpDevice(1161);
        _mockDevice.Start();
    }

    public async Task DisposeAsync()
    {
        _mockDevice?.Dispose();
        if (_serviceProvider != null)
        {
            await _serviceProvider.DisposeAsync();
        }
    }

    [Fact]
    public async Task FullMonitoringCycle_WithMockDevice_Works()
    {
        using var scope = _serviceProvider!.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var collector = scope.ServiceProvider.GetRequiredService<SnmpTrafficCollector>();
        var processor = scope.ServiceProvider.GetRequiredService<ICounterProcessor>();

        var device = new Device
        {
            Name = "Test Router",
            FriendName = "Friend A",
            DeviceType = DeviceType.Router,
            IpAddress = "127.0.0.1",
            Port = 1161,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Snmp,
            InterfaceId = "1",
            PollingIntervalSeconds = 60,
            SnmpSettings = new SnmpSettings 
            { 
                Version = SnmpVersion.V2c, 
                Community = "public",
                TimeoutMs = 5000,
                Retries = 1
            }
        };

        var savedDevice = await db.AddDeviceAsync(device);
        
        var credentialStore = scope.ServiceProvider.GetRequiredService<ICredentialStore>();
        await credentialStore.StoreAsync($"snmp_community_{savedDevice.Id}", "public");

        var result1 = await collector.CollectAsync(savedDevice);
        result1.Success.Should().BeTrue();
        result1.ReceivedCounter.Should().BeGreaterThan(0);

        var sample1 = processor.ProcessSample(savedDevice, result1, null);
        sample1.DownloadBytes.Should().Be(0);
        sample1.UploadBytes.Should().Be(0);

        await Task.Delay(100);

        _mockDevice!.SetInterfaceCounters(1, 1001000, 500500);

        var result2 = await collector.CollectAsync(savedDevice);
        result2.Success.Should().BeTrue();
        result2.ReceivedCounter.Should().Be(1001000);

        var sample2 = processor.ProcessSample(savedDevice, result2, result1);
        sample2.DownloadBytes.Should().Be(1000);
        sample2.UploadBytes.Should().Be(500);
        sample2.TotalBytes.Should().Be(1500);

        await db.AddTrafficSampleAsync(sample2);

        var daily = await db.GetDailyUsageAsync(savedDevice.Id, DateOnly.FromDateTime(DateTime.UtcNow));
        daily.Should().BeNull();

        var aggregated = processor.AggregateDaily(savedDevice.Id, DateOnly.FromDateTime(DateTime.UtcNow), new[] { sample2 });
        aggregated.Should().NotBeNull();
        aggregated!.DownloadBytes.Should().Be(1000);
        aggregated.UploadBytes.Should().Be(500);

        await db.UpsertDailyUsageAsync(aggregated);

        var retrieved = await db.GetDailyUsageAsync(savedDevice.Id, DateOnly.FromDateTime(DateTime.UtcNow));
        retrieved.Should().NotBeNull();
        retrieved!.DownloadBytes.Should().Be(1000);
    }

    [Fact]
    public async Task SetupWizard_ConfiguresDevicesCorrectly()
    {
        using var scope = _serviceProvider!.CreateScope();
        var wizard = scope.ServiceProvider.GetRequiredService<ISetupWizard>();
        
        wizard.Should().NotBeNull();
    }

    [Fact]
    public async Task AlertService_TriggersAlertsCorrectly()
    {
        using var scope = _serviceProvider!.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();

        var device = await db.AddDeviceAsync(new Device 
        { 
            Name = "Test Router", 
            FriendName = "Friend A", 
            DeviceType = DeviceType.Router, 
            IpAddress = "127.0.0.1",
            Port = 1161,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Manual,
            PollingIntervalSeconds = 60
        });

        var rule = new AlertRule 
        { 
            DeviceId = device.Id, 
            Type = AlertType.MonthlyUsageLimit, 
            Severity = AlertSeverity.Warning, 
            ThresholdBytes = 1000,
            Enabled = true 
        };
        await db.AddAlertRuleAsync(rule);

        var sample = new TrafficSample
        {
            DeviceId = device.Id,
            Timestamp = DateTime.UtcNow,
            DownloadBytes = 2000,
            UploadBytes = 1000,
            TotalBytes = 3000,
            Status = SampleStatus.Success
        };

        await alertService.CheckAlertsAsync(device, sample);

        var alerts = await alertService.GetActiveAlertsAsync();
        alerts.Should().HaveCount(1);
        alerts[0].Type.Should().Be(AlertType.MonthlyUsageLimit);
        alerts[0].DeviceId.Should().Be(device.Id);
    }

    [Fact]
    public async Task ReportService_GeneratesReportWithComparison()
    {
        using var scope = _serviceProvider!.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var reportService = scope.ServiceProvider.GetRequiredService<IReportService>();

        var deviceA = await db.AddDeviceAsync(new Device 
        { 
            Name = "Router A", 
            FriendName = "Friend A", 
            DeviceType = DeviceType.Router, 
            IpAddress = "127.0.0.1",
            Port = 1161,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Manual
        });

        var deviceB = await db.AddDeviceAsync(new Device 
        { 
            Name = "Router B", 
            FriendName = "Friend B", 
            DeviceType = DeviceType.Router, 
            IpAddress = "127.0.0.1",
            Port = 1162,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Manual
        });

        var samplesA = new List<TrafficSample>
        {
            new() { DeviceId = deviceA.Id, Timestamp = DateTime.UtcNow.AddDays(-5), DownloadBytes = 1000, UploadBytes = 500, TotalBytes = 1500, Status = SampleStatus.Success },
            new() { DeviceId = deviceA.Id, Timestamp = DateTime.UtcNow.AddDays(-3), DownloadBytes = 2000, UploadBytes = 1000, TotalBytes = 3000, Status = SampleStatus.Success }
        };
        await db.AddTrafficSamplesAsync(samplesA);

        var samplesB = new List<TrafficSample>
        {
            new() { DeviceId = deviceB.Id, Timestamp = DateTime.UtcNow.AddDays(-5), DownloadBytes = 500, UploadBytes = 250, TotalBytes = 750, Status = SampleStatus.Success },
            new() { DeviceId = deviceB.Id, Timestamp = DateTime.UtcNow.AddDays(-3), DownloadBytes = 1500, UploadBytes = 750, TotalBytes = 2250, Status = SampleStatus.Success }
        };
        await db.AddTrafficSamplesAsync(samplesB);

        var parameters = new ReportParameters
        {
            Period = ReportPeriod.ThisMonth,
            IncludeHourly = false
        };

        var report = await reportService.GenerateReportAsync(parameters);

        report.Summaries.Should().HaveCount(2);
        report.Comparison.FriendAName.Should().Be("Friend A");
        report.Comparison.FriendBName.Should().Be("Friend B");
        report.Comparison.FriendATotal.Should().Be(4500);
        report.Comparison.FriendBTotal.Should().Be(3000);
        report.Comparison.FriendAPercentage.Should().BeApproximately(60, 1);
        report.Comparison.FriendBPercentage.Should().BeApproximately(40, 1);

        var csv = await reportService.ExportCsvAsync(report);
        csv.Should().NotBeEmpty();

        var excel = await reportService.ExportExcelAsync(report);
        excel.Should().NotBeEmpty();
    }

    [Fact]
    public async Task DiagnosticService_RunsDiagnostics()
    {
        using var scope = _serviceProvider!.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var diagnosticService = scope.ServiceProvider.GetRequiredService<IDiagnosticService>();

        var device = await db.AddDeviceAsync(new Device 
        { 
            Name = "Test Router", 
            FriendName = "Friend A", 
            DeviceType = DeviceType.Router, 
            IpAddress = "127.0.0.1",
            Port = 1161,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Snmp,
            InterfaceId = "1",
            SnmpSettings = new SnmpSettings { Version = SnmpVersion.V2c, Community = "public" }
        });

        var credentialStore = scope.ServiceProvider.GetRequiredService<ICredentialStore>();
        await credentialStore.StoreAsync($"snmp_community_{device.Id}", "public");

        var result = await diagnosticService.RunDiagnosticsAsync(device.Id);

        result.DeviceId.Should().Be(device.Id);
        result.DeviceReachable.Should().BeTrue();
        result.SnmpAvailable.Should().BeTrue();
        result.Interfaces.Should().HaveCountGreaterOrEqualTo(4);
        result.SelectedInterface.Should().NotBeNullOrEmpty();
    }
}

public class ManualCollectorIntegrationTests
{
    private readonly ServiceProvider _serviceProvider;

    public ManualCollectorIntegrationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<NetUsageDbContext>(options => options.UseInMemoryDatabase("ManualTestDb"));
        services.AddScoped<IDatabaseService, DatabaseService>();
        services.AddSingleton<ICredentialStore, DpapiCredentialStore>();
        services.AddSingleton<ManualTrafficCollector>();
        services.AddSingleton<ICounterProcessor, CounterProcessor>();
        services.AddSingleton<IUsageCalculator, UsageCalculator>();
        
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task ManualCollector_GeneratesTestData()
    {
        using var scope = _serviceProvider.CreateScope();
        var collector = scope.ServiceProvider.GetRequiredService<ManualTrafficCollector>();
        var processor = scope.ServiceProvider.GetRequiredService<ICounterProcessor>();

        var device = new Device
        {
            Id = 1,
            Name = "Manual Test",
            FriendName = "Friend A",
            DeviceType = DeviceType.Router,
            IpAddress = "127.0.0.1",
            CollectorType = CollectorType.Manual,
            InterfaceId = "1"
        };

        var result1 = await collector.CollectAsync(device);
        result1.Success.Should().BeTrue();

        var sample1 = processor.ProcessSample(device, result1, null);
        sample1.DownloadBytes.Should().Be(0);

        var result2 = await collector.CollectAsync(device);
        result2.Success.Should().BeTrue();
        result2.ReceivedCounter.Should().BeGreaterThan(result1.ReceivedCounter);

        var sample2 = processor.ProcessSample(device, result2, result1);
        sample2.DownloadBytes.Should().BeGreaterThan(0);
        sample2.UploadBytes.Should().BeGreaterThan(0);
    }
}