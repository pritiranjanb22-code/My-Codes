namespace NetUsageMonitor.Services.Reporting;

using OfficeOpenXml;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Data;

public class ReportService : IReportService
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<ReportService> _logger;

    public ReportService(IDatabaseService databaseService, ILogger<ReportService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<UsageReport> GenerateReportAsync(ReportParameters parameters)
    {
        var report = new UsageReport
        {
            Parameters = parameters,
            GeneratedAt = DateTime.UtcNow
        };

        var (fromDate, toDate) = GetDateRange(parameters);
        
        var devices = await _databaseService.GetAllDevicesAsync();
        var filteredDevices = devices.Where(d => 
            (parameters.DeviceIds.Count == 0 || parameters.DeviceIds.Contains(d.Id)) &&
            (parameters.FriendNames.Count == 0 || parameters.FriendNames.Contains(d.FriendName))
        ).ToList();

        foreach (var device in filteredDevices)
        {
            var samples = await _databaseService.GetTrafficSamplesAsync(device.Id, fromDate, toDate);
            var validSamples = samples.Where(s => s.Status == SampleStatus.Success).ToList();

            if (!validSamples.Any())
                continue;

            var summary = new UsageSummary
            {
                FriendName = device.FriendName,
                DownloadBytes = validSamples.Sum(s => s.DownloadBytes),
                UploadBytes = validSamples.Sum(s => s.UploadBytes),
                TotalBytes = validSamples.Sum(s => s.TotalBytes),
                DaysWithData = validSamples.Select(s => DateOnly.FromDateTime(s.Timestamp)).Distinct().Count(),
                PeriodStart = fromDate,
                PeriodEnd = toDate
            };

            if (validSamples.Count > 1)
            {
                var intervalSeconds = device.PollingIntervalSeconds > 0 ? device.PollingIntervalSeconds : 60;
                summary.PeakDownloadMbps = validSamples.Max(s => s.DownloadBytes * 8.0 / (intervalSeconds * 1_000_000));
                summary.PeakUploadMbps = validSamples.Max(s => s.UploadBytes * 8.0 / (intervalSeconds * 1_000_000));
                summary.AverageDailyDownloadMbps = validSamples
                    .GroupBy(s => DateOnly.FromDateTime(s.Timestamp))
                    .Average(g => g.Sum(s => s.DownloadBytes) * 8.0 / (24 * 3600 * 1_000_000));
                summary.AverageDailyUploadMbps = validSamples
                    .GroupBy(s => DateOnly.FromDateTime(s.Timestamp))
                    .Average(g => g.Sum(s => s.UploadBytes) * 8.0 / (24 * 3600 * 1_000_000));
            }

            report.Summaries.Add(summary);

            var dailyGroups = validSamples.GroupBy(s => DateOnly.FromDateTime(s.Timestamp));
            foreach (var group in dailyGroups)
            {
                report.DailyData.Add(new DailyUsagePoint
                {
                    Date = group.Key,
                    FriendName = device.FriendName,
                    DownloadBytes = group.Sum(s => s.DownloadBytes),
                    UploadBytes = group.Sum(s => s.UploadBytes),
                    TotalBytes = group.Sum(s => s.TotalBytes)
                });
            }

            if (parameters.IncludeHourly)
            {
                var hourlyGroups = validSamples.GroupBy(s => new DateTime(s.Timestamp.Year, s.Timestamp.Month, s.Timestamp.Day, s.Timestamp.Hour, 0, 0));
                foreach (var group in hourlyGroups)
                {
                    report.HourlyData.Add(new HourlyUsagePoint
                    {
                        Hour = group.Key,
                        FriendName = device.FriendName,
                        DownloadBytes = group.Sum(s => s.DownloadBytes),
                        UploadBytes = group.Sum(s => s.UploadBytes),
                        TotalBytes = group.Sum(s => s.TotalBytes)
                    });
                }
            }
        }

        report.DailyData = report.DailyData.OrderBy(d => d.Date).ToList();
        report.HourlyData = report.HourlyData.OrderBy(h => h.Hour).ToList();

        BuildComparison(report);

        return report;
    }

    private void BuildComparison(UsageReport report)
    {
        var friendNames = report.Summaries.Select(s => s.FriendName).Distinct().ToList();
        if (friendNames.Count >= 2)
        {
            var friendA = report.Summaries.FirstOrDefault(s => s.FriendName == friendNames[0]);
            var friendB = report.Summaries.FirstOrDefault(s => s.FriendName == friendNames[1]);
            
            if (friendA != null && friendB != null)
            {
                report.Comparison = new UsageComparison
                {
                    FriendAName = friendA.FriendName,
                    FriendBName = friendB.FriendName,
                    FriendADownload = friendA.DownloadBytes,
                    FriendBDownload = friendB.DownloadBytes,
                    FriendAUpload = friendA.UploadBytes,
                    FriendBUpload = friendB.UploadBytes,
                    FriendATotal = friendA.TotalBytes,
                    FriendBTotal = friendB.TotalBytes
                };
            }
        }
    }

    private (DateTime from, DateTime to) GetDateRange(ReportParameters parameters)
    {
        if (parameters.FromDate.HasValue && parameters.ToDate.HasValue)
            return (parameters.FromDate.Value, parameters.ToDate.Value);

        var now = DateTime.UtcNow;
        return parameters.Period switch
        {
            ReportPeriod.Today => (now.Date, now.Date.AddDays(1).AddSeconds(-1)),
            ReportPeriod.Yesterday => (now.Date.AddDays(-1), now.Date.AddSeconds(-1)),
            ReportPeriod.ThisWeek => (now.Date.AddDays(-(int)now.DayOfWeek), now.Date.AddDays(7 - (int)now.DayOfWeek).AddSeconds(-1)),
            ReportPeriod.ThisMonth => (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59)),
            ReportPeriod.LastMonth => 
            {
                var lastMonth = now.AddMonths(-1);
                return (new DateTime(lastMonth.Year, lastMonth.Month, 1), new DateTime(lastMonth.Year, lastMonth.Month, DateTime.DaysInMonth(lastMonth.Year, lastMonth.Month), 23, 59, 59));
            },
            _ => (now.Date.AddDays(-30), now)
        };
    }

    public async Task<byte[]> ExportCsvAsync(UsageReport report)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        csv.WriteField("Friend Name");
        csv.WriteField("Date");
        csv.WriteField("Download (Bytes)");
        csv.WriteField("Upload (Bytes)");
        csv.WriteField("Total (Bytes)");
        csv.NextRecord();

        foreach (var point in report.DailyData)
        {
            csv.WriteField(point.FriendName);
            csv.WriteField(point.Date.ToString("yyyy-MM-dd"));
            csv.WriteField(point.DownloadBytes);
            csv.WriteField(point.UploadBytes);
            csv.WriteField(point.TotalBytes);
            csv.NextRecord();
        }

        if (report.HourlyData.Any())
        {
            csv.NextRecord();
            csv.WriteField("Friend Name");
            csv.WriteField("Hour");
            csv.WriteField("Download (Bytes)");
            csv.WriteField("Upload (Bytes)");
            csv.WriteField("Total (Bytes)");
            csv.NextRecord();

            foreach (var point in report.HourlyData)
            {
                csv.WriteField(point.FriendName);
                csv.WriteField(point.Hour.ToString("yyyy-MM-dd HH:00"));
                csv.WriteField(point.DownloadBytes);
                csv.WriteField(point.UploadBytes);
                csv.WriteField(point.TotalBytes);
                csv.NextRecord();
            }
        }

        await writer.FlushAsync();
        return memoryStream.ToArray();
    }

    public async Task<byte[]> ExportExcelAsync(UsageReport report)
    {
        using var package = new ExcelPackage();
        
        var summarySheet = package.Workbook.Worksheets.Add("Summary");
        summarySheet.Cells[1, 1].Value = "Friend Name";
        summarySheet.Cells[1, 2].Value = "Download (Bytes)";
        summarySheet.Cells[1, 3].Value = "Upload (Bytes)";
        summarySheet.Cells[1, 4].Value = "Total (Bytes)";
        summarySheet.Cells[1, 5].Value = "Peak Download (Mbps)";
        summarySheet.Cells[1, 6].Value = "Peak Upload (Mbps)";
        summarySheet.Cells[1, 7].Value = "Avg Daily Download (Mbps)";
        summarySheet.Cells[1, 8].Value = "Avg Daily Upload (Mbps)";
        summarySheet.Cells[1, 9].Value = "Days with Data";
        summarySheet.Cells[1, 10].Value = "Period Start";
        summarySheet.Cells[1, 11].Value = "Period End";

        for (int i = 0; i < report.Summaries.Count; i++)
        {
            var s = report.Summaries[i];
            var row = i + 2;
            summarySheet.Cells[row, 1].Value = s.FriendName;
            summarySheet.Cells[row, 2].Value = s.DownloadBytes;
            summarySheet.Cells[row, 3].Value = s.UploadBytes;
            summarySheet.Cells[row, 4].Value = s.TotalBytes;
            summarySheet.Cells[row, 5].Value = s.PeakDownloadMbps;
            summarySheet.Cells[row, 6].Value = s.PeakUploadMbps;
            summarySheet.Cells[row, 7].Value = s.AverageDailyDownloadMbps;
            summarySheet.Cells[row, 8].Value = s.AverageDailyUploadMbps;
            summarySheet.Cells[row, 9].Value = s.DaysWithData;
            summarySheet.Cells[row, 10].Value = s.PeriodStart?.ToString("yyyy-MM-dd");
            summarySheet.Cells[row, 11].Value = s.PeriodEnd?.ToString("yyyy-MM-dd");
        }

        var dailySheet = package.Workbook.Worksheets.Add("Daily Usage");
        dailySheet.Cells[1, 1].Value = "Friend Name";
        dailySheet.Cells[1, 2].Value = "Date";
        dailySheet.Cells[1, 3].Value = "Download (Bytes)";
        dailySheet.Cells[1, 4].Value = "Upload (Bytes)";
        dailySheet.Cells[1, 5].Value = "Total (Bytes)";

        for (int i = 0; i < report.DailyData.Count; i++)
        {
            var d = report.DailyData[i];
            var row = i + 2;
            dailySheet.Cells[row, 1].Value = d.FriendName;
            dailySheet.Cells[row, 2].Value = d.Date.ToString("yyyy-MM-dd");
            dailySheet.Cells[row, 3].Value = d.DownloadBytes;
            dailySheet.Cells[row, 4].Value = d.UploadBytes;
            dailySheet.Cells[row, 5].Value = d.TotalBytes;
        }

        if (report.HourlyData.Any())
        {
            var hourlySheet = package.Workbook.Worksheets.Add("Hourly Usage");
            hourlySheet.Cells[1, 1].Value = "Friend Name";
            hourlySheet.Cells[1, 2].Value = "Hour";
            hourlySheet.Cells[1, 3].Value = "Download (Bytes)";
            hourlySheet.Cells[1, 4].Value = "Upload (Bytes)";
            hourlySheet.Cells[1, 5].Value = "Total (Bytes)";

            for (int i = 0; i < report.HourlyData.Count; i++)
            {
                var h = report.HourlyData[i];
                var row = i + 2;
                hourlySheet.Cells[row, 1].Value = h.FriendName;
                hourlySheet.Cells[row, 2].Value = h.Hour.ToString("yyyy-MM-dd HH:00");
                hourlySheet.Cells[row, 3].Value = h.DownloadBytes;
                hourlySheet.Cells[row, 4].Value = h.UploadBytes;
                hourlySheet.Cells[row, 5].Value = h.TotalBytes;
            }
        }

        if (report.Comparison.FriendATotal > 0 || report.Comparison.FriendBTotal > 0)
        {
            var compSheet = package.Workbook.Worksheets.Add("Comparison");
            compSheet.Cells[1, 1].Value = "Metric";
            compSheet.Cells[1, 2].Value = report.Comparison.FriendAName;
            compSheet.Cells[1, 3].Value = report.Comparison.FriendBName;
            compSheet.Cells[1, 4].Value = "Total";
            compSheet.Cells[1, 5].Value = $"{report.Comparison.FriendAName} %";
            compSheet.Cells[1, 6].Value = $"{report.Comparison.FriendBName} %";

            compSheet.Cells[2, 1].Value = "Download";
            compSheet.Cells[2, 2].Value = report.Comparison.FriendADownload;
            compSheet.Cells[2, 3].Value = report.Comparison.FriendBDownload;
            compSheet.Cells[2, 4].Value = report.Comparison.FriendADownload + report.Comparison.FriendBDownload;
            compSheet.Cells[2, 5].Value = report.Comparison.FriendAPercentage;
            compSheet.Cells[2, 6].Value = report.Comparison.FriendBPercentage;

            compSheet.Cells[3, 1].Value = "Upload";
            compSheet.Cells[3, 2].Value = report.Comparison.FriendAUpload;
            compSheet.Cells[3, 3].Value = report.Comparison.FriendBUpload;
            compSheet.Cells[3, 4].Value = report.Comparison.FriendAUpload + report.Comparison.FriendBUpload;
            compSheet.Cells[3, 5].Value = report.Comparison.FriendAPercentage;
            compSheet.Cells[3, 6].Value = report.Comparison.FriendBPercentage;

            compSheet.Cells[4, 1].Value = "Total";
            compSheet.Cells[4, 2].Value = report.Comparison.FriendATotal;
            compSheet.Cells[4, 3].Value = report.Comparison.FriendBTotal;
            compSheet.Cells[4, 4].Value = report.Comparison.FriendATotal + report.Comparison.FriendBTotal;
            compSheet.Cells[4, 5].Value = report.Comparison.FriendAPercentage;
            compSheet.Cells[4, 6].Value = report.Comparison.FriendBPercentage;
        }

        return await package.GetAsByteArrayAsync();
    }
}