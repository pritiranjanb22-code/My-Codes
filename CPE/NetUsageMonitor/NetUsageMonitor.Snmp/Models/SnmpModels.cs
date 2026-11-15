namespace NetUsageMonitor.Snmp.Models;

using Lextm.SharpSnmpLib;

public static class SnmpOids
{
    public static readonly ObjectIdentifier IfNumber = new("1.3.6.1.2.1.2.1.0");
    public static readonly ObjectIdentifier IfIndex = new("1.3.6.1.2.1.2.2.1.1");
    public static readonly ObjectIdentifier IfDescr = new("1.3.6.1.2.1.2.2.1.2");
    public static readonly ObjectIdentifier IfType = new("1.3.6.1.2.1.2.2.1.3");
    public static readonly ObjectIdentifier IfMtu = new("1.3.6.1.2.1.2.2.1.4");
    public static readonly ObjectIdentifier IfSpeed = new("1.3.6.1.2.1.2.2.1.5");
    public static readonly ObjectIdentifier IfPhysAddress = new("1.3.6.1.2.1.2.2.1.6");
    public static readonly ObjectIdentifier IfAdminStatus = new("1.3.6.1.2.1.2.2.1.7");
    public static readonly ObjectIdentifier IfOperStatus = new("1.3.6.1.2.1.2.2.1.8");
    public static readonly ObjectIdentifier IfLastChange = new("1.3.6.1.2.1.2.2.1.9");
    public static readonly ObjectIdentifier IfInOctets = new("1.3.6.1.2.1.2.2.1.10");
    public static readonly ObjectIdentifier IfOutOctets = new("1.3.6.1.2.1.2.2.1.16");
    public static readonly ObjectIdentifier IfInUcastPkts = new("1.3.6.1.2.1.2.2.1.11");
    public static readonly ObjectIdentifier IfOutUcastPkts = new("1.3.6.1.2.1.2.2.1.17");
    public static readonly ObjectIdentifier IfInDiscards = new("1.3.6.1.2.1.2.2.1.13");
    public static readonly ObjectIdentifier IfOutDiscards = new("1.3.6.1.2.1.2.2.1.19");
    public static readonly ObjectIdentifier IfInErrors = new("1.3.6.1.2.1.2.2.1.14");
    public static readonly ObjectIdentifier IfOutErrors = new("1.3.6.1.2.1.2.2.1.20");
    public static readonly ObjectIdentifier IfName = new("1.3.6.1.2.1.31.1.1.1.1");
    public static readonly ObjectIdentifier IfHCInOctets = new("1.3.6.1.2.1.31.1.1.1.6");
    public static readonly ObjectIdentifier IfHCOutOctets = new("1.3.6.1.2.1.31.1.1.1.10");
    public static readonly ObjectIdentifier IfLinkUpDownTrapEnable = new("1.3.6.1.2.1.31.1.1.1.17");
    public static readonly ObjectIdentifier IfHighSpeed = new("1.3.6.1.2.1.31.1.1.1.18");
    public static readonly ObjectIdentifier IfPromiscuousMode = new("1.3.6.1.2.1.31.1.1.1.19");
    public static readonly ObjectIdentifier IfConnectorPresent = new("1.3.6.1.2.1.31.1.1.1.20");
    public static readonly ObjectIdentifier IfAlias = new("1.3.6.1.2.1.31.1.1.1.18");
    
    public static readonly ObjectIdentifier SysDescr = new("1.3.6.1.2.1.1.1.0");
    public static readonly ObjectIdentifier SysObjectID = new("1.3.6.1.2.1.1.2.0");
    public static readonly ObjectIdentifier SysUpTime = new("1.3.6.1.2.1.1.3.0");
    public static readonly ObjectIdentifier SysContact = new("1.3.6.1.2.1.1.4.0");
    public static readonly ObjectIdentifier SysName = new("1.3.6.1.2.1.1.5.0");
    public static readonly ObjectIdentifier SysLocation = new("1.3.6.1.2.1.1.6.0");
    public static readonly ObjectIdentifier SysServices = new("1.3.6.1.2.1.1.7.0");
}

public class SnmpInterfaceInfo
{
    public int Index { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Type { get; set; }
    public long Speed { get; set; }
    public int AdminStatus { get; set; }
    public int OperStatus { get; set; }
    public long LastChange { get; set; }
    public ulong InOctets { get; set; }
    public ulong OutOctets { get; set; }
    public ulong HCInOctets { get; set; }
    public ulong HCOutOctets { get; set; }
    public string PhysicalAddress { get; set; } = string.Empty;
    public string Alias { get; set; } = string.Empty;
    public bool IsUp => OperStatus == 1;
    public bool SupportsHighCapacity => HCInOctets > 0 || HCOutOctets > 0;
}

public class SnmpDeviceInfo
{
    public string SysDescr { get; set; } = string.Empty;
    public string SysObjectID { get; set; } = string.Empty;
    public long SysUpTime { get; set; }
    public string SysContact { get; set; } = string.Empty;
    public string SysName { get; set; } = string.Empty
    public string SysLocation { get; set; } = string.Empty;
    public int SysServices { get; set; }
    public List<SnmpInterfaceInfo> Interfaces { get; set; } = new();
}