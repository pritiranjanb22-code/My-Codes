namespace NetUsageMonitor.IntegrationTests.Mocks;

using System.Collections.Concurrent;
using Lextm.SharpSnmpLib;
using Lextm.SharpSnmpLib.Messaging;
using Lextm.SharpSnmpLib.Pipeline;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Snmp.Models;

public class MockSnmpDevice : IDisposable
{
    private readonly int _port;
    private readonly ConcurrentDictionary<string, ISnmpData> _scalarObjects = new();
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<int, ISnmpData>> _tableObjects = new();
    private readonly CancellationTokenSource _cts = new();
    private Task? _listenerTask;

    public MockSnmpDevice(int port = 1161)
    {
        _port = port;
        InitializeDefaultData();
    }

    public void Start()
    {
        _listenerTask = Task.Run(() => RunListenerAsync(_cts.Token), _cts.Token);
        Thread.Sleep(100); // Give it time to start
    }

    public void Stop()
    {
        _cts.Cancel();
        _listenerTask?.Wait(TimeSpan.FromSeconds(2));
    }

    public void SetInterfaceCounters(int ifIndex, ulong inOctets, ulong outOctets, ulong hcInOctets = 0, ulong hcOutOctets = 0)
    {
        var key = $"ifIndex.{ifIndex}";
        _scalarObjects[key] = new Integer32(ifIndex);
        
        SetTableValue(SnmpOids.IfDescr, ifIndex, new OctetString($"eth{ifIndex}"));
        SetTableValue(SnmpOids.IfName, ifIndex, new OctetString($"eth{ifIndex}"));
        SetTableValue(SnmpOids.IfType, ifIndex, new Integer32(6)); // Ethernet
        SetTableValue(SnmpOids.IfSpeed, ifIndex, new Gauge32(100000000));
        SetTableValue(SnmpOids.IfHighSpeed, ifIndex, new Gauge32(100));
        SetTableValue(SnmpOids.IfOperStatus, ifIndex, new Integer32(1)); // Up
        SetTableValue(SnmpOids.IfInOctets, ifIndex, new Counter32((uint)(inOctets & 0xFFFFFFFF)));
        SetTableValue(SnmpOids.IfOutOctets, ifIndex, new Counter32((uint)(outOctets & 0xFFFFFFFF)));
        
        if (hcInOctets > 0 || hcOutOctets > 0 || inOctets > uint.MaxValue || outOctets > uint.MaxValue)
        {
            SetTableValue(SnmpOids.IfHCInOctets, ifIndex, new Counter64(inOctets));
            SetTableValue(SnmpOids.IfHCOutOctets, ifIndex, new Counter64(outOctets));
        }
    }

    public void SetSystemInfo(string sysDescr = "Mock Router", string sysName = "MockRouter", string sysLocation = "Test Lab")
    {
        _scalarObjects[SnmpOids.SysDescr.ToString()] = new OctetString(sysDescr);
        _scalarObjects[SnmpOids.SysName.ToString()] = new OctetString(sysName);
        _scalarObjects[SnmpOids.SysLocation.ToString()] = new OctetString(sysLocation);
        _scalarObjects[SnmpOids.SysContact.ToString()] = new OctetString("admin@example.com");
        _scalarObjects[SnmpOids.SysServices.ToString()] = new Integer32(72);
    }

    public void SetInterfaceCount(int count)
    {
        _scalarObjects[SnmpOids.IfNumber.ToString()] = new Integer32(count);
    }

    private void InitializeDefaultData()
    {
        SetSystemInfo();
        SetInterfaceCount(4);
        
        SetInterfaceCounters(1, 1000000, 500000);
        SetInterfaceCounters(2, 2000000, 1000000);
        SetInterfaceCounters(3, 500000, 250000);
        SetInterfaceCounters(4, 0, 0, 0, 0); // Down interface
        
        SetTableValue(SnmpOids.IfDescr, 1, new OctetString("WAN Interface"));
        SetTableValue(SnmpOids.IfName, 1, new OctetString("eth0"));
        SetTableValue(SnmpOids.IfAlias, 1, new OctetString("Internet"));
        
        SetTableValue(SnmpOids.IfDescr, 2, new OctetString("LAN Interface"));
        SetTableValue(SnmpOids.IfName, 2, new OctetString("eth1"));
        SetTableValue(SnmpOids.IfAlias, 2, new OctetString("Local Network"));
    }

    private void SetTableValue(ObjectIdentifier oid, int index, ISnmpData value)
    {
        var key = oid.ToString();
        if (!_tableObjects.TryGetValue(key, out var dict))
        {
            dict = new ConcurrentDictionary<int, ISnmpData>();
            _tableObjects[key] = dict;
        }
        dict[index] = value;
    }

    private async Task RunListenerAsync(CancellationToken cancellationToken)
    {
        var endpoint = new System.Net.IPEndPoint(System.Net.IPAddress.Any, _port);
        var socket = new System.Net.Sockets.Socket(System.Net.Sockets.AddressFamily.InterNetwork, System.Net.Sockets.SocketType.Dgram, System.Net.Sockets.ProtocolType.Udp);
        socket.Bind(endpoint);
        socket.ReceiveTimeout = 1000;

        var buffer = new byte[4096];

        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var remoteEndPoint = new System.Net.IPEndPoint(System.Net.IPAddress.Any, 0);
                var received = await socket.ReceiveFromAsync(buffer, System.Net.Sockets.SocketFlags.None, remoteEndPoint);
                
                if (received.ReceivedBytes > 0)
                {
                    var requestData = new byte[received.ReceivedBytes];
                    Array.Copy(buffer, requestData, received.ReceivedBytes);
                    
                    var response = ProcessRequest(requestData);
                    if (response != null)
                    {
                        await socket.SendToAsync(response, System.Net.Sockets.SocketFlags.None, received.RemoteEndPoint);
                    }
                }
            }
            catch (SocketException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception)
            {
                // Ignore parsing errors
            }
        }

        socket.Close();
    }

    private byte[]? ProcessRequest(byte[] requestData)
    {
        try
        {
            var request = MessageParser.Parse(requestData);
            
            if (request is GetRequestMessage getRequest)
            {
                var variables = new List<Variable>();
                foreach (var variable in getRequest.Pdu().Variables)
                {
                    var responseVar = GetVariableValue(variable.Id);
                    if (responseVar != null)
                    {
                        variables.Add(new Variable(variable.Id, responseVar));
                    }
                    else
                    {
                        variables.Add(new Variable(variable.Id, new Null()));
                    }
                }

                var response = new GetResponseMessage(
                    getRequest.Version,
                    getRequest.RequestId,
                    getRequest.Community(),
                    variables.ToArray(),
                    ErrorCode.NoError,
                    0);

                return response.ToBytes();
            }
        }
        catch
        {
            // Ignore parsing errors
        }
        return null;
    }

    private ISnmpData? GetVariableValue(ObjectIdentifier oid)
    {
        var oidStr = oid.ToString();
        
        if (_scalarObjects.TryGetValue(oidStr, out var scalar))
            return scalar;

        foreach (var table in _tableObjects)
        {
            if (oidStr.StartsWith(table.Key + "."))
            {
                var indexStr = oidStr.Substring(table.Key.Length + 1);
                if (int.TryParse(indexStr, out var index))
                {
                    if (table.Value.TryGetValue(index, out var value))
                        return value;
                }
            }
        }

        return null;
    }

    public void Dispose()
    {
        Stop();
        _cts.Dispose();
    }
}

public class MockSnmpDeviceV3 : MockSnmpDevice
{
    public MockSnmpDeviceV3(int port = 1162) : base(port)
    {
        // SNMPv3 would require more complex implementation
        // For testing, we can use the same base but note it's v3
    }
}