namespace NetUsageMonitor.Tests.Monitoring;

using FluentAssertions;
using Moq;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;
using NetUsageMonitor.Services.Monitoring;
using Xunit;

public class CounterProcessorTests
{
    private readonly Mock<IUsageCalculator> _calculatorMock;
    private readonly CounterProcessor _processor;

    public CounterProcessorTests()
    {
        _calculatorMock = new Mock<IUsageCalculator>();
        _processor = new CounterProcessor(_calculatorMock.Object, Mock.Of<Microsoft.Extensions.Logging.ILogger<CounterProcessor>>());
    }

    [Fact]
    public void ProcessSample_NoPreviousSample_ReturnsZeroUsage()
    {
        var device = new Device { Id = 1 };
        var current = CollectorResult.SuccessResult(1000, 500);

        var sample = _processor.ProcessSample(device, current, null);

        sample.DownloadBytes.Should().Be(0);
        sample.UploadBytes.Should().Be(0);
        sample.TotalBytes.Should().Be(0);
        sample.ReceivedCounter.Should().Be(1000);
        sample.TransmittedCounter.Should().Be(500);
    }

    [Fact]
    public void ProcessSample_WithPreviousSample_CalculatesDifferences()
    {
        var device = new Device { Id = 1 };
        var previous = CollectorResult.SuccessResult(1000, 500);
        var current = CollectorResult.SuccessResult(2000, 1000);

        _calculatorMock.Setup(c => c.CalculateDifferences(2000, 1000, 1000, 500, false))
            .Returns((DataSize.FromBytes(1000), DataSize.FromBytes(500), false));

        var sample = _processor.ProcessSample(device, current, previous);

        sample.DownloadBytes.Should().Be(1000);
        sample.UploadBytes.Should().Be(500);
        sample.TotalBytes.Should().Be(1500);
    }

    [Fact]
    public void ProcessSample_WithReverseDirection_SwapsDownloadUpload()
    {
        var device = new Device { Id = 1, ReverseDirection = true };
        var previous = CollectorResult.SuccessResult(1000, 500);
        var current = CollectorResult.SuccessResult(2000, 1000);

        _calculatorMock.Setup(c => c.CalculateDifferences(2000, 1000, 1000, 500, false))
            .Returns((DataSize.FromBytes(1000), DataSize.FromBytes(500), false));

        var sample = _processor.ProcessSample(device, current, previous);

        sample.DownloadBytes.Should().Be(500);
        sample.UploadBytes.Should().Be(1000);
    }

    [Fact]
    public void ProcessSample_CounterWraparound_SetsStatus()
    {
        var device = new Device { Id = 1 };
        var previous = CollectorResult.SuccessResult(uint.MaxValue - 100, uint.MaxValue - 50);
        var current = CollectorResult.SuccessResult(100, 50);

        _calculatorMock.Setup(c => c.CalculateDifferences(100, (ulong)(uint.MaxValue - 100), 50, (ulong)(uint.MaxValue - 50), false))
            .Returns((DataSize.FromBytes(200), DataSize.FromBytes(100), true));

        var sample = _processor.ProcessSample(device, current, previous);

        sample.Status.Should().Be(SampleStatus.CounterWraparound);
    }

    [Fact]
    public void ProcessSample_CounterReset_SetsStatus()
    {
        var device = new Device { Id = 1 };
        var previous = CollectorResult.SuccessResult(1000, 500);
        var current = CollectorResult.SuccessResult(500, 200);

        _calculatorMock.Setup(c => c.CalculateDifferences(500, 1000, 200, 500, false))
            .Returns((DataSize.FromBytes(-500), DataSize.FromBytes(-300), false));

        var sample = _processor.ProcessSample(device, current, previous);

        sample.Status.Should().Be(SampleStatus.CounterReset);
        sample.DownloadBytes.Should().Be(0);
        sample.UploadBytes.Should().Be(0);
    }

    [Fact]
    public void AggregateDaily_WithValidSamples_ReturnsAggregatedUsage()
    {
        var deviceId = 1;
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        var samples = new List<TrafficSample>
        {
            new() { DeviceId = deviceId, Timestamp = DateTime.UtcNow.AddHours(-5), DownloadBytes = 1000, UploadBytes = 500, TotalBytes = 1500, Status = SampleStatus.Success },
            new() { DeviceId = deviceId, Timestamp = DateTime.UtcNow.AddHours(-3), DownloadBytes = 2000, UploadBytes = 1000, TotalBytes = 3000, Status = SampleStatus.Success },
            new() { DeviceId = deviceId, Timestamp = DateTime.UtcNow.AddHours(-1), DownloadBytes = 500, UploadBytes = 250, TotalBytes = 750, Status = SampleStatus.Success }
        };

        var result = _processor.AggregateDaily(deviceId, date, samples);

        result.Should().NotBeNull();
        result!.DownloadBytes.Should().Be(3500);
        result.UploadBytes.Should().Be(1750);
        result.TotalBytes.Should().Be(5250);
        result.Date.Should().Be(date);
    }

    [Fact]
    public void AggregateDaily_WithNoSamples_ReturnsNull()
    {
        var result = _processor.AggregateDaily(1, DateOnly.FromDateTime(DateTime.UtcNow), new List<TrafficSample>());
        result.Should().BeNull();
    }

    [Fact]
    public void AggregateDaily_WithFailedSamples_ExcludesThem()
    {
        var deviceId = 1;
        var date = DateOnly.FromDateTime(DateTime.UtcNow);
        var samples = new List<TrafficSample>
        {
            new() { DeviceId = deviceId, Timestamp = DateTime.UtcNow, DownloadBytes = 1000, UploadBytes = 500, TotalBytes = 1500, Status = SampleStatus.Success },
            new() { DeviceId = deviceId, Timestamp = DateTime.UtcNow, DownloadBytes = 2000, UploadBytes = 1000, TotalBytes = 3000, Status = SampleStatus.DeviceUnreachable }
        };

        var result = _processor.AggregateDaily(deviceId, date, samples);

        result.Should().NotBeNull();
        result!.DownloadBytes.Should().Be(1000);
        result.UploadBytes.Should().Be(500);
    }

    [Fact]
    public void AggregateMonthly_WithValidSamples_ReturnsAggregatedUsage()
    {
        var deviceId = 1;
        var now = DateTime.UtcNow;
        var samples = new List<TrafficSample>
        {
            new() { DeviceId = deviceId, Timestamp = new DateTime(now.Year, now.Month, 5), DownloadBytes = 1000, UploadBytes = 500, TotalBytes = 1500, Status = SampleStatus.Success },
            new() { DeviceId = deviceId, Timestamp = new DateTime(now.Year, now.Month, 15), DownloadBytes = 2000, UploadBytes = 1000, TotalBytes = 3000, Status = SampleStatus.Success }
        };

        var result = _processor.AggregateMonthly(deviceId, now.Year, now.Month, samples);

        result.Should().NotBeNull();
        result!.DownloadBytes.Should().Be(3000);
        result.UploadBytes.Should().Be(1500);
        result.TotalBytes.Should().Be(4500);
        result.Year.Should().Be(now.Year);
        result.Month.Should().Be(now.Month);
    }
}