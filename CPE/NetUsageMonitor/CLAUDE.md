# NetUsageMonitor — Project CLAUDE.md

> .NET 8 WPF application for network usage monitoring with SNMP, Clean Architecture

## Project Overview

**Stack:** .NET 8, WPF (MVVM), Entity Framework Core, SQLite, SNMP (SharpSnmpLib), MaterialDesignInXamlToolkit

**Architecture:** Clean Architecture with vertical slice features
- `Core` - Domain models, interfaces, value objects
- `Data` - EF Core, repositories, migrations
- `Services` - Business logic (Monitoring, Diagnostics, Reporting, Security, Wizard)
- `Snmp` - SNMP collectors and models
- `Wpf` - MVVM UI (ViewModels, Views, Converters)
- `Tests` - Unit tests (xUnit)
- `IntegrationTests` - End-to-end scenarios

## Critical Rules

### .NET/C# Specific

- Target .NET 8, nullable reference types enabled
- Use `record` for immutable data, `class` for entities
- EF Core: Fluent API configuration in `Configurations/`
- WPF: MVVM with `CommunityToolkit.Mvvm` (ObservableObject, RelayCommand)
- Dependency Injection via `Microsoft.Extensions.DependencyInjection`
- Serilog for structured logging

### Code Organization

- Vertical slices by feature over layered folders
- Max 400 lines per file, 800 absolute max
- One class per file, filename matches class name
- Interfaces in `Core/Interfaces/`, implementations in feature projects

### Code Style

- No emojis in code, comments, or documentation
- Immutability: `init` setters, `readonly` fields, `record` types
- No `Console.WriteLine` in production - use `ILogger<T>`
- Proper error handling: `Result<T>` pattern or exceptions for exceptional cases
- Input validation with FluentValidation or DataAnnotations
- `async`/`await` throughout, avoid `.Result`/`.Wait()`

### Testing

- TDD: Write tests first (`/tdd` command)
- Unit tests: xUnit, Moq, FluentAssertions
- Integration tests: Testcontainers for DB, WireMock for HTTP
- 80% minimum coverage for business logic
- Test naming: `MethodName_Scenario_ExpectedResult`

### Security

- No hardcoded secrets, connection strings, API keys
- Use `appsettings.json` + `appsettings.Development.json` + User Secrets
- `CredentialStore` uses DPAPI (Windows) for encryption
- Validate all SNMP/Network input before processing
- Rate limiting on polling services

## File Structure

```
NetUsageMonitor.sln
Directory.Build.props          # Common MSBuild props
Directory.Packages.props       # Central package versions

NetUsageMonitor.Core/          # Domain layer
|-- Enums/
|-- Extensions/
|-- Interfaces/                # Repository, Service contracts
|-- Models/                    # Domain entities
|-- ValueObjects/              # Strongly-typed IDs, NetworkAddress, etc.

NetUsageMonitor.Data/          # Data access
|-- Configurations/            # EF Core Fluent API
|-- Migrations/                # EF Core migrations
|-- Repositories/              # Repository implementations
|-- NetUsageDbContext.cs

NetUsageMonitor.Services/      # Business logic
|-- Diagnostics/               # DiagnosticService
|-- Monitoring/                # AlertService, CounterProcessor, PollingService
|-- Reporting/                 # ReportService
|-- Security/                  # AuthService, CredentialStore
|-- Wizard/                    # SetupWizard

NetUsageMonitor.Snmp/          # SNMP integration
|-- Collectors/                # SnmpTrafficCollector, RouterApiTrafficCollector
|-- Models/                    # SnmpModels

NetUsageMonitor.Wpf/           # UI layer
|-- Assets/                    # Icons, images
|-- Behaviors/                 # Attached behaviors
|-- Converters/                # Value converters
|-- Resources/                 # Colors.xaml, Styles.xaml
|-- ViewModels/                # MVVM ViewModels (ObservableObject)
|-- Views/                     # XAML Views
|-- App.xaml, MainWindow.xaml

NetUsageMonitor.Tests/         # Unit tests
|-- Core/
|-- Data/
|-- Monitoring/

NetUsageMonitor.IntegrationTests/
|-- Mocks/
|-- Scenarios/                 # EndToEndTests
```

## Key Patterns

### Repository Interface

```csharp
public interface IDeviceRepository
{
    Task<Result<Device>> GetByIdAsync(DeviceId id, CancellationToken ct);
    Task<Result<IReadOnlyList<Device>>> GetAllAsync(CancellationToken ct);
    Task<Result<Unit>> AddAsync(Device device, CancellationToken ct);
}
```

### Service with Result Pattern

```csharp
public sealed class PollingService : IPollingService
{
    private readonly IDeviceRepository _devices;
    private readonly ISnmpCollector _snmp;
    private readonly ILogger<PollingService> _logger;

    public async Task<Result<Unit>> PollAsync(CancellationToken ct)
    {
        var devicesResult = await _devices.GetAllAsync(ct);
        if (devicesResult.IsFailure) return devicesResult.Error;

        foreach (var device in devicesResult.Value)
        {
            var collectResult = await _snmp.CollectAsync(device, ct);
            // Handle result
        }
        return Unit.Value;
    }
}
```

### WPF ViewModel (CommunityToolkit.Mvvm)

```csharp
public partial class DashboardViewModel : ObservableObject
{
    private readonly IPollingService _polling;
    private readonly IReportService _reports;

    [ObservableProperty]
    private bool _isPolling;

    [RelayCommand]
    private async Task StartPollingAsync()
    {
        IsPolling = true;
        await _polling.StartAsync(CancellationToken.None);
    }
}
```

## Environment Variables / Configuration

```json
// appsettings.json (committed)
{
  "ConnectionStrings": {
    "Default": "Data Source=netusage.db"
  },
  "Polling": {
    "IntervalSeconds": 60,
    "TimeoutSeconds": 10
  },
  "Snmp": {
    "Version": "V2",
    "Community": "public"
  }
}

// appsettings.Development.json (gitignored)
// User Secrets for production:
// dotnet user-secrets set "ConnectionStrings:Default" "Server=..."
```

## Available Commands

- `/tdd` - Test-driven development workflow
- `/plan` - Create implementation plan
- `/code-review` - Review code quality
- `/build-fix` - Fix build errors (dotnet build)
- `/verify` - Full verification (build, test, lint)

## .NET Commands

```bash
dotnet build                    # Build solution
dotnet test                     # Run all tests
dotnet test --collect:"XPlat Code Coverage"  # With coverage
dotnet format                   # Format code (requires dotnet-format)
dotnet ef migrations add Name   # Add migration
dotnet ef database update       # Apply migrations
dotnet run --project NetUsageMonitor.Wpf  # Run WPF app
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Feature branches from `main`, PRs required
- CI runs: build, test, format check, coverage
- Version in `Directory.Build.props` (`<Version>1.0.0</Version>`)