namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.Defaults;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;

public partial class LiveMonitoringViewModel : ViewModelBase
{
    private readonly IPollingService _pollingService;
    private readonly IDatabaseService _databaseService;
    private readonly System.Timers.Timer _uiUpdateTimer;

    [ObservableProperty]
    private ObservableCollection<DeviceLiveViewModel> _devices = new();

    [ObservableProperty]
    private ISeries[] _trafficRateSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private Axis[] _xAxis = Array.Empty<Axis>();

    [ObservableProperty]
    private Axis[] _yAxis = Array.Empty<Axis>();

    [ObservableProperty]
    private int _pollingInterval = 60;

    [ObservableProperty]
    private int _chartHistoryMinutes = 30;

    private readonly Dictionary<int, Queue<DateTimePoint>> _downloadHistory = new();
    private readonly Dictionary<int, Queue<DateTimePoint>> _uploadHistory = new();

    public LiveMonitoringViewModel(IPollingService pollingService, IDatabaseService databaseService)
    {
        _pollingService = pollingService;
        _databaseService = databaseService;

        _pollingService.DeviceStatusChanged += OnDeviceStatusChanged;
        _pollingService.SampleCollected += OnSampleCollected;

        _uiUpdateTimer = new System.Timers.Timer(1000);
        _uiUpdateTimer.Elapsed += (s, e) => UpdateCharts();
        _uiUpdateTimer.Start();

        _ = LoadDevicesAsync();
    }

    private async Task LoadDevicesAsync()
    {
        var devices = await _databaseService.GetAllDevicesAsync();
        foreach (var device in devices.Where(d => d.MonitoringEnabled))
        {
            var vm = new DeviceLiveViewModel(device);
            Devices.Add(vm);
            _downloadHistory[device.Id] = new Queue<DateTimePoint>();
            _uploadHistory[device.Id] = new Queue<DateTimePoint>();
        }
        
        InitializeCharts();
    }

    private void InitializeCharts()
    {
        XAxis = [new Axis 
        { 
            Labeler = value => new DateTime((long)value).ToString("HH:mm:ss"),
            MinStep = TimeSpan.FromMinutes(1).Ticks 
        }];
        YAxis = [new Axis { Labeler = value => $"{value:F2} Mbps" }];
    }

    private void OnDeviceStatusChanged(object? sender, DeviceStatus status)
    {
        var deviceVm = Devices.FirstOrDefault(d => d.DeviceId == status.DeviceId);
        if (deviceVm != null)
        {
            deviceVm.UpdateStatus(status);
            
            if (!_downloadHistory.ContainsKey(status.DeviceId))
            {
                _downloadHistory[status.DeviceId] = new Queue<DateTimePoint>();
                _uploadHistory[status.DeviceId] = new Queue<DateTimePoint>();
            }

            var now = DateTime.Now;
            _downloadHistory[status.DeviceId].Enqueue(new DateTimePoint(now, status.CurrentDownloadMbps));
            _uploadHistory[status.DeviceId].Enqueue(new DateTimePoint(now, status.CurrentUploadMbps));

            var cutoff = now.AddMinutes(-ChartHistoryMinutes);
            while (_downloadHistory[status.DeviceId].Count > 0 && _downloadHistory[status.DeviceId].Peek().DateTime < cutoff)
                _downloadHistory[status.DeviceId].Dequeue();
            while (_uploadHistory[status.DeviceId].Count > 0 && _uploadHistory[status.DeviceId].Peek().DateTime < cutoff)
                _uploadHistory[status.DeviceId].Dequeue();
        }
    }

    private void OnSampleCollected(object? sender, TrafficSample sample)
    {
        // Sample collected, charts updated via status changed
    }

    private void UpdateCharts()
    {
        var series = new List<ISeries>();
        var colors = new[] { SkiaSharp.SKColors.CornflowerBlue, SkiaSharp.SKColors.Orange, SkiaSharp.SKColors.Green, SkiaSharp.SKColors.Purple };
        int colorIndex = 0;

        foreach (var device in Devices)
        {
            if (_downloadHistory.TryGetValue(device.DeviceId, out var downHistory) && downHistory.Count > 0)
            {
                series.Add(new LineSeries<DateTimePoint>
                {
                    Name = $"{device.FriendName} ↓",
                    Values = downHistory.ToArray(),
                    Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(colors[colorIndex % colors.Length]) { StrokeThickness = 2 },
                    Fill = null,
                    GeometrySize = 4
                });

                if (_uploadHistory.TryGetValue(device.DeviceId, out var upHistory) && upHistory.Count > 0)
                {
                    series.Add(new LineSeries<DateTimePoint>
                    {
                        Name = $"{device.FriendName} ↑",
                        Values = upHistory.ToArray(),
                        Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(colors[colorIndex % colors.Length]) { StrokeThickness = 2, StrokeDashArray = new float[] { 5, 5 } },
                        Fill = null,
                        GeometrySize = 4
                    });
                }
                colorIndex++;
            }
        }

        TrafficRateSeries = series.ToArray();
    }

    [RelayCommand]
    private async Task ApplyPollingIntervalAsync()
    {
        var devices = await _databaseService.GetAllDevicesAsync();
        foreach (var device in devices.Where(d => d.MonitoringEnabled))
        {
            device.PollingIntervalSeconds = PollingInterval;
            await _databaseService.UpdateDeviceAsync(device);
        }
        SetStatus($"Polling interval updated to {PollingInterval} seconds");
    }

    public override void Dispose()
    {
        _pollingService.DeviceStatusChanged -= OnDeviceStatusChanged;
        _pollingService.SampleCollected -= OnSampleCollected;
        _uiUpdateTimer?.Stop();
        _uiUpdateTimer?.Dispose();
        base.Dispose();
    }
}

public partial class DeviceLiveViewModel : ObservableObject
{
    public int DeviceId { get; }
    public string DeviceName { get; }
    public string FriendName { get; }

    [ObservableProperty]
    private bool _isOnline;

    [ObservableProperty]
    private DateTime? _lastPoll;

    [ObservableProperty]
    private DateTime? _lastSuccess;

    [ObservableProperty]
    private string? _lastError;

    [ObservableProperty]
    private int _consecutiveFailures;

    [ObservableProperty]
    private double _currentDownloadMbps;

    [ObservableProperty]
    private double _currentUploadMbps;

    [ObservableProperty]
    private ulong _currentInOctets;

    [ObservableProperty]
    private ulong _currentOutOctets;

    [ObservableProperty]
    private bool _interfaceUp;

    [ObservableProperty]
    private long _interfaceSpeed;

    public DeviceLiveViewModel(Device device)
    {
        DeviceId = device.Id;
        DeviceName = device.Name;
        FriendName = device.FriendName;
        IsOnline = device.ConsecutiveFailures == 0;
        LastSuccess = device.LastSuccessfulPoll;
        LastError = device.LastError;
        ConsecutiveFailures = device.ConsecutiveFailures;
    }

    public void UpdateStatus(DeviceStatus status)
    {
        IsOnline = status.IsOnline;
        LastPoll = status.LastPoll;
        LastSuccess = status.LastSuccess;
        LastError = status.LastError;
        ConsecutiveFailures = status.ConsecutiveFailures;
        CurrentDownloadMbps = status.CurrentDownloadMbps;
        CurrentUploadMbps = status.CurrentUploadMbps;
        CurrentInOctets = status.CurrentInOctets;
        CurrentOutOctets = status.CurrentOutOctets;
        InterfaceUp = status.InterfaceUp;
        InterfaceSpeed = status.InterfaceSpeed;
    }
}