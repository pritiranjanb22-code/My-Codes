namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.DependencyInjection;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;
using NetUsageMonitor.Services.Wizard;
using NetUsageMonitor.Services.Diagnostics;

public partial class MainViewModel : ViewModelBase
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IDatabaseService _databaseService;
    private readonly IPollingService _pollingService;
    private readonly IAlertService _alertService;
    private readonly ISetupWizard _setupWizard;
    private readonly IDiagnosticService _diagnosticService;

    [ObservableProperty]
    private ViewModelBase? _currentViewModel;

    [ObservableProperty]
    private string _windowTitle = "NetUsage Monitor";

    [ObservableProperty]
    private bool _isMonitoringActive;

    [ObservableProperty]
    private int _activeAlertCount;

    public MainViewModel(
        IServiceProvider serviceProvider,
        IDatabaseService databaseService,
        IPollingService pollingService,
        IAlertService alertService,
        ISetupWizard setupWizard,
        IDiagnosticService diagnosticService)
    {
        _serviceProvider = serviceProvider;
        _databaseService = databaseService;
        _pollingService = pollingService;
        _alertService = alertService;
        _setupWizard = setupWizard;
        _diagnosticService = diagnosticService;

        _pollingService.DeviceStatusChanged += OnDeviceStatusChanged;
        _pollingService.SampleCollected += OnSampleCollected;
        _alertService.AlertTriggered += OnAlertTriggered;

        NavigateToDashboard();
        
        _ = InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        try
        {
            await _databaseService.InitializeAsync();
            var settings = await _databaseService.GetSettingsAsync();
            
            if (settings.AutoStartMonitoring)
            {
                await _pollingService.StartAsync();
                IsMonitoringActive = true;
            }

            await UpdateAlertCountAsync();
        }
        catch (Exception ex)
        {
            SetError($"Initialization failed: {ex.Message}");
        }
    }

    [RelayCommand]
    private void NavigateToDashboard()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<DashboardViewModel>();
        WindowTitle = "NetUsage Monitor - Dashboard";
    }

    [RelayCommand]
    private void NavigateToLiveMonitoring()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<LiveMonitoringViewModel>();
        WindowTitle = "NetUsage Monitor - Live Monitoring";
    }

    [RelayCommand]
    private void NavigateToFriends()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<FriendsViewModel>();
        WindowTitle = "NetUsage Monitor - Friends";
    }

    [RelayCommand]
    private void NavigateToDevices()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<DevicesViewModel>();
        WindowTitle = "NetUsage Monitor - Devices";
    }

    [RelayCommand]
    private void NavigateToReports()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<ReportsViewModel>();
        WindowTitle = "NetUsage Monitor - Usage Reports";
    }

    [RelayCommand]
    private void NavigateToAlerts()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<AlertsViewModel>();
        WindowTitle = "NetUsage Monitor - Alerts";
    }

    [RelayCommand]
    private void NavigateToSettings()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<SettingsViewModel>();
        WindowTitle = "NetUsage Monitor - Settings";
    }

    [RelayCommand]
    private void NavigateToDiagnostics()
    {
        CurrentViewModel = _serviceProvider.GetRequiredService<DiagnosticsViewModel>();
        WindowTitle = "NetUsage Monitor - Diagnostics";
    }

    [RelayCommand]
    private async Task RunSetupWizardAsync()
    {
        SetStatus("Running setup wizard...");
        var result = await _setupWizard.RunAsync();
        
        if (result.Success)
        {
            SetStatus("Setup completed successfully!");
            await _pollingService.StartAsync();
            IsMonitoringActive = true;
            NavigateToDashboard();
        }
        else
        {
            SetError($"Setup failed: {result.ErrorMessage}");
        }
    }

    [RelayCommand]
    private async Task ToggleMonitoringAsync()
    {
        if (IsMonitoringActive)
        {
            await _pollingService.StopAsync();
            IsMonitoringActive = false;
            SetStatus("Monitoring stopped");
        }
        else
        {
            await _pollingService.StartAsync();
            IsMonitoringActive = true;
            SetStatus("Monitoring started");
        }
    }

    private void OnDeviceStatusChanged(object? sender, DeviceStatus status)
    {
        // Update UI via DashboardViewModel
    }

    private void OnSampleCollected(object? sender, TrafficSample sample)
    {
        // Update UI via DashboardViewModel
    }

    private async void OnAlertTriggered(object? sender, Alert alert)
    {
        await UpdateAlertCountAsync();
    }

    private async Task UpdateAlertCountAsync()
    {
        var alerts = await _alertService.GetActiveAlertsAsync();
        ActiveAlertCount = alerts.Count;
    }

    public override void Dispose()
    {
        _pollingService.DeviceStatusChanged -= OnDeviceStatusChanged;
        _pollingService.SampleCollected -= OnSampleCollected;
        _alertService.AlertTriggered -= OnAlertTriggered;
        base.Dispose();
    }
}