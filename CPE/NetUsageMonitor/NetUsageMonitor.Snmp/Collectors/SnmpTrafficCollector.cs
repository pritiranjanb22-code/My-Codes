namespace NetUsageMonitor.Snmp.Collectors;

using System.Net;
using Lextm.SharpSnmpLib;
using Lextm.SharpSnmpLib.Messaging;
using Lextm.SharpSnmpLib.Security;
using Lextm.SharpSnmpLib.Pipeline;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Snmp.Models;

public class SnmpTrafficCollector : ITrafficCollector, IDisposable
{
    public CollectorType Type => CollectorType.Snmp;
    
    private readonly ILogger<SnmpTrafficCollector> _logger;
    private readonly ICredentialStore _credentialStore;
    private SnmpV3Parameter? _snmpV3Params;

    public SnmpTrafficCollector(ILogger<SnmpTrafficCollector> logger, ICredentialStore credentialStore)
    {
        _logger = logger;
        _credentialStore = credentialStore;
    }

    public async Task<CollectorResult> CollectAsync(Device device, CancellationToken cancellationToken = default)
    {
        var snmpSettings = device.SnmpSettings;
        if (snmpSettings == null)
            return CollectorResult.Failure(SampleStatus.SnmpError, "SNMP settings not configured");

        var interfaceId = device.InterfaceId;
        if (string.IsNullOrEmpty(interfaceId))
            return CollectorResult.Failure(SampleStatus.SnmpError, "Interface not selected");

        if (!int.TryParse(interfaceId, out var ifIndex))
            return CollectorResult.Failure(SampleStatus.SnmpError, "Invalid interface index");

        try
        {
            var ipAddress = IPAddress.Parse(device.IpAddress);
            var endpoint = new IPEndPoint(ipAddress, device.Port);
            
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            ISnmpMessage message;
            Variable inOctetsVar, outOctetsVar, operStatusVar, speedVar;

            if (snmpSettings.Version == SnmpVersion.V3)
            {
                await InitializeV3ParametersAsync(snmpSettings);
                if (_snmpV3Params == null)
                    return CollectorResult.Failure(SampleStatus.AuthenticationFailed, "Failed to initialize SNMPv3 parameters");

                var request = new GetRequestMessage(
                    VersionCode.V3,
                    Messenger.NextRequestId,
                    Messenger.NextMessageId,
                    _snmpV3Params,
                    new[] 
                    { 
                        new Variable(SnmpOids.IfHCInOctets + "." + ifIndex),
                        new Variable(SnmpOids.IfHCOutOctets + "." + ifIndex),
                        new Variable(SnmpOids.IfOperStatus + "." + ifIndex),
                        new Variable(SnmpOids.IfHighSpeed + "." + ifIndex)
                    },
                    new OctetString(snmpSettings.ContextName ?? ""),
                    new OctetString(snmpSettings.ContextEngineId ?? ""),
                    snmpSettings.TimeoutMs,
                    snmpSettings.Retries);

                var response = await Task.Run(() => Messenger.GetResponse(request, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                
                if (response is not GetResponseMessage getResponse)
                    return CollectorResult.Failure(SampleStatus.SnmpError, "Invalid SNMP response");

                message = getResponse;
            }
            else
            {
                var community = await _credentialStore.RetrieveAsync($"snmp_community_{device.Id}") 
                    ?? snmpSettings.Community;

                var request = new GetRequestMessage(
                    snmpSettings.Version == SnmpVersion.V2c ? VersionCode.V2 : VersionCode.V1,
                    Messenger.NextRequestId,
                    new OctetString(community),
                    new[]
                    {
                        new Variable(SnmpOids.IfHCInOctets + "." + ifIndex),
                        new Variable(SnmpOids.IfHCOutOctets + "." + ifIndex),
                        new Variable(SnmpOids.IfOperStatus + "." + ifIndex),
                        new Variable(SnmpOids.IfHighSpeed + "." + ifIndex)
                    },
                    snmpSettings.TimeoutMs,
                    snmpSettings.Retries);

                var response = await Task.Run(() => Messenger.GetResponse(request, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                
                if (response is not GetResponseMessage getResponse)
                    return CollectorResult.Failure(SampleStatus.SnmpError, "Invalid SNMP response");

                message = getResponse;
            }

            stopwatch.Stop();
            var latency = stopwatch.Elapsed.TotalMilliseconds;

            var variables = message.Pdu().Variables;
            if (variables.Count < 4)
                return CollectorResult.Failure(SampleStatus.SnmpError, "Incomplete SNMP response");

            var inOctets = variables[0].Data.ToUInt64();
            var outOctets = variables[1].Data.ToUInt64();
            var operStatus = variables[2].Data.ToInt32();
            var speed = variables[3].Data.ToInt64();

            var interfaceUp = operStatus == 1;

            if (!interfaceUp)
                return CollectorResult.Failure(SampleStatus.InterfaceDown, "Interface is down");

            return CollectorResult.SuccessResult(inOctets, outOctets, latency, interfaceUp, speed);
        }
        catch (OperationCanceledException)
        {
            return CollectorResult.Failure(SampleStatus.Timeout, "Request cancelled");
        }
        catch (SnmpException ex)
        {
            _logger.LogError(ex, "SNMP error for device {DeviceId}", device.Id);
            return MapSnmpError(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error collecting SNMP data for device {DeviceId}", device.Id);
            return CollectorResult.Failure(SampleStatus.UnknownError, ex.Message);
        }
    }

    public async Task<bool> TestConnectionAsync(Device device, CancellationToken cancellationToken = default)
    {
        var snmpSettings = device.SnmpSettings;
        if (snmpSettings == null)
            return false;

        try
        {
            var ipAddress = IPAddress.Parse(device.IpAddress);
            var endpoint = new IPEndPoint(ipAddress, device.Port);

            if (snmpSettings.Version == SnmpVersion.V3)
            {
                await InitializeV3ParametersAsync(snmpSettings);
                if (_snmpV3Params == null)
                    return false;

                var request = new GetRequestMessage(
                    VersionCode.V3,
                    Messenger.NextRequestId,
                    Messenger.NextMessageId,
                    _snmpV3Params,
                    [new Variable(SnmpOids.SysDescr)],
                    new OctetString(snmpSettings.ContextName ?? ""),
                    new OctetString(snmpSettings.ContextEngineId ?? ""),
                    snmpSettings.TimeoutMs,
                    snmpSettings.Retries);

                var response = await Task.Run(() => Messenger.GetResponse(request, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                return response is GetResponseMessage;
            }
            else
            {
                var community = await _credentialStore.RetrieveAsync($"snmp_community_{device.Id}") 
                    ?? snmpSettings.Community;

                var request = new GetRequestMessage(
                    snmpSettings.Version == SnmpVersion.V2c ? VersionCode.V2 : VersionCode.V1,
                    Messenger.NextRequestId,
                    new OctetString(community),
                    [new Variable(SnmpOids.SysDescr)],
                    snmpSettings.TimeoutMs,
                    snmpSettings.Retries);

                var response = await Task.Run(() => Messenger.GetResponse(request, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                return response is GetResponseMessage;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SNMP test connection failed for device {DeviceId}", device.Id);
            return false;
        }
    }

    public async Task<List<NetworkInterface>> DiscoverInterfacesAsync(Device device, CancellationToken cancellationToken = default)
    {
        var snmpSettings = device.SnmpSettings;
        if (snmpSettings == null)
            return new List<NetworkInterface>();

        var interfaces = new List<NetworkInterface>();

        try
        {
            var ipAddress = IPAddress.Parse(device.IpAddress);
            var endpoint = new IPEndPoint(ipAddress, device.Port);

            if (snmpSettings.Version == SnmpVersion.V3)
            {
                await InitializeV3ParametersAsync(snmpSettings);
                if (_snmpV3Params == null)
                    return interfaces;

                var ifNumberRequest = new GetRequestMessage(
                    VersionCode.V3,
                    Messenger.NextRequestId,
                    Messenger.NextMessageId,
                    _snmpV3Params,
                    [new Variable(SnmpOids.IfNumber)],
                    new OctetString(snmpSettings.ContextName ?? ""),
                    new OctetString(snmpSettings.ContextEngineId ?? ""),
                    snmpSettings.TimeoutMs,
                    snmpSettings.Retries);

                var ifNumberResponse = await Task.Run(() => Messenger.GetResponse(ifNumberRequest, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                
                if (ifNumberResponse is not GetResponseMessage ifNumberGetResponse)
                    return interfaces;

                var ifCount = ifNumberGetResponse.Pdu().Variables[0].Data.ToInt32();

                for (int i = 1; i <= ifCount; i++)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    
                    var request = new GetRequestMessage(
                        VersionCode.V3,
                        Messenger.NextRequestId,
                        Messenger.NextMessageId,
                        _snmpV3Params,
                        new[]
                        {
                            new Variable(SnmpOids.IfDescr + "." + i),
                            new Variable(SnmpOids.IfName + "." + i),
                            new Variable(SnmpOids.IfType + "." + i),
                            new Variable(SnmpOids.IfSpeed + "." + i),
                            new Variable(SnmpOids.IfHighSpeed + "." + i),
                            new Variable(SnmpOids.IfOperStatus + "." + i),
                            new Variable(SnmpOids.IfHCInOctets + "." + i),
                            new Variable(SnmpOids.IfHCOutOctets + "." + i),
                            new Variable(SnmpOids.IfInOctets + "." + i),
                            new Variable(SnmpOids.IfOutOctets + "." + i),
                            new Variable(SnmpOids.IfAlias + "." + i)
                        },
                        new OctetString(snmpSettings.ContextName ?? ""),
                        new OctetString(snmpSettings.ContextEngineId ?? ""),
                        snmpSettings.TimeoutMs,
                        snmpSettings.Retries);

                    var response = await Task.Run(() => Messenger.GetResponse(request, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                    
                    if (response is GetResponseMessage getResponse)
                    {
                        var vars = getResponse.Pdu().Variables;
                        if (vars.Count >= 11)
                        {
                            var iface = new NetworkInterface
                            {
                                Index = i.ToString(),
                                Description = vars[0].Data.ToString(),
                                Name = vars[1].Data.ToString(),
                                Type = GetInterfaceTypeName(vars[2].Data.ToInt32()),
                                Speed = vars[4].Data.ToInt64() > 0 ? vars[4].Data.ToInt64() * 1_000_000 : vars[3].Data.ToInt64(),
                                IsUp = vars[5].Data.ToInt32() == 1,
                                HCInOctets = vars[6].Data.ToUInt64(),
                                HCOutOctets = vars[7].Data.ToUInt64(),
                                InOctets = vars[8].Data.ToUInt64(),
                                OutOctets = vars[9].Data.ToUInt64()
                            };
                            interfaces.Add(iface);
                        }
                    }
                }
            }
            else
            {
                var community = await _credentialStore.RetrieveAsync($"snmp_community_{device.Id}") 
                    ?? snmpSettings.Community;

                var ifNumberRequest = new GetRequestMessage(
                    snmpSettings.Version == SnmpVersion.V2c ? VersionCode.V2 : VersionCode.V1,
                    Messenger.NextRequestId,
                    new OctetString(community),
                    [new Variable(SnmpOids.IfNumber)],
                    snmpSettings.TimeoutMs,
                    snmpSettings.Retries);

                var ifNumberResponse = await Task.Run(() => Messenger.GetResponse(ifNumberRequest, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                
                if (ifNumberResponse is not GetResponseMessage ifNumberGetResponse)
                    return interfaces;

                var ifCount = ifNumberGetResponse.Pdu().Variables[0].Data.ToInt32();

                for (int i = 1; i <= ifCount; i++)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    
                    var request = new GetRequestMessage(
                        snmpSettings.Version == SnmpVersion.V2c ? VersionCode.V2 : VersionCode.V1,
                        Messenger.NextRequestId,
                        new OctetString(community),
                        new[]
                        {
                            new Variable(SnmpOids.IfDescr + "." + i),
                            new Variable(SnmpOids.IfName + "." + i),
                            new Variable(SnmpOids.IfType + "." + i),
                            new Variable(SnmpOids.IfSpeed + "." + i),
                            new Variable(SnmpOids.IfHighSpeed + "." + i),
                            new Variable(SnmpOids.IfOperStatus + "." + i),
                            new Variable(SnmpOids.IfHCInOctets + "." + i),
                            new Variable(SnmpOids.IfHCOutOctets + "." + i),
                            new Variable(SnmpOids.IfInOctets + "." + i),
                            new Variable(SnmpOids.IfOutOctets + "." + i),
                            new Variable(SnmpOids.IfAlias + "." + i)
                        },
                        snmpSettings.TimeoutMs,
                        snmpSettings.Retries);

                    var response = await Task.Run(() => Messenger.GetResponse(request, endpoint, snmpSettings.TimeoutMs), cancellationToken);
                    
                    if (response is GetResponseMessage getResponse)
                    {
                        var vars = getResponse.Pdu().Variables;
                        if (vars.Count >= 11)
                        {
                            var iface = new NetworkInterface
                            {
                                Index = i.ToString(),
                                Description = vars[0].Data.ToString(),
                                Name = vars[1].Data.ToString(),
                                Type = GetInterfaceTypeName(vars[2].Data.ToInt32()),
                                Speed = vars[4].Data.ToInt64() > 0 ? vars[4].Data.ToInt64() * 1_000_000 : vars[3].Data.ToInt64(),
                                IsUp = vars[5].Data.ToInt32() == 1,
                                HCInOctets = vars[6].Data.ToUInt64(),
                                HCOutOctets = vars[7].Data.ToUInt64(),
                                InOctets = vars[8].Data.ToUInt64(),
                                OutOctets = vars[9].Data.ToUInt64()
                            };
                            interfaces.Add(iface);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering interfaces for device {DeviceId}", device.Id);
        }

        return interfaces;
    }

    private async Task InitializeV3ParametersAsync(SnmpSettings settings)
    {
        if (_snmpV3Params != null)
            return;

        var authPass = await _credentialStore.RetrieveAsync($"snmp_v3_auth_{settings.DeviceId}") ?? settings.AuthPassword;
        var privPass = await _credentialStore.RetrieveAsync($"snmp_v3_priv_{settings.DeviceId}") ?? settings.PrivPassword;

        if (string.IsNullOrEmpty(settings.Username) || string.IsNullOrEmpty(authPass))
            return;

        var authProtocol = settings.AuthProtocol?.ToUpperInvariant() switch
        {
            "SHA" => AuthenticationType.SHA1,
            "SHA256" => AuthenticationType.SHA256,
            "SHA384" => AuthenticationType.SHA384,
            "SHA512" => AuthenticationType.SHA512,
            "MD5" => AuthenticationType.MD5,
            _ => AuthenticationType.Default
        };

        var privProtocol = settings.PrivProtocol?.ToUpperInvariant() switch
        {
            "AES" => PrivacyType.AES128,
            "AES192" => PrivacyType.AES192,
            "AES256" => PrivacyType.AES256,
            "DES" => PrivacyType.DES,
            _ => PrivacyType.Default
        };

        _snmpV3Params = new SnmpV3Parameter(
            new OctetString(settings.Username),
            authProtocol,
            new OctetString(authPass),
            privProtocol,
            new OctetString(privPass));
    }

    private static CollectorResult MapSnmpError(SnmpException ex)
    {
        return ex.ErrorCode switch
        {
            ErrorCode.AuthenticationFailure => CollectorResult.Failure(SampleStatus.AuthenticationFailed, "Authentication failed"),
            ErrorCode.Timeout => CollectorResult.Failure(SampleStatus.Timeout, "Request timeout"),
            _ => CollectorResult.Failure(SampleStatus.SnmpError, ex.Message)
        };
    }

    private static string GetInterfaceTypeName(int type) => type switch
    {
        1 => "Other",
        6 => "Ethernet",
        24 => "Software Loopback",
        53 => "PPP",
        69 => "Gigabit Ethernet",
        71 => "Fast Ethernet",
        117 => "IEEE 802.11 Wireless",
        131 => "Tunnel",
        135 => "L2 Virtual Interface",
        136 => "L3 Virtual Interface",
        143 => "Bridge",
        237 => "VLAN",
        _ => $"Unknown({type})"
    };

    public void Dispose()
    {
        _snmpV3Params = null;
    }
}