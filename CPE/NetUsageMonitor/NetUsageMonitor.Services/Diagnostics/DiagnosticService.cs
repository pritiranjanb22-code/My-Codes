namespace NetUsageMonitor.Services.Diagnostics;

using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Snmp.Collectors;

public class DiagnosticService : IDiagnosticService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DiagnosticService> _logger;

    public DiagnosticService(IServiceProvider serviceProvider, ILogger<DiagnosticService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<DiagnosticResult> RunDiagnosticsAsync(int deviceId)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var device = await db.GetDeviceAsync(deviceId);

        if (device == null)
        {
            return new DiagnosticResult
            {
                DeviceId = deviceId,
                Errors = new List<string> { "Device not found" }
            };
        }

        return await RunDeviceDiagnosticsAsync(device, scope.ServiceProvider);
    }

    public async Task<DiagnosticResult> RunFullDiagnosticsAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        var devices = await db.GetAllDevicesAsync();

        var results = new List<DiagnosticResult>();
        foreach (var device in devices.Where(d => d.MonitoringEnabled))
        {
            results.Add(await RunDeviceDiagnosticsAsync(device, scope.ServiceProvider));
        }

        var combined = new DiagnosticResult
        {
            DeviceId = 0,
            DeviceName = "All Devices",
            DeviceReachable = results.All(r => r.DeviceReachable),
            SnmpAvailable = results.Any(r => r.SnmpAvailable),
            Errors = results.SelectMany(r => r.Errors).ToList(),
            Warnings = results.SelectMany(r => r.Warnings).ToList(),
            Suggestions = results.SelectMany(r => r.Suggestions).Distinct().ToList()
        };

        return combined;
    }

    private async Task<DiagnosticResult> RunDeviceDiagnosticsAsync(Device device, IServiceProvider serviceProvider)
    {
        var result = new DiagnosticResult
        {
            DeviceId = device.Id,
            DeviceName = device.GetDisplayName()
        };

        try
        {
            var collector = GetCollector(device, serviceProvider);
            if (collector == null)
            {
                result.Errors.Add($"No collector available for type {device.CollectorType}");
                return result;
            }

            result.DeviceReachable = await collector.TestConnectionAsync(device);
            
            if (!result.DeviceReachable)
            {
                result.Errors.Add("Device is not reachable");
                result.Suggestions.Add("Check IP address and network connectivity");
                result.Suggestions.Add("Verify firewall allows SNMP/API access");
                return result;
            }

            if (device.CollectorType == CollectorType.Snmp)
            {
                result.SnmpAvailable = true;
                result.SnmpVersion = device.SnmpSettings?.Version.ToString() ?? "Unknown";
            }

            result.Interfaces = await collector.DiscoverInterfacesAsync(device);
            
            if (!result.Interfaces.Any())
            {
                result.Warnings.Add("No interfaces discovered");
                result.Suggestions.Add("Verify SNMP community string or API credentials");
            }

            if (!string.IsNullOrEmpty(device.InterfaceId))
            {
                var selected = result.Interfaces.FirstOrDefault(i => i.Index == device.InterfaceId);
                if (selected != null)
                {
                    result.SelectedInterface = $"{selected.Index}: {selected.Name} ({selected.Description})";
                    
                    var collectResult = await collector.CollectAsync(device);
                    result.CurrentInOctets = collectResult.ReceivedCounter;
                    result.CurrentOutOctets = collectResult.TransmittedCounter;
                    result.LastCounterChange = collectResult.Timestamp;
                    
                    if (!collectResult.Success)
                    {
                        result.Errors.Add($"Counter read failed: {collectResult.ErrorMessage}");
                    }
                }
                else
                {
                    result.Warnings.Add("Selected interface not found in discovered interfaces");
                    result.Suggestions.Add("Re-run interface discovery and select a valid interface");
                }
            }
            else
            {
                result.Warnings.Add("No interface selected for monitoring");
                result.Suggestions.Add("Select a WAN/internet-facing interface in device configuration");
            }

            var wanInterfaces = result.Interfaces.Where(i => 
                i.Type.Contains("Ethernet", StringComparison.OrdinalIgnoreCase) ||
                i.Type.Contains("WAN", StringComparison.OrdinalIgnoreCase) ||
                i.Type.Contains("PPP", StringComparison.OrdinalIgnoreCase) ||
                i.Name.Contains("wan", StringComparison.OrdinalIgnoreCase) ||
                i.Name.Contains("ppp", StringComparison.OrdinalIgnoreCase)).ToList();

            if (!wanInterfaces.Any() && result.Interfaces.Any())
            {
                result.Warnings.Add("No obvious WAN interface detected");
                result.Suggestions.Add("Manually verify the selected interface is the internet-facing one");
            }

            if (device.CollectorType == CollectorType.Snmp && device.SnmpSettings != null)
            {
                if (device.SnmpSettings.Version == SnmpVersion.V2c && string.IsNullOrEmpty(device.SnmpSettings.Community))
                {
                    result.Warnings.Add("SNMPv2c community string is empty");
                }
                if (device.SnmpSettings.Version == SnmpVersion.V3 && string.IsNullOrEmpty(device.SnmpSettings.Username))
                {
                    result.Warnings.Add("SNMPv3 username is not configured");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Diagnostics failed for device {DeviceId}", device.Id);
            result.Errors.Add($"Diagnostics error: {ex.Message}");
        }

        return result;
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