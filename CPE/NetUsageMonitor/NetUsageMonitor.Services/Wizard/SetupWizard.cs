namespace NetUsageMonitor.Services.Wizard;

using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Snmp.Collectors;

public class SetupWizard : ISetupWizard
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SetupWizard> _logger;
    private int _currentStep = 0;
    private readonly List<Device> _configuredDevices = new();

    public event EventHandler<WizardStep>? StepChanged;

    public SetupWizard(IServiceProvider serviceProvider, ILogger<SetupWizard> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<WizardResult> RunAsync()
    {
        try
        {
            _configuredDevices.Clear();
            
            await RunStepAsync(1, "Add Router A", "Configure the first router (Friend A)", async () =>
            {
                var device = await ConfigureDeviceAsync("Friend A", "Router A");
                if (device != null) _configuredDevices.Add(device);
            });

            await RunStepAsync(2, "Add Router B", "Configure the second router (Friend B)", async () =>
            {
                var device = await ConfigureDeviceAsync("Friend B", "Router B");
                if (device != null) _configuredDevices.Add(device);
            });

            await RunStepAsync(3, "Test Connectivity", "Verify both routers are reachable", async () =>
            {
                foreach (var device in _configuredDevices)
                {
                    using var scope = _serviceProvider.CreateScope();
                    var collector = GetCollector(device, scope.ServiceProvider);
                    if (collector != null)
                    {
                        var result = await collector.TestConnectionAsync(device);
                        if (!result)
                            throw new InvalidOperationException($"Cannot connect to {device.GetDisplayName()}");
                    }
                }
            });

            await RunStepAsync(4, "Discover Interfaces", "Find available network interfaces on each router", async () =>
            {
                foreach (var device in _configuredDevices)
                {
                    using var scope = _serviceProvider.CreateScope();
                    var collector = GetCollector(device, scope.ServiceProvider);
                    if (collector != null)
                    {
                        var interfaces = await collector.DiscoverInterfacesAsync(device);
                        device.Interfaces = interfaces; // Assuming we add this property
                    }
                }
            });

            await RunStepAsync(5, "Select WAN Interface", "Choose the internet-facing interface for each router", async () =>
            {
                // This would be handled in UI - user selects from discovered interfaces
                // For now, we assume the first WAN-like interface
                foreach (var device in _configuredDevices)
                {
                    if (device.Interfaces != null && device.Interfaces.Any())
                    {
                        var wanInterface = device.Interfaces.FirstOrDefault(i => 
                            i.Type.Contains("Ethernet", StringComparison.OrdinalIgnoreCase) || 
                            i.Type.Contains("WAN", StringComparison.OrdinalIgnoreCase)) 
                            ?? device.Interfaces.First();
                        
                        device.InterfaceId = wanInterface.Index;
                        device.InterfaceName = wanInterface.Name;
                        device.InterfaceDescription = wanInterface.Description;
                        device.InterfaceSpeed = wanInterface.Speed;
                    }
                }
            });

            await RunStepAsync(6, "Test Traffic Counters", "Verify traffic counters are working correctly", async () =>
            {
                foreach (var device in _configuredDevices)
                {
                    using var scope = _serviceProvider.CreateScope();
                    var collector = GetCollector(device, scope.ServiceProvider);
                    if (collector != null)
                    {
                        var result = await collector.CollectAsync(device);
                        if (!result.Success)
                            throw new InvalidOperationException($"Failed to read counters from {device.GetDisplayName()}: {result.ErrorMessage}");
                    }
                }
            });

            await RunStepAsync(7, "Set Polling Interval", "Configure how often to collect traffic data", async () =>
            {
                foreach (var device in _configuredDevices)
                {
                    device.PollingIntervalSeconds = 60; // Default
                }
            });

            await RunStepAsync(8, "Start Monitoring", "Begin automatic traffic monitoring", async () =>
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
                var pollingService = scope.ServiceProvider.GetRequiredService<IPollingService>();
                
                foreach (var device in _configuredDevices)
                {
                    await db.AddDeviceAsync(device);
                }
                
                await pollingService.StartAsync();
            });

            return new WizardResult
            {
                Success = true,
                ConfiguredDevices = _configuredDevices
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Setup wizard failed");
            return new WizardResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                ConfiguredDevices = _configuredDevices
            };
        }
    }

    private async Task RunStepAsync(int stepNumber, string title, string description, Func<Task> action)
    {
        _currentStep = stepNumber;
        var step = new WizardStep
        {
            StepNumber = stepNumber,
            Title = title,
            Description = description,
            IsComplete = false
        };
        
        StepChanged?.Invoke(this, step);
        
        try
        {
            await action();
            step.IsComplete = true;
        }
        catch (Exception ex)
        {
            step.HasError = true;
            step.ErrorMessage = ex.Message;
            throw;
        }
        finally
        {
            StepChanged?.Invoke(this, step);
        }
    }

    private async Task<Device?> ConfigureDeviceAsync(string friendName, string deviceName)
    {
        // This would be implemented with UI interaction
        // For now, return a template device
        return new Device
        {
            Name = deviceName,
            FriendName = friendName,
            DeviceType = DeviceType.Router,
            IpAddress = "192.168.1.1",
            Port = 161,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Snmp,
            PollingIntervalSeconds = 60
        };
    }

    private ITrafficCollector? GetCollector(Device device, IServiceProvider serviceProvider)
    {
        return device.CollectorType switch
        {
            CollectorType.Snmp => serviceProvider.GetRequiredService<SnmpTrafficCollector>(),
            CollectorType.RouterApi => serviceProvider.GetRequiredService<RouterApiTrafficCollector>(),
            CollectorType.Manual => serviceProvider.GetRequiredService<ManualTrafficCollector>(),
            _ => null
        };
    }
}