namespace NetUsageMonitor.Snmp.Collectors;

using System.Net.Http;
using System.Text.Json;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;

public class RouterApiTrafficCollector : ITrafficCollector, IDisposable
{
    public CollectorType Type => CollectorType.RouterApi;
    
    private readonly HttpClient _httpClient;
    private readonly ILogger<RouterApiTrafficCollector> _logger;
    private readonly ICredentialStore _credentialStore;
    private readonly JsonSerializerOptions _jsonOptions;

    public RouterApiTrafficCollector(HttpClient httpClient, ILogger<RouterApiTrafficCollector> logger, ICredentialStore credentialStore)
    {
        _httpClient = httpClient;
        _logger = logger;
        _credentialStore = credentialStore;
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    public async Task<CollectorResult> CollectAsync(Device device, CancellationToken cancellationToken = default)
    {
        var apiSettings = device.RouterApiSettings;
        if (apiSettings == null)
            return CollectorResult.Failure(SampleStatus.SnmpError, "Router API settings not configured");

        try
        {
            var request = await BuildRequestAsync(device, apiSettings, cancellationToken);
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var response = await _httpClient.SendAsync(request, cancellationToken);
            stopwatch.Stop();

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == HttpStatusCode.Unauthorized)
                    return CollectorResult.Failure(SampleStatus.AuthenticationFailed, "API authentication failed");
                return CollectorResult.Failure(SampleStatus.SnmpError, $"API returned {response.StatusCode}");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = ParseResponse(apiSettings.ApiType, content, device.InterfaceId);
            
            result.LatencyMs = stopwatch.Elapsed.TotalMilliseconds;
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error collecting from router API for device {DeviceId}", device.Id);
            return CollectorResult.Failure(SampleStatus.DeviceUnreachable, ex.Message);
        }
        catch (TaskCanceledException)
        {
            return CollectorResult.Failure(SampleStatus.Timeout, "Request timeout");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error collecting from router API for device {DeviceId}", device.Id);
            return CollectorResult.Failure(SampleStatus.UnknownError, ex.Message);
        }
    }

    public async Task<bool> TestConnectionAsync(Device device, CancellationToken cancellationToken = default)
    {
        var apiSettings = device.RouterApiSettings;
        if (apiSettings == null)
            return false;

        try
        {
            var request = await BuildRequestAsync(device, apiSettings, cancellationToken);
            var response = await _httpClient.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<List<NetworkInterface>> DiscoverInterfacesAsync(Device device, CancellationToken cancellationToken = default)
    {
        var apiSettings = device.RouterApiSettings;
        if (apiSettings == null)
            return new List<NetworkInterface>();

        var interfaces = new List<NetworkInterface>();

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, $"{apiSettings.BaseUrl.TrimEnd('/')}/interfaces");
            await AddAuthHeadersAsync(request, apiSettings);
            
            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                interfaces = ParseInterfaces(apiSettings.ApiType, content);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering interfaces via router API for device {DeviceId}", device.Id);
        }

        return interfaces;
    }

    private async Task<HttpRequestMessage> BuildRequestAsync(Device device, RouterApiSettings settings, CancellationToken cancellationToken)
    {
        var url = $"{settings.BaseUrl.TrimEnd('/')}/traffic/{device.InterfaceId}";
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        await AddAuthHeadersAsync(request, settings);
        return request;
    }

    private async Task AddAuthHeadersAsync(HttpRequestMessage request, RouterApiSettings settings)
    {
        request.Headers.Add("User-Agent", "NetUsageMonitor/1.0");
        
        if (!string.IsNullOrEmpty(settings.ApiKey))
        {
            var apiKey = await _credentialStore.RetrieveAsync($"router_api_key_{settings.DeviceId}") ?? settings.ApiKey;
            request.Headers.Add("X-API-Key", apiKey);
        }
        
        if (!string.IsNullOrEmpty(settings.Username) && !string.IsNullOrEmpty(settings.Password))
        {
            var password = await _credentialStore.RetrieveAsync($"router_api_password_{settings.DeviceId}") ?? settings.Password;
            var credentials = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{settings.Username}:{password}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);
        }

        foreach (var header in settings.CustomHeaders)
        {
            request.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }
    }

    private CollectorResult ParseResponse(string apiType, string content, string? interfaceId)
    {
        try
        {
            return apiType.ToLowerInvariant() switch
            {
                "ubiquiti" or "unifi" => ParseUbiquitiResponse(content, interfaceId),
                "mikrotik" => ParseMikroTikResponse(content, interfaceId),
                "openwrt" => ParseOpenWrtResponse(content, interfaceId),
                "generic" => ParseGenericResponse(content, interfaceId),
                _ => ParseGenericResponse(content, interfaceId)
            };
        }
        catch (Exception ex)
        {
            return CollectorResult.Failure(SampleStatus.SnmpError, $"Failed to parse API response: {ex.Message}");
        }
    }

    private CollectorResult ParseUbiquitiResponse(string content, string? interfaceId)
    {
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;
        
        if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in data.EnumerateArray())
            {
                if (item.TryGetProperty("name", out var name) && name.GetString() == interfaceId)
                {
                    var rx = item.GetProperty("rx_bytes").GetUInt64();
                    var tx = item.GetProperty("tx_bytes").GetUInt64();
                    var up = item.GetProperty("up").GetBoolean();
                    var speed = item.TryGetProperty("speed", out var s) ? s.GetInt64() : 0;
                    
                    return CollectorResult.SuccessResult(rx, tx, null, up, speed);
                }
            }
        }
        
        return CollectorResult.Failure(SampleStatus.SnmpError, "Interface not found in response");
    }

    private CollectorResult ParseMikroTikResponse(string content, string? interfaceId)
    {
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;
        
        if (root.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in root.EnumerateArray())
            {
                if (item.TryGetProperty("name", out var name) && name.GetString() == interfaceId)
                {
                    var rx = item.GetProperty("rx-byte").GetUInt64();
                    var tx = item.GetProperty("tx-byte").GetUInt64();
                    var up = item.GetProperty("running").GetBoolean();
                    var speed = item.TryGetProperty("max-rate", out var s) ? s.GetInt64() : 0;
                    
                    return CollectorResult.SuccessResult(rx, tx, null, up, speed);
                }
            }
        }
        
        return CollectorResult.Failure(SampleStatus.SnmpError, "Interface not found in response");
    }

    private CollectorResult ParseOpenWrtResponse(string content, string? interfaceId)
    {
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;
        
        if (root.TryGetProperty("interface", out var iface) && iface.GetString() == interfaceId)
        {
            var rx = root.GetProperty("rx_bytes").GetUInt64();
            var tx = root.GetProperty("tx_bytes").GetUInt64();
            var up = root.GetProperty("up").GetBoolean();
            var speed = root.TryGetProperty("speed", out var s) ? s.GetInt64() : 0;
            
            return CollectorResult.SuccessResult(rx, tx, null, up, speed);
        }
        
        return CollectorResult.Failure(SampleStatus.SnmpError, "Interface not found in response");
    }

    private CollectorResult ParseGenericResponse(string content, string? interfaceId)
    {
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;
        
        if (root.TryGetProperty("rx_bytes", out var rxProp) && root.TryGetProperty("tx_bytes", out var txProp))
        {
            var rx = rxProp.GetUInt64();
            var tx = txProp.GetUInt64();
            var up = root.TryGetProperty("up", out var upProp) ? upProp.GetBoolean() : true;
            var speed = root.TryGetProperty("speed", out var speedProp) ? speedProp.GetInt64() : 0;
            
            return CollectorResult.SuccessResult(rx, tx, null, up, speed);
        }
        
        return CollectorResult.Failure(SampleStatus.SnmpError, "Invalid response format");
    }

    private List<NetworkInterface> ParseInterfaces(string apiType, string content)
    {
        var interfaces = new List<NetworkInterface>();
        
        try
        {
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;
            
            if (apiType.ToLowerInvariant() == "ubiquiti" || apiType.ToLowerInvariant() == "unifi")
            {
                if (root.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in data.EnumerateArray())
                    {
                        if (item.TryGetProperty("name", out var name))
                        {
                            interfaces.Add(new NetworkInterface
                            {
                                Index = name.GetString() ?? "",
                                Name = name.GetString() ?? "",
                                Description = item.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
                                Type = item.TryGetProperty("type", out var type) ? type.GetString() ?? "" : "",
                                Speed = item.TryGetProperty("speed", out var speed) ? speed.GetInt64() : 0,
                                IsUp = item.TryGetProperty("up", out var up) && up.GetBoolean(),
                                HCInOctets = item.TryGetProperty("rx_bytes", out var rx) ? rx.GetUInt64() : 0,
                                HCOutOctets = item.TryGetProperty("tx_bytes", out var tx) ? tx.GetUInt64() : 0
                            });
                        }
                    }
                }
            }
            else if (root.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in root.EnumerateArray())
                {
                    if (item.TryGetProperty("name", out var name))
                    {
                        interfaces.Add(new NetworkInterface
                        {
                            Index = name.GetString() ?? "",
                            Name = name.GetString() ?? "",
                            Description = item.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "",
                            Type = item.TryGetProperty("type", out var type) ? type.GetString() ?? "" : "",
                            Speed = item.TryGetProperty("speed", out var speed) ? speed.GetInt64() : 0,
                            IsUp = item.TryGetProperty("running", out var running) ? running.GetBoolean() : 
                                   item.TryGetProperty("up", out var up) && up.GetBoolean(),
                            HCInOctets = item.TryGetProperty("rx_bytes", out var rx) ? rx.GetUInt64() : 
                                         item.TryGetProperty("rx-byte", out var rxb) ? rxb.GetUInt64() : 0,
                            HCOutOctets = item.TryGetProperty("tx_bytes", out var tx) ? tx.GetUInt64() : 
                                          item.TryGetProperty("tx-byte", out var txb) ? txb.GetUInt64() : 0
                        });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing interfaces response");
        }
        
        return interfaces;
    }

    public void Dispose()
    {
        _httpClient?.Dispose();
    }
}