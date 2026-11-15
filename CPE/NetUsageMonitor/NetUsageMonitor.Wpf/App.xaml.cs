namespace NetUsageMonitor.Wpf;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NetUsageMonitor.Core.Interfaces;
using NetUsageMonitor.Data;
using NetUsageMonitor.Data.Repositories;
using NetUsageMonitor.Snmp.Collectors;
using NetUsageMonitor.Services.Security;
using NetUsageMonitor.Services.Monitoring;
using NetUsageMonitor.Services.Reporting;
using NetUsageMonitor.Services.Wizard;
using NetUsageMonitor.Services.Diagnostics;
using NetUsageMonitor.Wpf.ViewModels;
using System.Windows;

public partial class App : Application
{
    private IHost? _host;

    protected override async void OnStartup(StartupEventArgs e)
    {
        _host = CreateHostBuilder().Build();
        await _host.StartAsync();

        // Ensure database is initialized
        using var scope = _host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDatabaseService>();
        await db.InitializeAsync();

        // Check if user exists, if not create default admin
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        var adminUser = await authService.GetUserAsync("admin");
        if (adminUser == null)
        {
            await authService.CreateUserAsync("admin", "admin123", "Admin");
        }

        var loginWindow = _host.Services.GetRequiredService<LoginWindow>();
        var result = loginWindow.ShowDialog();
        
        if (result == true)
        {
            var mainWindow = _host.Services.GetRequiredService<MainWindow>();
            mainWindow.Show();
        }
        else
        {
            Shutdown();
        }

        base.OnStartup(e);
    }

    protected override async void OnExit(ExitEventArgs e)
    {
        if (_host != null)
        {
            await _host.StopAsync();
            _host.Dispose();
        }
        base.OnExit(e);
    }

    private static IHostBuilder CreateHostBuilder()
    {
        return Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                services.AddDbContext<NetUsageDbContext>();
                services.AddScoped<IDatabaseService, DatabaseService>();

                services.AddSingleton<ICredentialStore, DpapiCredentialStore>();
                services.AddSingleton<SnmpTrafficCollector>();
                services.AddSingleton<RouterApiTrafficCollector>();
                services.AddSingleton<ManualTrafficCollector>();
                services.AddSingleton<IPollingService, PollingService>();
                services.AddSingleton<IAlertService, AlertService>();
                services.AddSingleton<IReportService, ReportService>();
                services.AddSingleton<ISetupWizard, SetupWizard>();
                services.AddSingleton<IDiagnosticService, DiagnosticService>();
                services.AddSingleton<ICounterProcessor, CounterProcessor>();
                services.AddSingleton<IUsageCalculator, UsageCalculator>();
                services.AddSingleton<IAuditService, AuditService>();
                services.AddSingleton<IAuthService, AuthService>();

                services.AddTransient<MainViewModel>();
                services.AddTransient<DashboardViewModel>();
                services.AddTransient<LiveMonitoringViewModel>();
                services.AddTransient<FriendsViewModel>();
                services.AddTransient<DevicesViewModel>();
                services.AddTransient<ReportsViewModel>();
                services.AddTransient<AlertsViewModel>();
                services.AddTransient<SettingsViewModel>();
                services.AddTransient<DiagnosticsViewModel>();
                services.AddTransient<LoginViewModel>();

                services.AddTransient<MainWindow>();
                services.AddTransient<LoginWindow>();
            })
            .ConfigureLogging(logging =>
            {
                logging.AddConsole();
                logging.AddDebug();
                logging.SetMinimumLevel(LogLevel.Information);
            });
    }
}