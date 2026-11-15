namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;

public partial class AlertsViewModel : ViewModelBase
{
    private readonly IAlertService _alertService;
    private readonly IDatabaseService _databaseService;

    [ObservableProperty]
    private ObservableCollection<AlertViewModel> _alerts = new();

    [ObservableProperty]
    private ObservableCollection<AlertRuleViewModel> _alertRules = new();

    [ObservableProperty]
    private AlertRuleViewModel? _selectedRule;

    [ObservableProperty]
    private bool _isEditingRule;

    public AlertsViewModel(IAlertService alertService, IDatabaseService databaseService)
    {
        _alertService = alertService;
        _databaseService = databaseService;

        _alertService.AlertTriggered += OnAlertTriggered;
        _ = LoadDataAsync();
    }

    private async Task LoadDataAsync()
    {
        IsBusy = true;
        try
        {
            var alerts = await _alertService.GetActiveAlertsAsync();
            Alerts.Clear();
            foreach (var alert in alerts)
            {
                Alerts.Add(new AlertViewModel(alert));
            }

            var devices = await _databaseService.GetAllDevicesAsync();
            AlertRules.Clear();
            foreach (var device in devices)
            {
                var rules = await _databaseService.GetAlertRulesAsync(device.Id);
                foreach (var rule in rules)
                {
                    AlertRules.Add(new AlertRuleViewModel(rule, device.Name, device.FriendName));
                }
            }
        }
        catch (Exception ex)
        {
            SetError($"Failed to load alerts: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void OnAlertTriggered(object? sender, Alert alert)
    {
        Application.Current?.Dispatcher.Invoke(() =>
        {
            Alerts.Insert(0, new AlertViewModel(alert));
        });
    }

    [RelayCommand]
    private async Task AcknowledgeAsync(AlertViewModel? alert)
    {
        if (alert == null) return;

        try
        {
            await _alertService.AcknowledgeAlertAsync(alert.Id, Environment.UserName);
            alert.IsAcknowledged = true;
            alert.AcknowledgedAt = DateTime.Now;
            alert.AcknowledgedBy = Environment.UserName;
            Alerts.Remove(alert);
            SetStatus("Alert acknowledged");
        }
        catch (Exception ex)
        {
            SetError($"Failed to acknowledge alert: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task AddRuleAsync()
    {
        var devices = await _databaseService.GetAllDevicesAsync();
        if (!devices.Any())
        {
            SetError("No devices configured");
            return;
        }

        var newRule = new AlertRule
        {
            DeviceId = devices.First().Id,
            Type = AlertType.MonthlyUsageLimit,
            Severity = AlertSeverity.Warning,
            ThresholdBytes = 100L * 1024 * 1024 * 1024, // 100 GB
            Enabled = true
        };

        var savedRule = await _databaseService.AddAlertRuleAsync(newRule);
        AlertRules.Add(new AlertRuleViewModel(savedRule, devices.First().Name, devices.First().FriendName));
        SelectedRule = AlertRules.Last();
        IsEditingRule = true;
    }

    [RelayCommand]
    private void EditRule(AlertRuleViewModel? rule)
    {
        if (rule != null)
        {
            SelectedRule = rule;
            IsEditingRule = true;
        }
    }

    [RelayCommand]
    private async Task SaveRuleAsync()
    {
        if (SelectedRule == null) return;

        IsBusy = true;
        try
        {
            var rule = SelectedRule.ToAlertRule();
            if (rule.Id == 0)
            {
                await _databaseService.AddAlertRuleAsync(rule);
            }
            else
            {
                await _databaseService.UpdateAlertRuleAsync(rule);
            }
            IsEditingRule = false;
            SetStatus("Alert rule saved");
            await LoadDataAsync();
        }
        catch (Exception ex)
        {
            SetError($"Failed to save alert rule: {ex.Message}");
        }
        finally
        {
            IsBusy = false;
        }
    }

    [RelayCommand]
    private void CancelRuleEdit()
    {
        IsEditingRule = false;
        SelectedRule = null;
    }

    [RelayCommand]
    private async Task DeleteRuleAsync(AlertRuleViewModel? rule)
    {
        if (rule == null) return;

        await _databaseService.DeleteAlertRuleAsync(rule.Id);
        AlertRules.Remove(rule);
        SetStatus("Alert rule deleted");
    }
}

public partial class AlertViewModel : ObservableObject
{
    public long Id { get; }
    public int? DeviceId { get; }
    public AlertType Type { get; }
    public AlertSeverity Severity { get; }
    public string Title { get; }
    public string Message { get; }
    public DateTime CreatedAt { get; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AcknowledgedBy { get; set; }
    public bool IsActive { get; set; }
    public bool IsAcknowledged => !IsActive;

    public string SeverityColor => Severity switch
    {
        AlertSeverity.Info => "#2196F3",
        AlertSeverity.Warning => "#FF9800",
        AlertSeverity.Critical => "#F44336",
        _ => "#757575"
    };

    public AlertViewModel(Alert alert)
    {
        Id = alert.Id;
        DeviceId = alert.DeviceId;
        Type = alert.Type;
        Severity = alert.Severity;
        Title = alert.Title;
        Message = alert.Message;
        CreatedAt = alert.CreatedAt;
        AcknowledgedAt = alert.AcknowledgedAt;
        AcknowledgedBy = alert.AcknowledgedBy;
        IsActive = alert.IsActive;
    }
}

public partial class AlertRuleViewModel : ObservableObject
{
    private readonly string _deviceName;
    private readonly string _friendName;

    public int Id { get; set; }
    public int DeviceId { get; set; }
    public string DeviceDisplayName => $"{_deviceName} ({_friendName})";
    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; }
    public long ThresholdBytes { get; set; }
    public bool Enabled { get; set; }
    public bool NotifyWindows { get; set; } = true;
    public bool NotifyInApp { get; set; } = true;
    public DateTime? LastTriggered { get; set; }
    public int TriggerCount { get; set; }

    public string ThresholdDisplay => DataSize.FromBytes(ThresholdBytes).ToAutoString();
    public ObservableCollection<AlertType> AvailableTypes { get; } = new(Enum.GetValues<AlertType>());
    public ObservableCollection<AlertSeverity> AvailableSeverities { get; } = new(Enum.GetValues<AlertSeverity>());

    public AlertRuleViewModel(AlertRule rule, string deviceName, string friendName)
    {
        _deviceName = deviceName;
        _friendName = friendName;
        Id = rule.Id;
        DeviceId = rule.DeviceId;
        Type = rule.Type;
        Severity = rule.Severity;
        ThresholdBytes = rule.ThresholdBytes;
        Enabled = rule.Enabled;
        NotifyWindows = rule.NotifyWindows;
        NotifyInApp = rule.NotifyInApp;
        LastTriggered = rule.LastTriggered;
        TriggerCount = rule.TriggerCount;
    }

    public AlertRule ToAlertRule()
    {
        return new AlertRule
        {
            Id = Id,
            DeviceId = DeviceId,
            Type = Type,
            Severity = Severity,
            ThresholdBytes = ThresholdBytes,
            Enabled = Enabled,
            NotifyWindows = NotifyWindows,
            NotifyInApp = NotifyInApp,
            LastTriggered = LastTriggered,
            TriggerCount = TriggerCount
        };
    }
}