namespace NetUsageMonitor.Services.Monitoring;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Snmp.Collectors;

public class PollingService : BackgroundService, IPollingService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PollingService> _logger;
    private readonly Dictionary<int, ITrafficCollector> _collectors = new();
    private readonly Dictionary<int, CollectorResult?> _lastResults = new();
    private readonly Dictionary<int, CancellationTokenSource> _deviceCancellations = new();
    private readonly SemaphoreSlim _collectionLock = new(1, 1);
    private volatile bool _isRunning = false;

    public event EventHandler<DeviceStatus>? DeviceStatusChanged;
    public event EventHandler<TrafficSample>? SampleCollected;

    public PollingService(IServiceProvider serviceProvider, ILogger<PollingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        if (_isRunning)
            return;

        _isRunning = true;
        _logger.LogInformation("Starting polling service");
        
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var devices = await db.GetAllDevicesAsync();
        
        foreach (var device in devices.Where(d => d.MonitoringEnabled))
        {
            await StartDevicePollingAsync(device, scope.ServiceProvider);
        }

        await base.StartAsync(cancellationToken);
    }

    public async Task StopAsync()
    {
        if (!_isRunning)
            return;

        _isRunning = false;
        _logger.LogInformation("Stopping polling service");

        foreach (var cts in _deviceCancellations.Values)
        {
            cts.Cancel();
        }
        
        await Task.WhenAll(_deviceCancellations.Values.Select(cts => cts.Token.WaitHandle.WaitOneAsync(TimeSpan.FromSeconds(5))));
        _deviceCancellations.Clear();
        _collectors.Clear();
        _lastResults.Clear();

        await base.StopAsync(CancellationToken.None);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested && _isRunning)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
            var devices = await db.GetAllDevicesAsync();

            foreach (var device in devices.Where(d => d.MonitoringEnabled))
            {
                if (!_deviceCancellations.ContainsKey(device.Id))
                {
                    await StartDevicePollingAsync(device, scope.ServiceProvider);
                }
            }

            var activeDeviceIds = devices.Where(d => d.MonitoringEnabled).Select(d => d.Id).ToHashSet();
            var toRemove = _deviceCancellations.Keys.Where(id => !activeDeviceIds.Contains(id)).ToList();
            
            foreach (var id in toRemove)
            {
                StopDevicePolling(id);
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task StartDevicePollingAsync(Device device, IServiceProvider serviceProvider)
    {
        var collector = CreateCollector(device, serviceProvider);
        if (collector == null)
        {
            _logger.LogWarning("No collector available for device {DeviceId} ({CollectorType})", device.Id, device.CollectorType);
            return;
        }

        _collectors[device.Id] = collector;
        _lastResults[device.Id] = null;
        var cts = CancellationTokenSource.CreateLinkedTokenSource();
        _deviceCancellations[device.Id] = cts;

        _ = Task.Run(async () => await PollDeviceLoopAsync(device, collector, cts.Token), cts.Token);
    }

    private void StopDevicePolling(int deviceId)
    {
        if (_deviceCancellations.TryGetValue(deviceId, out var cts))
        {
            cts.Cancel();
            _deviceCancellations.Remove(deviceId);
        }
        _collectors.Remove(deviceId);
        _lastResults.Remove(deviceId);
    }

    private ITrafficCollector? CreateCollector(Device device, IServiceProvider serviceProvider)
    {
        return device.CollectorType switch
        {
            CollectorType.Snmp => serviceProvider.GetRequiredService<SnmpTrafficCollector>(),
            CollectorType.RouterApi => serviceProvider.GetRequiredService<RouterApiTrafficCollector>(),
            CollectorType.Manual => serviceProvider.GetRequiredService<ManualTrafficCollector>(),
            _ => null
        };
    }

    private async Task PollDeviceLoopAsync(Device device, ITrafficCollector collector, CancellationToken cancellationToken)
    {
        var interval = TimeSpan.FromSeconds(device.PollingIntervalSeconds > 0 ? device.PollingIntervalSeconds : 60);
        
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                await PollDeviceOnceAsync(device, collector, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error polling device {DeviceId}", device.Id);
                await UpdateDeviceStatusAsync(device, new DeviceStatus
                {
                    DeviceId = device.Id,
                    DeviceName = device.Name,
                    FriendName = device.FriendName,
                    IsOnline = false,
                    LastError = ex.Message,
                    ConsecutiveFailures = device.ConsecutiveFailures + 1
                });
            }

            try
            {
                await Task.Delay(interval, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task PollDeviceOnceAsync(Device device, ITrafficCollector collector, CancellationToken cancellationToken)
    {
        var result = await collector.CollectAsync(device, cancellationToken);
        
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var processor = scope.ServiceProvider.GetRequiredService<ICounterProcessor>();
        var alertService = scope.ServiceProvider.GetRequiredService<IAlertService>();

        var previous = _lastResults.GetValueOrDefault(device.Id);
        var sample = processor.ProcessSample(device, result, previous);
        
        _lastResults[device.Id] = result;

        await db.AddTrafficSampleAsync(sample);
        
        var deviceStatus = new DeviceStatus
        {
            DeviceId = device.Id,
            DeviceName = device.Name,
            FriendName = device.FriendName,
            IsOnline = result.Success,
            LastPoll = DateTime.UtcNow,
            LastSuccess = result.Success ? DateTime.UtcNow : device.LastSuccessfulPoll,
            LastError = result.ErrorMessage,
            ConsecutiveFailures = result.Success ? 0 : device.ConsecutiveFailures + 1,
            CurrentDownloadMbps = CalculateMbps(sample.DownloadBytes, device.PollingIntervalSeconds),
            CurrentUploadMbps = CalculateMbps(sample.UploadBytes, device.PollingIntervalSeconds),
            CurrentInOctets = result.ReceivedCounter,
            CurrentOutOctets = result.TransmittedCounter,
            InterfaceUp = result.InterfaceUp,
            InterfaceSpeed = result.InterfaceSpeed
        };

        if (result.Success)
        {
            device.LastSuccessfulPoll = DateTime.UtcNow;
            device.ConsecutiveFailures = 0;
            device.LastError = null;
        }
        else
        {
            device.LastFailedPoll = DateTime.UtcNow;
            device.ConsecutiveFailures++;
            device.LastError = result.ErrorMessage;
        }

        await db.UpdateDeviceAsync(device);
        await alertService.CheckAlertsAsync(device, sample);

        DeviceStatusChanged?.Invoke(this, deviceStatus);
        SampleCollected?.Invoke(this, sample);
    }

    private static double CalculateMbps(long bytes, int intervalSeconds)
    {
        if (intervalSeconds <= 0) return 0;
        return bytes * 8.0 / (intervalSeconds * 1_000_000);
    }

    private async Task UpdateDeviceStatusAsync(Device device, DeviceStatus status)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        
        device.LastFailedPoll = DateTime.UtcNow;
        device.ConsecutiveFailures = status.ConsecutiveFailures;
        device.LastError = status.LastError;
        await db.UpdateDeviceAsync(device);
        
        DeviceStatusChanged?.Invoke(this, status);
    }
}