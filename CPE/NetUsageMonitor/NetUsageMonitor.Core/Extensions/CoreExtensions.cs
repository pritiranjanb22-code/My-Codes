namespace NetUsageMonitor.Core.Extensions;

using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.ValueObjects;
using NetUsageMonitor.Core.Enums;

public static class DataSizeExtensions
{
    public static string ToDisplayString(this DataSize size, DataUnit unit = DataUnit.Gigabytes, bool useBinary = false, int decimals = 2)
        => size.ToString(unit, useBinary, decimals);
    
    public static string ToAutoString(this DataSize size, bool useBinary = false, int decimals = 2)
        => size.ToAutoString(useBinary, decimals);
}

public static class DeviceExtensions
{
    public static string GetDisplayName(this Device device)
        => string.IsNullOrWhiteSpace(device.FriendName) ? device.Name : $"{device.Name} ({device.FriendName})";
    
    public static bool IsHealthy(this Device device)
        => device.MonitoringEnabled && device.ConsecutiveFailures < 3;
    
    public static TimeSpan? TimeSinceLastPoll(this Device device)
        => device.LastSuccessfulPoll.HasValue ? DateTime.UtcNow - device.LastSuccessfulPoll.Value : null;
}

public static class TrafficSampleExtensions
{
    public static DataSize GetDownload(this TrafficSample sample) => DataSize.FromBytes(sample.DownloadBytes);
    public static DataSize GetUpload(this TrafficSample sample) => DataSize.FromBytes(sample.UploadBytes);
    public static DataSize GetTotal(this TrafficSample sample) => DataSize.FromBytes(sample.TotalBytes);
    public static double GetDownloadMbps(this TrafficSample sample, double intervalSeconds)
        => sample.DownloadBytes * 8 / (intervalSeconds * 1_000_000);
    public static double GetUploadMbps(this TrafficSample sample, double intervalSeconds)
        => sample.UploadBytes * 8 / (intervalSeconds * 1_000_000);
}

public static class DateTimeExtensions
{
    public static DateOnly ToDateOnly(this DateTime dt) => DateOnly.FromDateTime(dt);
    public static DateTime StartOfDay(this DateOnly date) => date.ToDateTime(TimeOnly.MinValue);
    public static DateTime EndOfDay(this DateOnly date) => date.ToDateTime(TimeOnly.MaxValue);
    public static DateTime StartOfMonth(this DateTime dt) => new(dt.Year, dt.Month, 1);
    public static DateTime EndOfMonth(this DateTime dt) => new(dt.Year, dt.Month, DateTime.DaysInMonth(dt.Year, dt.Month), 23, 59, 59);
}

public static class EnumerableExtensions
{
    public static DataSize SumDownload(this IEnumerable<TrafficSample> samples)
        => DataSize.FromBytes(samples.Sum(s => s.DownloadBytes));
    
    public static DataSize SumUpload(this IEnumerable<TrafficSample> samples)
        => DataSize.FromBytes(samples.Sum(s => s.UploadBytes));
    
    public static DataSize SumTotal(this IEnumerable<TrafficSample> samples)
        => DataSize.FromBytes(samples.Sum(s => s.TotalBytes));
    
    public static DataSize SumDownload(this IEnumerable<DailyUsage> usages)
        => DataSize.FromBytes(usages.Sum(u => u.DownloadBytes));
    
    public static DataSize SumUpload(this IEnumerable<DailyUsage> usages)
        => DataSize.FromBytes(usages.Sum(u => u.UploadBytes));
    
    public static DataSize SumTotal(this IEnumerable<DailyUsage> usages)
        => DataSize.FromBytes(usages.Sum(u => u.TotalBytes));
}