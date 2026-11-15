namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using LiveChartsCore;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.Defaults;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Services.Reporting;

public partial class ReportsViewModel : ViewModelBase
{
    private readonly IDatabaseService _databaseService;
    private readonly IReportService _reportService;

    [ObservableProperty]
    private ObservableCollection<Device> _availableDevices = new();

    [ObservableProperty]
    private ObservableCollection<string> _selectedFriendNames = new();

    [ObservableProperty]
    private ReportPeriod _selectedPeriod = ReportPeriod.ThisMonth;

    [ObservableProperty]
    private DateTime _customFromDate = DateTime.Today.AddDays(-30);

    [ObservableProperty]
    private DateTime _customToDate = DateTime.Today;

    [ObservableProperty]
    private bool _includeHourlyData;

    [ObservableProperty]
    private UsageReport? _currentReport;

    [ObservableProperty]
    private ISeries[] _dailyChartSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private ISeries[] _hourlyChartSeries = Array.Empty<ISeries>();

    [ObservableProperty]
    private Axis[] _xAxis = Array.Empty<Axis>();

    [ObservableProperty]
    private Axis[] _yAxis = Array.Empty<Axis>();

    public ReportsViewModel(IDatabaseService databaseService, IReportService reportService)
    {
        _databaseService = databaseService;
        _reportService = reportService;

        _ = LoadDevicesAsync();
    }

    private async Task LoadDevicesAsync()
    {
        var devices = await _databaseService.GetAllDevicesAsync();
        AvailableDevices.Clear();
        foreach (var device in devices.Where(d => d.MonitoringEnabled))
        {
            AvailableDevices.Add(device);
        }
    }

    [RelayCommand]
    private async Task GenerateReportAsync()
    {
        IsBusy = true;
        try
        {
            var parameters = new ReportParameters
            {
                DeviceIds = AvailableDevices.Where(d => SelectedFriendNames.Contains(d.FriendName) || SelectedFriendNames.Count == 0).Select(d => d.Id).ToList(),
                FriendNames = SelectedFriendNames.ToList(),
                Period = SelectedPeriod,
                FromDate = SelectedPeriod == ReportPeriod.Custom ? CustomFromDate : null,
                ToDate = SelectedPeriod == ReportPeriod.Custom ? CustomToDate : null,
                IncludeHourly = IncludeHourlyData
            };

            CurrentReport = await _reportService.GenerateReportAsync(parameters);
            BuildCharts();
            SetStatus($"Report generated: {CurrentReport.Summaries.Count} friends, {CurrentReport.DailyData.Count} daily points");
        }
        catch (Exception ex)
        {
            SetError($"Failed to generate report: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void BuildCharts()
    {
        if (CurrentReport == null) return;

        var friendGroups = CurrentReport.DailyData.GroupBy(d => d.FriendName);
        var series = new List<ISeries>();
        var colors = new[] { SkiaSharp.SKColors.CornflowerBlue, SkiaSharp.SKColors.Orange, SkiaSharp.SKColors.Green, SkiaSharp.SKColors.Purple };
        int colorIndex = 0;

        foreach (var group in friendGroups)
        {
            var points = group.OrderBy(d => d.Date).Select(d => new DateTimePoint(d.Date.ToDateTime(TimeOnly.MinValue), d.TotalBytes)).ToArray();
            
            series.Add(new LineSeries<DateTimePoint>
            {
                Name = $"{group.Key} Total",
                Values = points,
                Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(colors[colorIndex % colors.Length]) { StrokeThickness = 3 },
                Fill = null,
                GeometrySize = 6
            });

            var downPoints = group.OrderBy(d => d.Date).Select(d => new DateTimePoint(d.Date.ToDateTime(TimeOnly.MinValue), d.DownloadBytes)).ToArray();
            series.Add(new LineSeries<DateTimePoint>
            {
                Name = $"{group.Key} Download",
                Values = downPoints,
                Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(colors[colorIndex % colors.Length]) { StrokeThickness = 2, StrokeDashArray = new float[] { 5, 5 } },
                Fill = null,
                GeometrySize = 4
            });

            var upPoints = group.OrderBy(d => d.Date).Select(d => new DateTimePoint(d.Date.ToDateTime(TimeOnly.MinValue), d.UploadBytes)).ToArray();
            series.Add(new LineSeries<DateTimePoint>
            {
                Name = $"{group.Key} Upload",
                Values = upPoints,
                Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(colors[colorIndex % colors.Length]) { StrokeThickness = 1, StrokeDashArray = new float[] { 2, 2 } },
                Fill = null,
                GeometrySize = 4
            });

            colorIndex++;
        }

        DailyChartSeries = series.ToArray();

        if (CurrentReport.HourlyData.Any())
        {
            var hourlySeries = new List<ISeries>();
            var hourlyGroups = CurrentReport.HourlyData.GroupBy(h => h.FriendName);
            colorIndex = 0;

            foreach (var group in hourlyGroups)
            {
                var points = group.OrderBy(h => h.Hour).Select(h => new DateTimePoint(h.Hour, h.TotalBytes)).ToArray();
                hourlySeries.Add(new LineSeries<DateTimePoint>
                {
                    Name = $"{group.Key} Total",
                    Values = points,
                    Stroke = new LiveChartsCore.SkiaSharpView.Painting.SolidColorPaint(colors[colorIndex % colors.Length]) { StrokeThickness = 2 },
                    Fill = null,
                    GeometrySize = 4
                });
                colorIndex++;
            }

            HourlyChartSeries = hourlySeries.ToArray();
        }

        XAxis = [new Axis { Labeler = value => new DateTime((long)value).ToString("MMM dd"), MinStep = TimeSpan.FromDays(1).Ticks }];
        YAxis = [new Axis { Labeler = value => DataSize.FromBytes((long)value).ToAutoString() }];
    }

    [RelayCommand]
    private async Task ExportCsvAsync()
    {
        if (CurrentReport == null) return;

        try
        {
            var data = await _reportService.ExportCsvAsync(CurrentReport);
            var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), $"NetUsageReport_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
            await File.WriteAllBytesAsync(path, data);
            SetStatus($"CSV exported to {path}");
        }
        catch (Exception ex)
        {
            SetError($"CSV export failed: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task ExportExcelAsync()
    {
        if (CurrentReport == null) return;

        try
        {
            var data = await _reportService.ExportExcelAsync(CurrentReport);
            var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), $"NetUsageReport_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx");
            await File.WriteAllBytesAsync(path, data);
            SetStatus($"Excel exported to {path}");
        }
        catch (Exception ex)
        {
            SetError($"Excel export failed: {ex.Message}");
        }
    }
}