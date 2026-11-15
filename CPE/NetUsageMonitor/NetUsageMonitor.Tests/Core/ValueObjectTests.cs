namespace NetUsageMonitor.Tests.Core;

using FluentAssertions;
using NetUsageMonitor.Core.ValueObjects;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Extensions;
using Xunit;

public class DataSizeTests
{
    [Theory]
    [InlineData(0, "0 B")]
    [InlineData(512, "512 B")]
    [InlineData(1024, "1 KB")]
    [InlineData(1536, "1.5 KB")]
    [InlineData(1024 * 1024, "1 MB")]
    [InlineData(1024 * 1024 * 1024, "1 GB")]
    [InlineData(1024L * 1024 * 1024 * 1024, "1 TB")]
    public void ToAutoString_WithDecimalUnits_FormatsCorrectly(long bytes, string expected)
    {
        var size = DataSize.FromBytes(bytes);
        var result = size.ToAutoString(false);
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData(0, "0 B")]
    [InlineData(1024, "1 KiB")]
    [InlineData(1024 * 1024, "1 MiB")]
    [InlineData(1024L * 1024 * 1024, "1 GiB")]
    [InlineData(1024L * 1024 * 1024 * 1024, "1 TiB")]
    public void ToAutoString_WithBinaryUnits_FormatsCorrectly(long bytes, string expected)
    {
        var size = DataSize.FromBytes(bytes);
        var result = size.ToAutoString(true);
        result.Should().Be(expected);
    }

    [Fact]
    public void Arithmetic_Operations_WorkCorrectly()
    {
        var a = DataSize.FromBytes(1000);
        var b = DataSize.FromBytes(500);

        (a + b).Bytes.Should().Be(1500);
        (a - b).Bytes.Should().Be(500);
        (a * 2).Bytes.Should().Be(2000);
        (a / 2).Bytes.Should().Be(500);
    }

    [Fact]
    public void Comparisons_WorkCorrectly()
    {
        var a = DataSize.FromBytes(1000);
        var b = DataSize.FromBytes(500);

        (a > b).Should().BeTrue();
        (a < b).Should().BeFalse();
        (a >= b).Should().BeTrue();
        (a <= b).Should().BeFalse();
        (a == DataSize.FromBytes(1000)).Should().BeTrue();
        (a != b).Should().BeTrue();
    }

    [Fact]
    public void FromFactoryMethods_CreateCorrectValues()
    {
        DataSize.FromKilobytes(1).Bytes.Should().Be(1024);
        DataSize.FromMegabytes(1).Bytes.Should().Be(1024 * 1024);
        DataSize.FromGigabytes(1).Bytes.Should().Be(1024L * 1024 * 1024);
        DataSize.FromTerabytes(1).Bytes.Should().Be(1024L * 1024 * 1024 * 1024);

        DataSize.FromKibibytes(1).Bytes.Should().Be(1024);
        DataSize.FromMebibytes(1).Bytes.Should().Be(1024 * 1024);
        DataSize.FromGibibytes(1).Bytes.Should().Be(1024L * 1024 * 1024);
        DataSize.FromTebibytes(1).Bytes.Should().Be(1024L * 1024 * 1024 * 1024);
    }
}

public class MacAddressTests
{
    [Theory]
    [InlineData("00:11:22:33:44:55", true)]
    [InlineData("00-11-22-33-44-55", true)]
    [InlineData("0011.2233.4455", true)]
    [InlineData("001122334455", true)]
    [InlineData("00:11:22:33:44", false)]
    [InlineData("GG:11:22:33:44:55", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void TryParse_VariousFormats_ReturnsExpectedResult(string? input, bool expected)
    {
        var result = MacAddress.TryParse(input, out var mac);
        result.Should().Be(expected);
        
        if (expected)
        {
            mac.Value.Should().Be("00:11:22:33:44:55");
        }
    }
}

public class IpAddressTests
{
    [Theory]
    [InlineData("192.168.1.1", true)]
    [InlineData("10.0.0.1", true)]
    [InlineData("::1", true)]
    [InlineData("2001:db8::1", true)]
    [InlineData("256.256.256.256", false)]
    [InlineData("not-an-ip", false)]
    [InlineData("", false)]
    public void TryParse_VariousFormats_ReturnsExpectedResult(string? input, bool expected)
    {
        var result = IpAddress.TryParse(input, out var ip);
        result.Should().Be(expected);
    }
}

public class InterfaceIndexTests
{
    [Fact]
    public void ImplicitConversions_WorkCorrectly()
    {
        InterfaceIndex index = 5;
        int value = index;
        value.Should().Be(5);

        index = (InterfaceIndex)10;
        value = index;
        value.Should().Be(10);
    }
}

public class DomainModelTests
{
    [Fact]
    public void Device_GetDisplayName_ReturnsCorrectFormat()
    {
        var device = new Device { Name = "Router1", FriendName = "Friend A" };
        device.GetDisplayName().Should().Be("Router1 (Friend A)");

        device.FriendName = "";
        device.GetDisplayName().Should().Be("Router1");
    }

    [Fact]
    public void Device_IsHealthy_ReturnsCorrectValue()
    {
        var device = new Device { MonitoringEnabled = true, ConsecutiveFailures = 0 };
        device.IsHealthy().Should().BeTrue();

        device.ConsecutiveFailures = 3;
        device.IsHealthy().Should().BeFalse();

        device.MonitoringEnabled = false;
        device.IsHealthy().Should().BeFalse();
    }
}

public class TrafficSampleExtensionsTests
{
    [Fact]
    public void GetDownload_ReturnsCorrectDataSize()
    {
        var sample = new TrafficSample { DownloadBytes = 1024 * 1024 };
        var size = sample.GetDownload();
        size.Megabytes.Should().BeApproximately(1.0, 0.01);
    }

    [Fact]
    public void GetUpload_ReturnsCorrectDataSize()
    {
        var sample = new TrafficSample { UploadBytes = 512 * 1024 };
        var size = sample.GetUpload();
        size.Kilobytes.Should().BeApproximately(512.0, 0.01);
    }

    [Fact]
    public void GetTotal_ReturnsCorrectDataSize()
    {
        var sample = new TrafficSample { DownloadBytes = 1024, UploadBytes = 1024 };
        var size = sample.GetTotal();
        size.Kilobytes.Should().BeApproximately(2.0, 0.01);
    }

    [Fact]
    public void GetDownloadMbps_CalculatesCorrectly()
    {
        var sample = new TrafficSample { DownloadBytes = 1024 * 1024 }; // 1 MB
        var mbps = sample.GetDownloadMbps(1); // 1 second interval
        mbps.Should().BeApproximately(8.0, 0.1); // 8 Mbps
    }
}