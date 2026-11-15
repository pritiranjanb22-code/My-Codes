namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Services.Diagnostics;

public partial class DiagnosticsViewModel : ViewModelBase
{
    private readonly IDiagnosticService _diagnosticService;
    private readonly IDatabaseService _databaseService;

    [ObservableProperty]
    private ObservableCollection<Device> _devices = new();

    [ObservableProperty]
    private Device? _selectedDevice;

    [ObservableProperty]
    private DiagnosticResult? _diagnosticResult;

    [ObservableProperty]
    private bool _isRunningDiagnostics;

    public DiagnosticsViewModel(IDiagnosticService diagnosticService, IDatabaseService databaseService)
    {
        _diagnosticService = diagnosticService;
        _databaseService = databaseService;
        _ = LoadDevicesAsync();
    }

    private async Task LoadDevicesAsync()
    {
        var devices = await _databaseService.GetAllDevicesAsync();
        Devices.Clear();
        foreach (var device in devices.Where(d => d.MonitoringEnabled))
        {
            Devices.Add(device);
        }
    }

    [RelayCommand]
    private async Task RunDiagnosticsAsync()
    {
        if (SelectedDevice == null) return;

        IsRunningDiagnostics = true;
        SetStatus($"Running diagnostics for {SelectedDevice.GetDisplayName()}...");
        
        try
        {
            DiagnosticResult = await _diagnosticService.RunDiagnosticsAsync(SelectedDevice.Id);
            SetStatus("Diagnostics completed");
        }
        catch (Exception ex)
        {
            SetError($"Diagnostics failed: {ex.Message}");
        }
        finally
        {
            IsRunningDiagnostics = false;
        }
    }

    [RelayCommand]
    private async Task RunFullDiagnosticsAsync()
    {
        IsRunningDiagnostics = true;
        SetStatus("Running full diagnostics...");
        
        try
        {
            DiagnosticResult = await _diagnosticService.RunFullDiagnosticsAsync();
            SetStatus("Full diagnostics completed");
        }
        catch (Exception ex)
        {
            SetError($"Full diagnostics failed: {ex.Message}");
        }
        finally
        {
            IsRunningDiagnostics = false;
        }
    }
}