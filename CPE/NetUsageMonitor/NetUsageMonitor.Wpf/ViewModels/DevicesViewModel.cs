namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Core.ValueObjects;
using NetUsageMonitor.Snmp.Collectors;

public partial class DevicesViewModel : ViewModelBase
{
    private readonly IDatabaseService _databaseService;
    private readonly ICredentialStore _credentialStore;
    private readonly IServiceProvider _serviceProvider;

    [ObservableProperty]
    private ObservableCollection<DeviceViewModel> _devices = new();

    [ObservableProperty]
    private DeviceViewModel? _selectedDevice;

    [ObservableProperty]
    private bool _isEditing;

    [ObservableProperty]
    private bool _showAddDeviceDialog;

    public DevicesViewModel(
        IDatabaseService databaseService,
        ICredentialStore credentialStore,
        IServiceProvider serviceProvider)
    {
        _databaseService = databaseService;
        _credentialStore = credentialStore;
        _serviceProvider = serviceProvider;

        _ = LoadDevicesAsync();
    }

    private async Task LoadDevicesAsync()
    {
        IsBusy = true;
        try
        {
            var devices = await _databaseService.GetAllDevicesAsync();
            Devices.Clear();
            foreach (var device in devices)
            {
                Devices.Add(new DeviceViewModel(device, _credentialStore));
            }
        }
        catch (Exception ex)
        {
            SetError($"Failed to load devices: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private void AddDevice()
    {
        var newDevice = new Device
        {
            Name = "New Router",
            FriendName = "Friend A",
            DeviceType = DeviceType.Router,
            IpAddress = "192.168.1.1",
            Port = 161,
            MonitoringEnabled = true,
            CollectorType = CollectorType.Snmp,
            PollingIntervalSeconds = 60
        };
        
        var vm = new DeviceViewModel(newDevice, _credentialStore) { IsNew = true };
        Devices.Add(vm);
        SelectedDevice = vm;
        IsEditing = true;
        ShowAddDeviceDialog = true;
    }

    [RelayCommand]
    private void EditDevice(DeviceViewModel? device)
    {
        if (device != null)
        {
            SelectedDevice = device;
            IsEditing = true;
            ShowAddDeviceDialog = true;
        }
    }

    [RelayCommand]
    private async Task SaveDeviceAsync()
    {
        if (SelectedDevice == null) return;

        IsBusy = true;
        try
        {
            if (SelectedDevice.IsNew)
            {
                await _credentialStore.StoreAsync($"snmp_community_{Guid.NewGuid()}", SelectedDevice.Community);
                await _databaseService.AddDeviceAsync(SelectedDevice.ToDevice());
            }
            else
            {
                await _credentialStore.StoreAsync($"snmp_community_{SelectedDevice.Id}", SelectedDevice.Community);
                await _databaseService.UpdateDeviceAsync(SelectedDevice.ToDevice());
            }

            SelectedDevice.IsNew = false;
            IsEditing = false;
            ShowAddDeviceDialog = false;
            SetStatus("Device saved successfully");
            await LoadDevicesAsync();
        }
        catch (Exception ex)
        {
            SetError($"Failed to save device: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private void CancelEdit()
    {
        if (SelectedDevice?.IsNew == true)
        {
            Devices.Remove(SelectedDevice);
        }
        IsEditing = false;
        ShowAddDeviceDialog = false;
        SelectedDevice = null;
    }

    [RelayCommand]
    private async Task DeleteDeviceAsync(DeviceViewModel? device)
    {
        if (device == null) return;

        if (await ConfirmDeleteAsync($"Delete {device.Name}?"))
        {
            await _databaseService.DeleteDeviceAsync(device.Id);
            await _credentialStore.DeleteAsync($"snmp_community_{device.Id}");
            await _credentialStore.DeleteAsync($"snmp_v3_auth_{device.Id}");
            await _credentialStore.DeleteAsync($"snmp_v3_priv_{device.Id}");
            await LoadDevicesAsync();
        }
    }

    [RelayCommand]
    private async Task TestConnectionAsync(DeviceViewModel? device)
    {
        if (device == null) return;

        SetStatus("Testing connection...");
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var collector = GetCollector(device.CollectorType, scope.ServiceProvider);
            
            if (collector != null)
            {
                var result = await collector.TestConnectionAsync(device.ToDevice());
                if (result)
                {
                    SetStatus("Connection successful!");
                    device.LastTestResult = "Success";
                    device.LastTestTime = DateTime.Now;
                }
                else
                {
                    SetError("Connection failed");
                    device.LastTestResult = "Failed";
                    device.LastTestTime = DateTime.Now;
                }
            }
        }
        catch (Exception ex)
        {
            SetError($"Connection test failed: {ex.Message}");
            device.LastTestResult = "Error";
            device.LastTestTime = DateTime.Now;
        }
    }

    [RelayCommand]
    private async Task DiscoverInterfacesAsync(DeviceViewModel? device)
    {
        if (device == null) return;

        SetStatus("Discovering interfaces...");
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var collector = GetCollector(device.CollectorType, scope.ServiceProvider);
            
            if (collector != null)
            {
                var interfaces = await collector.DiscoverInterfacesAsync(device.ToDevice());
                device.AvailableInterfaces.Clear();
                foreach (var iface in interfaces)
                {
                    device.AvailableInterfaces.Add(new InterfaceViewModel(iface));
                }
                SetStatus($"Discovered {interfaces.Count} interfaces");
            }
        }
        catch (Exception ex)
        {
            SetError($"Interface discovery failed: {ex.Message}");
        }
    }

    private ITrafficCollector? GetCollector(CollectorType type, IServiceProvider provider)
    {
        return type switch
        {
            CollectorType.Snmp => provider.GetRequiredService<SnmpTrafficCollector>(),
            CollectorType.RouterApi => provider.GetRequiredService<RouterApiTrafficCollector>(),
            CollectorType.Manual => provider.GetRequiredService<ManualTrafficCollector>(),
            _ => null
        };
    }

    private Task<bool> ConfirmDeleteAsync(string message)
    {
        // In real app, show dialog
        return Task.FromResult(true);
    }
}

public partial class DeviceViewModel : ObservableObject
{
    private readonly ICredentialStore _credentialStore;

    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FriendName { get; set; } = string.Empty;
    public DeviceType DeviceType { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public int Port { get; set; } = 161;
    public bool MonitoringEnabled { get; set; } = true;
    public CollectorType CollectorType { get; set; } = CollectorType.Snmp;
    public string? InterfaceId { get; set; }
    public string? InterfaceName { get; set; }
    public string? InterfaceDescription { get; set; }
    public long? InterfaceSpeed { get; set; }
    public bool ReverseDirection { get; set; }
    public int PollingIntervalSeconds { get; set; } = 60;

    public string Community { get; set; } = "public";
    public SnmpVersion SnmpVersion { get; set; } = SnmpVersion.V2c;
    public string? SnmpUsername { get; set; }
    public string? SnmpAuthProtocol { get; set; }
    public string? SnmpAuthPassword { get; set; }
    public string? SnmpPrivProtocol { get; set; }
    public string? SnmpPrivPassword { get; set; }

    public string ApiType { get; set; } = string.Empty;
    public string ApiBaseUrl { get; set; } = string.Empty;
    public string? ApiUsername { get; set; }
    public string? ApiPassword { get; set; }
    public string? ApiKey { get; set; }

    public ObservableCollection<InterfaceViewModel> AvailableInterfaces { get; } = new();
    public string? LastTestResult { get; set; }
    public DateTime? LastTestTime { get; set; }
    public bool IsNew { get; set; }

    public DeviceViewModel(Device device, ICredentialStore credentialStore)
    {
        _credentialStore = credentialStore;
        Id = device.Id;
        Name = device.Name;
        FriendName = device.FriendName;
        DeviceType = device.DeviceType;
        IpAddress = device.IpAddress;
        Port = device.Port;
        MonitoringEnabled = device.MonitoringEnabled;
        CollectorType = device.CollectorType;
        InterfaceId = device.InterfaceId;
        InterfaceName = device.InterfaceName;
        InterfaceDescription = device.InterfaceDescription;
        InterfaceSpeed = device.InterfaceSpeed;
        ReverseDirection = device.ReverseDirection;
        PollingIntervalSeconds = device.PollingIntervalSeconds;

        if (device.SnmpSettings != null)
        {
            SnmpVersion = device.SnmpSettings.Version;
            Community = device.SnmpSettings.Community;
            SnmpUsername = device.SnmpSettings.Username;
            SnmpAuthProtocol = device.SnmpSettings.AuthProtocol;
            SnmpPrivProtocol = device.SnmpSettings.PrivProtocol;
        }

        if (device.RouterApiSettings != null)
        {
            ApiType = device.RouterApiSettings.ApiType;
            ApiBaseUrl = device.RouterApiSettings.BaseUrl;
            ApiUsername = device.RouterApiSettings.Username;
            ApiKey = device.RouterApiSettings.ApiKey;
        }
    }

    public Device ToDevice()
    {
        var device = new Device
        {
            Id = Id,
            Name = Name,
            FriendName = FriendName,
            DeviceType = DeviceType,
            IpAddress = IpAddress,
            Port = Port,
            MonitoringEnabled = MonitoringEnabled,
            CollectorType = CollectorType,
            InterfaceId = InterfaceId,
            InterfaceName = InterfaceName,
            InterfaceDescription = InterfaceDescription,
            InterfaceSpeed = InterfaceSpeed,
            ReverseDirection = ReverseDirection,
            PollingIntervalSeconds = PollingIntervalSeconds
        };

        if (CollectorType == CollectorType.Snmp)
        {
            device.SnmpSettings = new SnmpSettings
            {
                DeviceId = Id,
                Version = SnmpVersion,
                Community = Community,
                Username = SnmpUsername,
                AuthProtocol = SnmpAuthProtocol,
                AuthPassword = SnmpAuthPassword,
                PrivProtocol = SnmpPrivProtocol,
                PrivPassword = SnmpPrivPassword
            };
        }

        if (CollectorType == CollectorType.RouterApi)
        {
            device.RouterApiSettings = new RouterApiSettings
            {
                DeviceId = Id,
                ApiType = ApiType,
                BaseUrl = ApiBaseUrl,
                Username = ApiUsername,
                Password = ApiPassword,
                ApiKey = ApiKey
            };
        }

        return device;
    }
}

public partial class InterfaceViewModel : ObservableObject
{
    public string Index { get; }
    public string Name { get; }
    public string Description { get; }
    public string Type { get; }
    public long Speed { get; }
    public bool IsUp { get; }
    public ulong InOctets { get; }
    public ulong OutOctets { get; }
    public ulong HCInOctets { get; }
    public ulong HCOutOctets { get; }
    public string DisplayName => $"{Index}: {Name} - {Description} ({Type})";

    public InterfaceViewModel(NetUsageMonitor.Core.Models.NetworkInterface iface)
    {
        Index = iface.Index;
        Name = iface.Name;
        Description = iface.Description;
        Type = iface.Type;
        Speed = iface.Speed;
        IsUp = iface.IsUp;
        InOctets = iface.InOctets;
        OutOctets = iface.OutOctets;
        HCInOctets = iface.HCInOctets;
        HCOutOctets = iface.HCOutOctets;
    }
}