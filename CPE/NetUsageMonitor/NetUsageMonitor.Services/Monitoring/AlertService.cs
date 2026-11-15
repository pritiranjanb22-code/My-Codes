namespace NetUsageMonitor.Services.Monitoring;

using Microsoft.Extensions.Hosting;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Core.Models;
using NetUsageMonitor.Core.Enums;

public class AlertService : IAlertService, IDisposable
{
    private readonly IDatabaseService _databaseService;
    private readonly ILogger<AlertService> _logger;
    private readonly List<Alert> _activeAlerts = new();
    private readonly object _alertsLock = new();
    
    public event EventHandler<Alert>? AlertTriggered;

    public AlertService(IDatabaseService databaseService, ILogger<AlertService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    public async Task CheckAlertsAsync(Device device, TrafficSample sample)
    {
        var rules = await _databaseService.GetAlertRulesAsync(device.Id);
        var enabledRules = rules.Where(r => r.Enabled).ToList();

        foreach (var rule in enabledRules)
        {
            var shouldTrigger = false;
            string message = string.Empty;

            switch (rule.Type)
            {
                case AlertType.MonthlyUsageLimit:
                    var currentMonth = await _databaseService.GetMonthlyUsageAsync(device.Id, DateTime.UtcNow.Year, DateTime.UtcNow.Month);
                    if (currentMonth != null && currentMonth.TotalBytes >= rule.ThresholdBytes)
                    {
                        shouldTrigger = true;
                        message = $"Monthly usage limit exceeded. Current: {DataSize.FromBytes(currentMonth.TotalBytes).ToAutoString()}, Limit: {DataSize.FromBytes(rule.ThresholdBytes).ToAutoString()}";
                    }
                    break;

                case AlertType.DailyUsageLimit:
                    var today = await _databaseService.GetDailyUsageAsync(device.Id, DateOnly.FromDateTime(DateTime.UtcNow));
                    if (today != null && today.TotalBytes >= rule.ThresholdBytes)
                    {
                        shouldTrigger = true;
                        message = $"Daily usage limit exceeded. Current: {DataSize.FromBytes(today.TotalBytes).ToAutoString()}, Limit: {DataSize.FromBytes(rule.ThresholdBytes).ToAutoString()}";
                    }
                    break;

                case AlertType.DeviceOffline:
                    if (!sample.Status.HasFlag(SampleStatus.Success))
                    {
                        shouldTrigger = true;
                        message = $"Device is offline or unreachable. Last error: {sample.ErrorMessage}";
                    }
                    break;

                case AlertType.PollingFailure:
                    if (device.ConsecutiveFailures >= 3)
                    {
                        shouldTrigger = true;
                        message = $"Device has failed {device.ConsecutiveFailures} consecutive polls. Last error: {device.LastError}";
                    }
                    break;

                case AlertType.HighBandwidth:
                    var intervalSeconds = device.PollingIntervalSeconds > 0 ? device.PollingIntervalSeconds : 60;
                    var currentMbps = (sample.DownloadBytes + sample.UploadBytes) * 8.0 / (intervalSeconds * 1_000_000);
                    var thresholdMbps = rule.ThresholdBytes / 1_000_000.0;
                    
                    if (currentMbps >= thresholdMbps)
                    {
                        shouldTrigger = true;
                        message = $"High bandwidth detected: {currentMbps:F2} Mbps (threshold: {thresholdMbps:F2} Mbps)";
                    }
                    break;
            }

            if (shouldTrigger)
            {
                await TriggerAlertAsync(device, rule, message);
            }
        }
    }

    private async Task TriggerAlertAsync(Device device, AlertRule rule, string message)
    {
        var alert = new Alert
        {
            DeviceId = device.Id,
            Type = rule.Type,
            Severity = rule.Severity,
            Title = GetAlertTitle(rule.Type),
            Message = $"{device.GetDisplayName()}: {message}",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        lock (_alertsLock)
        {
            _activeAlerts.Add(alert);
        }

        rule.LastTriggered = DateTime.UtcNow;
        rule.TriggerCount++;
        await _databaseService.UpdateAlertRuleAsync(rule);

        var savedAlert = await _databaseService.AddAlertAsync(alert);
        alert.Id = savedAlert.Id;

        _logger.LogWarning("Alert triggered: {Title} - {Message}", alert.Title, alert.Message);
        
        AlertTriggered?.Invoke(this, alert);
        
        if (rule.NotifyWindows)
        {
            ShowWindowsNotification(alert);
        }
    }

    private static string GetAlertTitle(AlertType type) => type switch
    {
        AlertType.MonthlyUsageLimit => "Monthly Usage Limit Exceeded",
        AlertType.DailyUsageLimit => "Daily Usage Limit Exceeded",
        AlertType.DeviceOffline => "Device Offline",
        AlertType.PollingFailure => "Polling Failure",
        AlertType.HighBandwidth => "High Bandwidth Usage",
        _ => "Alert"
    };

    public async Task<List<Alert>> GetActiveAlertsAsync()
    {
        lock (_alertsLock)
        {
            return _activeAlerts.Where(a => a.IsActive).OrderByDescending(a => a.CreatedAt).ToList();
        }
    }

    public async Task AcknowledgeAlertAsync(long alertId, string user)
    {
        lock (_alertsLock)
        {
            var alert = _activeAlerts.FirstOrDefault(a => a.Id == alertId);
            if (alert != null)
            {
                alert.IsActive = false;
                alert.AcknowledgedAt = DateTime.UtcNow;
                alert.AcknowledgedBy = user;
            }
        }

        await _databaseService.AcknowledgeAlertAsync(alertId, user);
    }

    private void ShowWindowsNotification(Alert alert)
    {
        try
        {
            // Windows toast notification would be implemented here
            // For now, we just log it
            _logger.LogInformation("Windows notification: {Title} - {Message}", alert.Title, alert.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to show Windows notification");
        }
    }

    public void Dispose() { }
}