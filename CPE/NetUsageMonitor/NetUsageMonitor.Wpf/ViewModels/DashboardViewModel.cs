namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.Defaults;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;

public partial class DashboardViewModel : ViewModelBase
{
    private readonly IDatabaseService _databaseService;
    private readonly IPollingService _pollingService;
    private readonly IAlertService _alertService;

    [ObservableProperty]
    private DataSize _totalDownload;

    [ObservableProperty]
    private DataSize _totalUpload;

    [ObservableProperty]
    private DataSize _friendADownload;

    [ObservableProperty]
    private DataSize _friendAUpload;

    [ObservableProperty]
    private DataSize _friendATotal;

    [ObservableProperty]
    private DataSize _friendBDownload;

    [ObservableProperty]
    private DataSize _friendBUpload;

    [ObservableProperty]
    private DataSize _friendBTotal;

    [ObservableProperty]
    private string _connectionStatus = "Unknown";

    [ObservableProperty]
    private DateTime? _lastUpdate;

    [ObservableProperty]
    private double _currentDownloadSpeed;

    [ObservableProperty]
    private double _currentUploadSpeed;

    [ObservableProperty]
    private DataSize _monthlyUsage;

    [ObservableProperty]
    private DataSize _dailyUsage;

    [ObservableProperty]
    private DataSize _weeklyUsage;

    [ObservableProperty]
    private ISeries[] _usageComparisonSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private ISeries[] _dailyUsageSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private ISeries[] _weeklyUsageSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private ISeries[] _monthlyUsageSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private Axis[] _xAxis = Array.Empty<Axis>();

    [ObservableProperty]
    private Axis[] _yAxis = Array.Empty<Axis>();

    [ObservableProperty]
    private bool _useBinaryUnits;

    [ObservableProperty]
    private DataUnit _displayUnit = DataUnit.Gigabytes;

    public DashboardViewModel(
        IDatabaseService databaseService,
        IPollingService pollingService,
        IAlertService alertService)
    {
        _databaseService = databaseService;
        _pollingService = pollingService;
        _alertService = alertService;

        _pollingService.DeviceStatusChanged += OnDeviceStatusChanged;
        _pollingService.SampleCollected += OnSampleCollected;

        _ = LoadDashboardDataAsync();
    }

    private async Task LoadDashboardDataAsync()
    {
        IsBusy = true;
        try
        {
            var devices = await _databaseService.GetAllDevicesAsync();
            var enabledDevices = devices.Where(d => d.MonitoringEnabled).ToList();

            var friendADevices = enabledDevices.Where(d => d.FriendName == "Friend A").ToList();
            var friendBDevices = enabledDevices.Where(d => d.FriendName == "Friend B").ToList();

            await LoadUsageDataAsync(friendADevices, friendBDevices);
            await LoadChartsAsync(enabledDevices);
            UpdateConnectionStatus(enabledDevices);
        }
        catch (Exception ex)
        {
            SetError($"Failed to load dashboard: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task LoadUsageDataAsync(List<Device> friendADevices, List<Device> friendBDevices)
    {
        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateOnly(now.Year, now.Month, 1);

        var friendATotal = DataSize.FromBytes(0);
        var friendAUp = DataSize.FromBytes(0);
        var friendADown = DataSize.FromBytes(0);
        
        foreach (var device in friendADevices)
        {
            var samples = await _databaseService.GetTrafficSamplesAsync(device.Id, now.AddDays(-30), now);
            var valid = samples.Where(s => s.Status == SampleStatus.Success).ToList();
            
            friendADown += DataSize.FromBytes(valid.Sum(s => s.DownloadBytes));
            friendAUp += DataSize.FromBytes(valid.Sum(s => s.UploadBytes));
            friendATotal += DataSize.FromBytes(valid.Sum(s => s.TotalBytes));
        }

        var friendBTotal = DataSize.FromBytes(0);
        var friendBUp = DataSize.FromBytes(0);
        var friendBDown = DataSize.FromBytes(0);
        
        foreach (var device in friendBDevices)
        {
            var samples = await _databaseService.GetTrafficSamplesAsync(device.Id, now.AddDays(-30), now);
            var valid = samples.Where(s => s.Status == SampleStatus.Success).ToList();
            
            friendBDown += DataSize.FromBytes(valid.Sum(s => s.DownloadBytes));
            friendBUp += DataSize.FromBytes(valid.Sum(s => s.UploadBytes));
            friendBTotal += DataSize.FromBytes(valid.Sum(s => s.TotalBytes));
        }

        FriendADownload = friendADown;
        FriendAUpload = friendAUp;
        FriendATotal = friendATotal;
        FriendBDownload = friendBDown;
        FriendBUpload = friendBUp;
        FriendBTotal = friendBTotal;
        TotalDownload = friendADown + friendBDown;
        TotalUpload = friendAUp + friendBUp;

        var dailyA = await _databaseService.GetDailyUsageAsync(
            friendADevices.Select(d => d.Id).FirstOrDefault(), today, today);
        var dailyB = await _databaseService.GetDailyUsageAsync(
            friendBDevices.Select(d => d.Id).FirstOrDefault(), today, today);
        DailyUsage = DataSize.FromBytes((dailyA?.TotalBytes ?? 0) + (dailyB?.TotalBytes ?? 0));

        var weeklyA = await GetWeeklyUsage(friendADevices, weekStart, today);
        var weeklyB = await GetWeeklyUsage(friendBDevices, weekStart, today);
        WeeklyUsage = DataSize.FromBytes(weeklyA + weeklyB);

        var monthlyA = await GetMonthlyUsage(friendADevices, now.Year, now.Month);
        var monthlyB = await GetMonthlyUsage(friendBDevices, now.Year, now.Month);
        MonthlyUsage = DataSize.FromBytes(monthlyA + monthlyB);
    }

    private async Task<long> GetWeeklyUsage(List<Device> devices, DateOnly from, DateOnly to)
    {
        long total = 0;
        foreach (var device in devices)
        {
            var daily = await _databaseService.GetDailyUsageAsync(device.Id, from, to);
            total += daily.Sum(d => d.TotalBytes);
        }
        return total;
    }

    private async Task<long> GetMonthlyUsage(List<Device> devices, int year, int month)
    {
        long total = 0;
        foreach (var device in devices)
        {
            var monthly = await _databaseService.GetMonthlyUsageAsync(device.Id, year, month);
            total += monthly?.TotalBytes ?? 0;
        }
        return total;
    }

    private async Task LoadChartsAsync(List<Device> devices)
    {
        var now = DateTime.UtcNow;
        
        UsageComparisonSeries = BuildComparisonChart(devices);
        DailyUsageSeries = await BuildDailyChartAsync(devices, now.AddDays(-7), now);
        WeeklyUsageSeries = await BuildWeeklyChartAsync(devices, now.AddMonths(-3), now);
        MonthlyUsageSeries = await BuildMonthlyChartAsync(devices, now.AddMonths(-12), now);

        XAxis = [new Axis { Labels = GetDailyLabels(7), LabelsRotation = 45 }];
        YAxis = [new Axis { Labeler = value => DataSize.FromBytes((long)value).ToAutoString(UseBinaryUnits) }];
    }

    private ISeries[] BuildComparisonChart(List<Device> devices)
    {
        var friendADevices = devices.Where(d => d.FriendName == "Friend A").ToList();
        var friendBDevices = devices.Where(d => d.FriendName == "Friend B").ToList();

        var friendADown = friendADevices.Sum(d => d.TrafficSamples.Where(s => s.Status == SampleStatus.Success).Sum(s => s.DownloadBytes));
        var friendAUp = friendADevices.Sum(d => d.TrafficSamples.Where(s => s.Status == SampleStatus.Success).Sum(s => s.UploadBytes));
        var friendBDown = friendBDevices.Sum(d => d.TrafficSamples.Where(s => s.Status == SampleStatus.Success).Sum(s => s.DownloadBytes));
        var friendBUp = friendBDevices.Sum(d => d.TrafficSamples.Where(s => s.Status == SampleStatus.Success).Sum(s => s.UploadBytes));

        return new ISeries[]
        {
            new ColumnSeries<long>
            {
                Name = "Friend A Download",
                Values = new[] { friendADown },
                Fill = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(SkiaSharp.SKColors.CornflowerBlue)
            },
            new ColumnSeries<long>
            {
                Name = "Friend A Upload",
                Values = new[] { friendAUp },
                Fill = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(SkiaSharp.SKColors.LightBlue)
            },
            new ColumnSeries<long>
            {
                Name = "Friend B Download",
                Values = new[] { friendBDown },
                Fill = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(SkiaSharp.SKColors.Orange)
            },
            new ColumnSeries<long>
            {
                Name = "Friend B Upload",
                Values = new[] { friendBUp },
                Fill = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(SkiaSharp.SKColors.LightSalmon)
            }
        };
    }

    private async Task<ISeries[]> BuildDailyChartAsync(List<Device> devices, DateTime from, DateTime to)
    {
        var series = new List<ISeries>();
        var friendGroups = devices.GroupBy(d => d.FriendName);

        foreach (var group in friendGroups)
        {
            var dailyData = new List<DateTimePoint>();
            var dates = Enumerable.Range(0, (to - from).Days + 1)
                .Select(i => from.AddDays(i).Date)
                .ToList();

            foreach (var date in dates)
            {
                long total = 0;
                foreach (var device in group)
                {
                    var daily = await _databaseService.GetDailyUsageAsync(device.Id, DateOnly.FromDateTime(date), DateOnly.FromDateTime(date));
                    total += daily?.TotalBytes ?? 0;
                }
                dailyData.Add(new DateTimePoint(date, total));
            }

            var color = group.Key == "Friend A" ? SkiaSharp.SKColors.CornflowerBlue : SkiaSharp.SKColors.Orange;
            series.Add(new LineSeries<DateTimePoint>
            {
                Name = $"{group.Key} Total",
                Values = dailyData,
                Fill = null,
                Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(color) { StrokeThickness = 3 },
                GeometrySize = 8
            });
        }

        return series.ToArray();
    }

    private async Task<ISeries[]> BuildWeeklyChartAsync(List<Device> devices, DateTime from, DateTime to)
    {
        // Similar to daily but grouped by week
        return Array.Empty<ISeries>();
    }

    private async Task<ISeries[]> BuildMonthlyChartAsync(List<Device> devices, DateTime from, DateTime to)
    {
        // Similar to daily but grouped by month
        return Array.Empty<ISeries>();
    }

    private string[] GetDailyLabels(int days)
    {
        return Enumerable.Range(0, days)
            .Select(i => DateTime.UtcNow.AddDays(-days + 1 + i).ToString("MMM dd"))
            .ToArray();
    }

    private void UpdateConnectionStatus(List<Device> devices)
    {
        if (!devices.Any())
        {
            ConnectionStatus = "No devices configured";
            return;
        }

        var online = devices.Count(d => d.ConsecutiveFailures == 0);
        var total = devices.Count;
        
        ConnectionStatus = online == total ? "All Online" : $"{online}/{total} Online";
        LastUpdate = devices.Max(d => d.LastSuccessfulPoll);
    }

    private void OnDeviceStatusChanged(object? sender, DeviceStatus status)
    {
        // Update real-time stats
        if (status.FriendName == "Friend A")
        {
            CurrentDownloadSpeed = status.CurrentDownloadMbps;
            CurrentUploadSpeed = status.CurrentUploadMbps;
        }
        LastUpdate = DateTime.UtcNow;
    }

    private void OnSampleCollected(object? sender, TrafficSample sample)
    {
        // Trigger refresh
        _ = LoadDashboardDataAsync();
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        await LoadDashboardDataAsync();
    }

    [RelayCommand]
    private void ToggleUnits()
    {
        UseBinaryUnits = !UseBinaryUnits;
        OnPropertyChanged(nameof(FriendADownload));
        OnPropertyChanged(nameof(FriendAUpload));
        OnPropertyChanged(nameof(FriendATotal));
        OnPropertyChanged(nameof(FriendBDownload));
        OnPropertyChanged(nameof(FriendBUpload));
        OnPropertyChanged(nameof(FriendBTotal));
        OnPropertyChanged(nameof(TotalDownload));
        OnPropertyChanged(nameof(TotalUpload));
        OnPropertyChanged(nameof(MonthlyUsage));
        OnPropertyChanged(nameof(DailyUsage));
        OnPropertyChanged(nameof(WeeklyUsage));
    }

    public override void Dispose()
    {
        _pollingService.DeviceStatusChanged -= OnDeviceStatusChanged;
        _pollingService.SampleCollected -= OnSampleCollected;
        base.Dispose();
    }
}