namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;

public partial class SettingsViewModel : ViewModelBase
{
    private readonly IDatabaseService _databaseService;

    [ObservableProperty]
    private int _defaultPollingInterval = 60;

    [ObservableProperty]
    private DataUnit _defaultUnits = DataUnit.Gigabytes;

    [ObservableProperty]
    private bool _useBinaryUnits;

    [ObservableProperty]
    private int _retentionDays = 365;

    [ObservableProperty]
    private ThemeMode _theme = ThemeMode.System;

    [ObservableProperty]
    private bool _notificationsEnabled = true;

    [ObservableProperty]
    private bool _startMinimized;

    [ObservableProperty]
    private bool _minimizeToTray = true;

    [ObservableProperty]
    private bool _autoStartMonitoring = true;

    [ObservableProperty]
    private string? _language;

    public ObservableCollection<DataUnit> AvailableUnits { get; } = new(
        Enum.GetValues<DataUnit>().Where(u => u <= DataUnit.Terabytes || u >= DataUnit.Kibibytes));

    public ObservableCollection<ThemeMode> AvailableThemes { get; } = new(Enum.GetValues<ThemeMode>());

    public SettingsViewModel(IDatabaseService databaseService)
    {
        _databaseService = databaseService;
        _ = LoadSettingsAsync();
    }

    private async Task LoadSettingsAsync()
    {
        var settings = await _databaseService.GetSettingsAsync();
        DefaultPollingInterval = settings.DefaultPollingIntervalSeconds;
        DefaultUnits = settings.DefaultUnits;
        UseBinaryUnits = settings.UseBinaryUnits;
        RetentionDays = settings.RetentionDays;
        Theme = settings.Theme;
        NotificationsEnabled = settings.NotificationsEnabled;
        StartMinimized = settings.StartMinimized;
        MinimizeToTray = settings.MinimizeToTray;
        AutoStartMonitoring = settings.AutoStartMonitoring;
        Language = settings.Language;
    }

    [RelayCommand]
    private async Task SaveAsync()
    {
        IsBusy = true;
        try
        {
            var settings = new ApplicationSettings
            {
                Id = 1,
                DefaultPollingIntervalSeconds = DefaultPollingInterval,
                DefaultUnits = DefaultUnits,
                UseBinaryUnits = UseBinaryUnits,
                RetentionDays = RetentionDays,
                Theme = Theme,
                NotificationsEnabled = NotificationsEnabled,
                StartMinimized = StartMinimized,
                MinimizeToTray = MinimizeToTray,
                AutoStartMonitoring = AutoStartMonitoring,
                Language = Language,
                UpdatedAt = DateTime.UtcNow
            };

            await _databaseService.UpdateSettingsAsync(settings);
            SetStatus("Settings saved successfully");
        }
        catch (Exception ex)
        {
            SetError($"Failed to save settings: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private async Task RunCleanupAsync()
    {
        IsBusy = true;
        try
        {
            await _databaseService.CleanupOldDataAsync(RetentionDays);
            SetStatus($"Cleaned up data older than {RetentionDays} days");
        }
        catch (Exception ex)
        {
            SetError($"Cleanup failed: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }
}