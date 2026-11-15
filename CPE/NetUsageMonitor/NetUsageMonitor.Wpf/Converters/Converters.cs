namespace NetUsageMonitor.Wpf.Converters;

using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;

public class BooleanToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool b)
            return b ? Visibility.Visible : Visibility.Collapsed;
        return Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return value is Visibility v && v == Visibility.Visible;
    }
}

public class InverseBooleanToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool b)
            return b ? Visibility.Collapsed : Visibility.Visible;
        return Visibility.Visible;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return value is Visibility v && v == Visibility.Collapsed;
    }
}

public class DataSizeToStringConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is DataSize size)
        {
            var useBinary = parameter is bool b && b;
            return size.ToAutoString(useBinary);
        }
        if (value is long bytes)
        {
            var useBinary = parameter is bool b && b;
            return DataSize.FromBytes(bytes).ToAutoString(useBinary);
        }
        return "0 B";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class AlertSeverityToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is AlertSeverity severity)
        {
            return severity switch
            {
                AlertSeverity.Info => new SolidColorBrush(Color.FromRgb(0x21, 0x96, 0xF3)),
                AlertSeverity.Warning => new SolidColorBrush(Color.FromRgb(0xFF, 0x98, 0x00)),
                AlertSeverity.Critical => new SolidColorBrush(Color.FromRgb(0xF4, 0x43, 0x36)),
                _ => new SolidColorBrush(Color.FromRgb(0x75, 0x75, 0x75))
            };
        }
        return new SolidColorBrush(Color.FromRgb(0x75, 0x75, 0x75));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class ConnectionStatusToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is string status)
        {
            if (status.Contains("Online", StringComparison.OrdinalIgnoreCase))
                return new SolidColorBrush(Color.FromRgb(0x4C, 0xAF, 0x50));
            if (status.Contains("Offline", StringComparison.OrdinalIgnoreCase))
                return new SolidColorBrush(Color.FromRgb(0xF4, 0x43, 0x36));
            return new SolidColorBrush(Color.FromRgb(0xFF, 0x98, 0x00));
        }
        return new SolidColorBrush(Color.FromRgb(0xFF, 0x98, 0x00));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class SampleStatusToStringConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is SampleStatus status)
        {
            return status switch
            {
                SampleStatus.Success => "Success",
                SampleStatus.DeviceUnreachable => "Device Unreachable",
                SampleStatus.SnmpError => "SNMP Error",
                SampleStatus.CounterReset => "Counter Reset",
                SampleStatus.CounterWraparound => "Counter Wraparound",
                SampleStatus.InterfaceDown => "Interface Down",
                SampleStatus.AuthenticationFailed => "Auth Failed",
                SampleStatus.Timeout => "Timeout",
                SampleStatus.UnknownError => "Unknown Error",
                _ => "Unknown"
            };
        }
        return "Unknown";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class BooleanToBrushConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool b && parameter is string colors)
        {
            var parts = colors.Split(';');
            if (parts.Length == 2)
            {
                var colorStr = b ? parts[0] : parts[1];
                if (ColorConverter.ConvertFromString(colorStr) is Color color)
                    return new SolidColorBrush(color);
            }
        }
        return new SolidColorBrush(Colors.Gray);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class BooleanToStatusTextConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool b && parameter is string texts)
        {
            var parts = texts.Split(';');
            return b ? (parts.Length > 0 ? parts[0] : "Yes") : (parts.Length > 1 ? parts[1] : "No");
        }
        return "Unknown";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class FailureCountToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is int count)
        {
            return count switch
            {
                0 => new SolidColorBrush(Color.FromRgb(0x4C, 0xAF, 0x50)),
                1 or 2 => new SolidColorBrush(Color.FromRgb(0xFF, 0x98, 0x00)),
                _ => new SolidColorBrush(Color.FromRgb(0xF4, 0x43, 0x36))
            };
        }
        return new SolidColorBrush(Colors.Gray);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class StringToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return string.IsNullOrWhiteSpace(value?.ToString()) ? Visibility.Collapsed : Visibility.Visible;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class NullToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return value != null ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class CountToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var inverse = parameter is string p && p == "Inverse";
        
        if (value is int count)
        {
            var visible = count > 0;
            return (inverse ? !visible : visible) ? Visibility.Visible : Visibility.Collapsed;
        }
        if (value is System.Collections.ICollection collection)
        {
            var visible = collection.Count > 0;
            return (inverse ? !visible : visible) ? Visibility.Visible : Visibility.Collapsed;
        }
        return inverse ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class CollectorTypeToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is CollectorType type && parameter is string param)
        {
            var match = Enum.TryParse<CollectorType>(param, out var target) && type == target;
            return match ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class SnmpVersionToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is SnmpVersion version && parameter is string param)
        {
            var match = Enum.TryParse<SnmpVersion>(param, out var target) && version == target;
            return match ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class PeriodToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is ReportPeriod period && parameter is string param)
        {
            var match = Enum.TryParse<ReportPeriod>(param, out var target) && period == target;
            return match ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class TestResultToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is string result)
        {
            return result switch
            {
                "Success" => new SolidColorBrush(Color.FromRgb(0x4C, 0xAF, 0x50)),
                "Failed" => new SolidColorBrush(Color.FromRgb(0xF4, 0x43, 0x36)),
                "Error" => new SolidColorBrush(Color.FromRgb(0xFF, 0x98, 0x00)),
                _ => new SolidColorBrush(Color.FromRgb(0x75, 0x75, 0x75))
            };
        }
        return new SolidColorBrush(Color.FromRgb(0x75, 0x75, 0x75));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class BoolToEditTextConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool isEditing)
            return isEditing ? "Edit Device" : "Add Device";
        return "Add Device";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class UnitToggleTextConverter
{
    public static readonly UnitToggleTextConverter Instance = new();

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool useBinary)
            return useBinary ? "Switch to Decimal (GB)" : "Switch to Binary (GiB)";
        return "Switch Units";
    }
}

public class FriendNameToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is string name)
        {
            return name switch
            {
                "Friend A" => new SolidColorBrush(Color.FromRgb(0x19, 0x76, 0xD2)),
                "Friend B" => new SolidColorBrush(Color.FromRgb(0xFF, 0x98, 0x00)),
                _ => new SolidColorBrush(Color.FromRgb(0x21, 0x21, 0x21))
            };
        }
        return new SolidColorBrush(Color.FromRgb(0x21, 0x21, 0x21));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class MonitoringStatusConverter
{
    public static readonly MonitoringStatusConverter Instance = new();

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool isActive)
            return isActive ? "Monitoring Active" : "Monitoring Stopped";
        return "Unknown";
    }
}

public class ToggleMonitoringTextConverter
{
    public static readonly ToggleMonitoringTextConverter Instance = new();

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool isActive)
            return isActive ? "Stop Monitoring" : "Start Monitoring";
        return "Start Monitoring";
    }
}