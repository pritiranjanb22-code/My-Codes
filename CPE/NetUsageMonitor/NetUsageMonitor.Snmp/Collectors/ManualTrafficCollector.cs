namespace NetUsageMonitor.Snmp.Collectors;

using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;

public class ManualTrafficCollector : ITrafficCollector, IDisposable
{
    public CollectorType Type => CollectorType.Manual;
    
    private readonly ILogger<ManualTrafficCollector> _logger;
    private readonly Dictionary<int, (ulong InOctets, ulong OutOctets)> _manualCounters = new();
    private readonly Random _random = new();

    public ManualTrafficCollector(ILogger<ManualTrafficCollector> logger)
    {
        _logger = logger;
    }

    public Task<CollectorResult> CollectAsync(Device device, CancellationToken cancellationToken = default)
    {
        if (!_manualCounters.TryGetValue(device.Id, out var counters))
        {
            counters = (1000000UL, 500000UL);
            _manualCounters[device.Id] = counters;
        }

        var variation = _random.NextDouble() * 0.1 + 0.95;
        var newIn = (ulong)(counters.InOctets + _random.Next(10000, 1000000) * variation);
        var newOut = (ulong)(counters.OutOctets + _random.Next(5000, 500000) * variation);

        _manualCounters[device.Id] = (newIn, newOut);

        return Task.FromResult(CollectorResult.SuccessResult(newIn, newOut, _random.NextDouble() * 10, true, 100_000_000));
    }

    public Task<bool> TestConnectionAsync(Device device, CancellationToken cancellationToken = default)
        => Task.FromResult(true);

    public Task<List<NetworkInterface>> DiscoverInterfacesAsync(Device device, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new List<NetworkInterface>
        {
            new NetworkInterface
            {
                Index = "1",
                Name = "eth0",
                Description = "WAN Interface (Manual Test)",
                Type = "Ethernet",
                Speed = 100_000_000,
                IsUp = true,
                HCInOctets = 1000000,
                HCOutOctets = 500000
            },
            new NetworkInterface
            {
                Index = "2",
                Name = "eth1",
                Description = "LAN Interface (Manual Test)",
                Type = "Ethernet",
                Speed = 1_000_000_000,
                IsUp = true,
                HCInOctets = 2000000,
                HCOutOctets = 1000000
            }
        });
    }

    public void SetManualCounters(int deviceId, ulong inOctets, ulong outOctets)
    {
        _manualCounters[deviceId] = (inOctets, outOctets);
    }

    public void Dispose() { }
}