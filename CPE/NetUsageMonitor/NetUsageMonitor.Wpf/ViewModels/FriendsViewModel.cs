namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;

public partial class FriendsViewModel : ViewModelBase
{
    private readonly IDatabaseService _databaseService;

    [ObservableProperty]
    private ObservableCollection<FriendUsageViewModel> _friends = new();

    public FriendsViewModel(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
        _ = LoadFriendsAsync();
    }

    private async Task LoadFriendsAsync()
    {
        IsBusy = true;
        try
        {
            var devices = await _databaseService.GetAllDevicesAsync();
            var friendGroups = devices.Where(d => d.MonitoringEnabled).GroupBy(d => d.FriendName);

            foreach (var group in friendGroups)
            {
                var friendVm = new FriendUsageViewModel(group.Key, group.ToList(), _databaseService);
                await friendVm.LoadDataAsync();
                Friends.Add(friendVm);
            }
        }
        catch (Exception ex)
        {
            SetError($"Failed to load friends: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }
}

public partial class FriendUsageViewModel : ObservableObject
{
    private readonly IDatabaseService _databaseService;
    private readonly List<Device> _devices;

    public string FriendName { get; }
    public int DeviceCount => _devices.Count;

    [ObservableProperty]
    private DataSize _totalDownload;

    [ObservableProperty]
    private DataSize _totalUpload;

    [ObservableProperty]
    private DataSize _totalUsage;

    [ObservableProperty]
    private DataSize _monthlyDownload;

    [ObservableProperty]
    private DataSize _monthlyUpload;

    [ObservableProperty]
    private DataSize _monthlyTotal;

    [ObservableProperty]
    private DataSize _dailyDownload;

    [ObservableProperty]
    private DataSize _dailyUpload;

    [ObservableProperty]
    private DataSize _dailyTotal;

    [ObservableProperty]
    private double _peakDownloadMbps;

    [ObservableProperty]
    private double _peakUploadMbps;

    [ObservableProperty]
    private double _averageDailyDownloadMbps;

    [ObservableProperty]
    private double _averageDailyUploadMbps;

    [ObservableProperty]
    private ISeries[] _usageChartSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private Axis[] _xAxis = Array.Empty<Axis>();

    [ObservableProperty]
    private Axis[] _yAxis = Array.Empty<Axis>();

    public FriendUsageViewModel(string friendName, List<Device> devices, IDatabaseService databaseService)
    {
        FriendName = friendName;
        _devices = devices;
        _databaseService = databaseService;
    }

    public async Task LoadDataAsync()
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateOnly(now.Year, now.Month, 1);

        long totalDown = 0, totalUp = 0, totalBytes = 0;
        long monthlyDown = 0, monthlyUp = 0, monthlyBytes = 0;
        long dailyDown = 0, dailyUp = 0, dailyBytes = 0;
        double peakDown = 0, peakUp = 0;
        var dailyTotals = new List<long>();

        foreach (var device in _devices)
        {
            var samples = await _databaseService.GetTrafficSamplesAsync(device.Id, now.AddDays(-30), now);
            var valid = samples.Where(s => s.Status == SampleStatus.Success).ToList();

            totalDown += valid.Sum(s => s.DownloadBytes);
            totalUp += valid.Sum(s => s.UploadBytes);
            totalBytes += valid.Sum(s => s.TotalBytes);

            if (valid.Count > 0)
            {
                var interval = device.PollingIntervalSeconds > 0 ? device.PollingIntervalSeconds : 60;
                peakDown = Math.Max(peakDown, valid.Max(s => s.DownloadBytes * 8.0 / (interval * 1_000_000)));
                peakUp = Math.Max(peakUp, valid.Max(s => s.UploadBytes * 8.0 / (interval * 1_000_000)));
            }

            var daily = await _databaseService.GetDailyUsageAsync(device.Id, today, today);
            dailyDown += daily?.DownloadBytes ?? 0;
            dailyUp += daily?.UploadBytes ?? 0;
            dailyBytes += daily?.TotalBytes ?? 0;

            var monthly = await _databaseService.GetMonthlyUsageAsync(device.Id, now.Year, now.Month);
            monthlyDown += monthly?.DownloadBytes ?? 0;
            monthlyUp += monthly?.UploadBytes ?? 0;
            monthlyBytes += monthly?.TotalBytes ?? 0;

            var weekDaily = await _databaseService.GetDailyUsageAsync(device.Id, weekStart, today);
            dailyTotals.AddRange(weekDaily.Select(d => d.TotalBytes));
        }

        TotalDownload = DataSize.FromBytes(totalDown);
        TotalUpload = DataSize.FromBytes(totalUp);
        TotalUsage = DataSize.FromBytes(totalBytes);
        MonthlyDownload = DataSize.FromBytes(monthlyDown);
        MonthlyUpload = DataSize.FromBytes(monthlyUp);
        MonthlyTotal = DataSize.FromBytes(monthlyBytes);
        DailyDownload = DataSize.FromBytes(dailyDown);
        DailyUpload = DataSize.FromBytes(dailyUp);
        DailyTotal = DataSize.FromBytes(dailyBytes);
        PeakDownloadMbps = peakDown;
        PeakUploadMbps = peakUp;
        AverageDailyDownloadMbps = dailyTotals.Count > 0 ? dailyTotals.Average() * 8.0 / (24 * 3600 * 1_000_000) : 0;
        AverageDailyUploadMbps = dailyTotals.Count > 0 ? dailyTotals.Average() * 8.0 / (24 * 3600 * 1_000_000) : 0;

        BuildChart();
    }

    private void BuildChart()
    {
        var series = new List<ISeries>();
        var colors = new[] { SkiaSharp.SKColors.CornflowerBlue, SkiaSharp.SKColors.Orange, SkiaSharp.SKColors.Green };
        int colorIndex = 0;

        foreach (var device in _devices)
        {
            var samples = device.TrafficSamples.Where(s => s.Status == SampleStatus.Success)
                .OrderBy(s => s.Timestamp)
                .Take(100)
                .Select(s => new DateTimePoint(s.Timestamp, s.TotalBytes))
                .ToArray();

            if (samples.Length > 0)
            {
                series.Add(new LineSeries<DateTimePoint>
                {
                    Name = device.Name,
                    Values = samples,
                    Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(colors[colorIndex % colors.Length]) { StrokeThickness = 2 },
                    Fill = null,
                    GeometrySize = 4
                });
                colorIndex++;
            }
        }

        UsageChartSeries = series.ToArray();
        XAxis = [new Axis { Labeler = value => new DateTime((long)value).ToString("MMM dd HH:mm"), MinStep = TimeSpan.FromHours(1).Ticks }];
        YAxis = [new Axis { Labeler = value => DataSize.FromBytes((long)value).ToAutoString() }];
    }
}