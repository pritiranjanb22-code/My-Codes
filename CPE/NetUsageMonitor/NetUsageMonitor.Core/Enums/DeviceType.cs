namespace NetUsageMonitor.Core.Enums;

public enum DeviceType
{
    Router = 1,
    Cpe = 2,
    Switch = 3,
    AccessPoint = 4,
    Other = 99
}

public enum SnmpVersion
{
    V1 = 0,
    V2c = 1,
    V3 = 3
}

public enum CollectorType
{
    Snmp = 1,
    RouterApi = 2,
    Manual = 3,
    Custom = 99
}

public enum InterfaceDirection
{
    Unknown = 0,
    Inbound = 1,
    Outbound = 2,
    Both = 3
}

public enum SampleStatus
{
    Success = 1,
    DeviceUnreachable = 2,
    SnmpError = 3,
    CounterReset = 4,
    CounterWraparound = 5,
    InterfaceDown = 6,
    AuthenticationFailed = 7,
    Timeout = 8,
    UnknownError = 99
}

public enum AlertType
{
    MonthlyUsageLimit = 1,
    DailyUsageLimit = 2,
    DeviceOffline = 3,
    PollingFailure = 4,
    HighBandwidth = 5
}

public enum AlertSeverity
{
    Info = 1,
    Warning = 2,
    Critical = 3
}

public enum ReportPeriod
{
    Today = 1,
    Yesterday = 2,
    ThisWeek = 3,
    ThisMonth = 4,
    LastMonth = 5,
    Custom = 99
}

public enum DataUnit
{
    Bytes = 0,
    Kilobytes = 1,
    Megabytes = 2,
    Gigabytes = 3,
    Terabytes = 4,
    Kibibytes = 101,
    Mebibytes = 102,
    Gibibytes = 103,
    Tebibytes = 104
}

public enum ThemeMode
{
    Light = 0,
    Dark = 1,
    System = 2
}