namespace NetUsageMonitor.Services.Monitoring;

using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;

public class CounterProcessor : ICounterProcessor
{
    private readonly IUsageCalculator _calculator;
    private readonly ILogger<CounterProcessor> _logger;

    public CounterProcessor(IUsageCalculator calculator, ILogger<CounterProcessor> logger)
    {
        _calculator = calculator;
        _logger = logger;
    }

    public TrafficSample ProcessSample(Device device, CollectorResult current, CollectorResult? previous)
    {
        var sample = new TrafficSample
        {
            DeviceId = device.Id,
            Timestamp = current.Timestamp,
            ReceivedCounter = current.ReceivedCounter,
            TransmittedCounter = current.TransmittedCounter,
            Status = current.Status,
            ErrorMessage = current.ErrorMessage,
            LatencyMs = current.LatencyMs
        };

        if (!current.Success || previous == null)
        {
            sample.DownloadBytes = 0;
            sample.UploadBytes = 0;
            sample.TotalBytes = 0;
            return sample;
        }

        var use64Bit = current.ReceivedCounter > uint.MaxValue || current.TransmittedCounter > uint.MaxValue ||
                       previous.ReceivedCounter > uint.MaxValue || previous.TransmittedCounter > uint.MaxValue;

        var (download, upload, wrapped) = _calculator.CalculateDifferences(
            current.ReceivedCounter,
            previous.ReceivedCounter,
            current.TransmittedCounter,
            previous.TransmittedCounter,
            use64Bit);

        if (device.ReverseDirection)
        {
            sample.DownloadBytes = (long)upload.Bytes;
            sample.UploadBytes = (long)download.Bytes;
        }
        else
        {
            sample.DownloadBytes = (long)download.Bytes;
            sample.UploadBytes = (long)upload.Bytes;
        }

        sample.TotalBytes = sample.DownloadBytes + sample.UploadBytes;

        if (wrapped)
        {
            sample.Status = SampleStatus.CounterWraparound;
            _logger.LogWarning("Counter wraparound detected for device {DeviceId}", device.Id);
        }

        if (sample.DownloadBytes < 0 || sample.UploadBytes < 0)
        {
            sample.Status = SampleStatus.CounterReset;
            _logger.LogWarning("Counter reset detected for device {DeviceId}", device.Id);
            sample.DownloadBytes = Math.Max(0, sample.DownloadBytes);
            sample.UploadBytes = Math.Max(0, sample.UploadBytes);
            sample.TotalBytes = sample.DownloadBytes + sample.UploadBytes;
        }

        return sample;
    }

    public DailyUsage? AggregateDaily(int deviceId, DateOnly date, IEnumerable<TrafficSample> samples)
    {
        var daySamples = samples.Where(s => DateOnly.FromDateTime(s.Timestamp) == date).ToList();
        if (!daySamples.Any())
            return null;

        var validSamples = daySamples.Where(s => s.Status == SampleStatus.Success).ToList();
        if (!validSamples.Any())
            return null;

        var totalDownload = validSamples.Sum(s => s.DownloadBytes);
        var totalUpload = validSamples.Sum(s => s.UploadBytes);

        return new DailyUsage
        {
            DeviceId = deviceId,
            Date = date,
            DownloadBytes = totalDownload,
            UploadBytes = totalUpload,
            TotalBytes = totalDownload + totalUpload
        };
    }

    public MonthlyUsage? AggregateMonthly(int deviceId, int year, int month, IEnumerable<TrafficSample> samples)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddSeconds(-1);
        
        var monthSamples = samples.Where(s => s.Timestamp >= startDate && s.Timestamp <= endDate).ToList();
        if (!monthSamples.Any())
            return null;

        var validSamples = monthSamples.Where(s => s.Status == SampleStatus.Success).ToList();
        if (!validSamples.Any())
            return null;

        var totalDownload = validSamples.Sum(s => s.DownloadBytes);
        var totalUpload = validSamples.Sum(s => s.UploadBytes);

        return new MonthlyUsage
        {
            DeviceId = deviceId,
            Year = year,
            Month = month,
            DownloadBytes = totalDownload,
            UploadBytes = totalUpload,
            TotalBytes = totalDownload + totalUpload
        };
    }
}

public class UsageCalculator : IUsageCalculator
{
    private const ulong Max32Bit = 0xFFFFFFFF;
    private const ulong Max64Bit = 0xFFFFFFFFFFFFFFFF;

    public DataSize CalculateDownload(ulong currentIn, ulong previousIn, bool is64Bit)
    {
        var diff = CalculateCounterDifference(currentIn, previousIn, is64Bit);
        return DataSize.FromBytes((long)diff);
    }

    public DataSize CalculateUpload(ulong currentOut, ulong previousOut, bool is64Bit)
    {
        var diff = CalculateCounterDifference(currentOut, previousOut, is64Bit);
        return DataSize.FromBytes((long)diff);
    }

    public DataSize CalculateTotal(DataSize download, DataSize upload)
        => download + upload;

    public (DataSize download, DataSize upload, bool wrapped) CalculateDifferences(
        ulong currentIn, ulong previousIn, ulong currentOut, ulong previousOut, bool use64Bit)
    {
        var maxValue = use64Bit ? Max64Bit : Max32Bit;
        var wrapped = false;

        var inDiff = CalculateCounterDifference(currentIn, previousIn, use64Bit, ref wrapped);
        var outDiff = CalculateCounterDifference(currentOut, previousOut, use64Bit, ref wrapped);

        return (DataSize.FromBytes((long)inDiff), DataSize.FromBytes((long)outDiff), wrapped);
    }

    private ulong CalculateCounterDifference(ulong current, ulong previous, bool use64Bit, ref bool wrapped)
    {
        var maxValue = use64Bit ? Max64Bit : Max32Bit;
        
        if (current >= previous)
        {
            return current - previous;
        }
        else
        {
            wrapped = true;
            return (maxValue - previous) + current + 1;
        }
    }

    private ulong CalculateCounterDifference(ulong current, ulong previous, bool use64Bit)
    {
        var wrapped = false;
        return CalculateCounterDifference(current, previous, use64Bit, ref wrapped);
    }
}