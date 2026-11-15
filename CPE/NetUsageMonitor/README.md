# NetUsage Monitor

A production-quality Windows desktop application for monitoring internet usage of multiple friends/routers through SNMP and router APIs. Designed for small ISPs providing connectivity via wireless CPE links.

## Features

### Core Monitoring
- **Dual Friend Monitoring** - Separate tracking for Friend A and Friend B
- **SNMP v2c/v3 Support** - Industry-standard monitoring protocol with 64-bit counters
- **Router API Integration** - Extensible interface for Ubiquiti, MikroTik, OpenWrt, and custom APIs
- **Real-time Traffic Rates** - Live download/upload speeds with charts
- **Historical Usage** - Daily, weekly, monthly aggregations with persistence

### Data & Reporting
- **SQLite Database** - Local storage with Entity Framework Core
- **Usage Reports** - Filterable by friend, period (today/week/month/custom)
- **Export** - CSV and Excel (XLSX) export for billing/fair-use monitoring
- **Comparison Charts** - Visual usage comparison between friends
- **Peak & Average Statistics** - Detailed bandwidth analysis

### Device Management
- **Guided Setup Wizard** - 8-step configuration process
- **Interface Discovery** - Automatic SNMP interface enumeration
- **WAN Interface Selection** - Visual interface picker with descriptions
- **Connection Testing** - Real-time connectivity verification
- **Multiple Collector Types** - SNMP, Router API, Manual (testing)

### Alerts & Notifications
- **Configurable Alert Rules** - Monthly/daily limits, offline detection, polling failures
- **Multi-level Severity** - Info, Warning, Critical
- **Windows Notifications** - System toast notifications
- **In-App Alert Center** - Acknowledgment and history

### Security
- **Encrypted Credentials** - Windows DPAPI / Credential Manager storage
- **No Plaintext Secrets** - Passwords never logged or stored in plain text
- **Local Only** - No cloud connectivity, no traffic inspection
- **Audit Trail** - Configuration change logging

### UI/UX
- **Modern WPF** - Clean, responsive dark/light themes
- **LiveCharts2** - Interactive, performant charts
- **MVVM Architecture** - Maintainable, testable codebase
- **System Tray** - Minimize to tray with background monitoring

## Architecture

```
NetUsageMonitor.sln
├── NetUsageMonitor.Core       # Domain models, interfaces, enums, value objects
├── NetUsageMonitor.Data       # EF Core, SQLite, repositories, migrations
├── NetUsageMonitor.Snmp       # SNMP collectors, OID definitions, parsers
├── NetUsageMonitor.Services   # Business logic, monitoring, alerts, reports
├── NetUsageMonitor.Wpf        # WPF UI, ViewModels, Views, Converters
├── NetUsageMonitor.Tests      # Unit tests (xUnit, Moq, FluentAssertions)
└── NetUsageMonitor.IntegrationTests # Integration tests with mock SNMP device
```

### Key Components

**Traffic Collection Pipeline**
```
Device Config → Collector (SNMP/API/Manual) → Counter Processor → Usage Calculator → Database
                                                              ↓
                                              Daily/Monthly Aggregation
                                                              ↓
                                              Alert Engine → Notifications
```

**Collector Interface**
```csharp
ITrafficCollector
├── SnmpTrafficCollector      # SharpSnmpLib, v2c/v3, 64-bit counters
├── RouterApiTrafficCollector # HTTP/JSON APIs (Ubiquiti, MikroTik, OpenWrt)
└── ManualTrafficCollector    # Test data generator
```

## Requirements

- **OS**: Windows 10 1909+ / Windows 11
- **Runtime**: .NET 8.0 Desktop Runtime
- **Network**: Administrator access to routers (SNMP/API)
- **Database**: Local SQLite (auto-created)

## Installation

### From Release
1. Download `NetUsageMonitor-Setup.exe` from Releases
2. Run installer (requires admin for system tray registration)
3. Launch from Start Menu

### From Source
```bash
# Prerequisites
- Visual Studio 2022 17.8+ with .NET Desktop workload
- .NET 8.0 SDK

# Build
git clone https://github.com/yourusername/NetUsageMonitor.git
cd NetUsageMonitor
dotnet build NetUsageMonitor.sln -c Release

# Run
cd NetUsageMonitor.Wpf
dotnet run -c Release

# Publish
dotnet publish NetUsageMonitor.Wpf/NetUsageMonitor.Wpf.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

## Quick Start

### 1. Run Setup Wizard
1. Launch NetUsage Monitor
2. Click **"Run Setup Wizard"** in sidebar
3. Follow 8 steps:
   - Add Router A (Friend A's router)
   - Add Router B (Friend B's router)
   - Test connectivity
   - Discover interfaces
   - Select WAN interface
   - Test traffic counters
   - Set polling interval (default 60s)
   - Start monitoring

### 2. Manual Device Configuration
1. Navigate to **Devices** page
2. Click **Add Device**
3. Configure:
   - **Device Name**: "Router A"
   - **Friend Name**: "Friend A"
   - **IP Address**: Router's management IP
   - **Collector Type**: SNMP (recommended)
   - **SNMP Version**: v2c or v3
   - **Community**: SNMP community string (v2c)
   - **Interface**: Select WAN interface after discovery
4. Click **Test Connection** → **Discover Interfaces**
5. Save

### 3. SNMP Configuration Details

**SNMPv2c (Simple)**
- Community string (default: "public")
- Read-only access sufficient
- Enable on router's WAN interface

**SNMPv3 (Secure)**
- Username
- Auth Protocol: SHA/MD5 + password
- Priv Protocol: AES/DES + password
- Requires router support

**Required OIDs**
- `ifHCInOctets` / `ifHCOutOctets` (64-bit, preferred)
- `ifInOctets` / `ifOutOctets` (32-bit fallback)
- `ifDescr`, `ifName`, `ifOperStatus`, `ifSpeed`, `ifHighSpeed`

### 4. Router API Configuration

**Ubiquiti/UniFi**
- API Type: "unifi"
- Base URL: `https://controller:8443`
- API Key or Username/Password

**MikroTik**
- API Type: "mikrotik"
- Base URL: `http://router/rest`
- Username/Password

**OpenWrt**
- API Type: "openwrt"
- Base URL: `http://router/ubus`
- Username/Password

## Usage Guide

### Dashboard
- **Total Usage** - Combined download/upload for both friends
- **Per-Friend Breakdown** - Individual download/upload/total
- **Current Speeds** - Real-time Mbps rates
- **Period Summaries** - Today/Week/Month totals
- **Charts** - Comparison, daily, weekly, monthly trends

### Live Monitoring
- **Per-Device Status** - Online/offline, last poll, errors
- **Real-time Charts** - 30-minute traffic history
- **Interface Counters** - Raw SNMP counter values
- **Polling Interval Control** - Adjust on-the-fly

### Usage Reports
- **Filters** - Friend, date range, period presets
- **Summary Table** - Totals, peaks, averages per friend
- **Daily/Hourly Charts** - Granular usage visualization
- **Comparison** - Percentage split between friends
- **Export** - CSV for spreadsheets, Excel for formatted reports

### Alerts
- **Active Alerts** - Real-time notification list
- **Alert Rules** - Configure thresholds per device
  - Monthly limit (GB)
  - Daily limit (GB)
  - Offline detection
  - Polling failure count
  - High bandwidth threshold (Mbps)
- **Acknowledgment** - Mark alerts as handled

### Settings
- **Default Polling** - Global interval (10-3600s)
- **Display Units** - GB/MB or GiB/MiB
- **Data Retention** - Auto-cleanup days (default 365)
- **Theme** - Light/Dark/System
- **Notifications** - Windows toast on/off
- **Startup** - Auto-start monitoring, minimize to tray

## Network Topology Support

```
Internet → Provider CPE → Wireless Link → Receiving CPE → Switch → Router A → Friend A
                                                          └→ Router B → Friend B
```

**Monitoring Points**
- **Router A WAN** - Friend A's internet traffic
- **Router B WAN** - Friend B's internet traffic
- **Receiving CPE** - Aggregate (if managed switch)

**CPE as Bridge**
If the receiving CPE operates as a transparent bridge, monitor the two downstream routers. The application does not require CPE monitoring if routers provide accurate WAN counters.

## Troubleshooting

### Common Issues

**"Device Unreachable"**
- Verify IP address and port (default 161)
- Check firewall allows UDP 161
- Confirm SNMP service enabled on router

**"Authentication Failed" (SNMPv3)**
- Verify username, auth/priv passwords
- Match auth/priv protocols on both sides
- Check router's SNMPv3 user configuration

**"No Interfaces Found"**
- Ensure SNMP read access to IF-MIB
- Try SNMPv2c if v3 fails
- Check router's SNMP view permissions

**"Counter Wraparound Detected"**
- Normal for 32-bit counters on high-traffic links
- Application handles automatically
- Prefer 64-bit counters (ifHCInOctets)

**"Interface Down"**
- Select correct WAN interface (not LAN)
- Check `ifOperStatus` = 1 (up)
- Verify physical link

### Diagnostic Tools
- **Diagnostics Page** - Run full device diagnostics
- **Interface Discovery** - Lists all interfaces with stats
- **Counter Test** - Verifies counter increments
- **Connection Test** - Validates SNMP/API connectivity

### Logs
- Location: `%LOCALAPPDATA%\NetUsageMonitor\logs\`
- Serilog rolling files, daily retention
- Debug level available in settings

## Development

### Project Structure
```
NetUsageMonitor/
├── NetUsageMonitor.Core/          # Domain layer
│   ├── Models/                    # Device, Sample, Usage, Alert
│   ├── Interfaces/                # ITrafficCollector, IDatabaseService, etc.
│   ├── Enums/                     # DeviceType, SnmpVersion, AlertType, etc.
│   ├── ValueObjects/              # DataSize, MacAddress, IpAddress
│   └── Extensions/                # LINQ helpers, formatting
├── NetUsageMonitor.Data/          # Data layer
│   ├── NetUsageDbContext.cs       # EF Core context
│   ├── Configurations/            # Entity mappings
│   └── Repositories/              # DatabaseService implementation
├── NetUsageMonitor.Snmp/          # SNMP layer
│   ├── Models/                    # OID constants, SNMP models
│   └── Collectors/                # SnmpTrafficCollector
├── NetUsageMonitor.Services/      # Business logic
│   ├── Security/                  # Credential stores (DPAPI, CredMgr)
│   ├── Monitoring/                # Polling, counters, alerts
│   ├── Reporting/                 # Report generation, export
│   ├── Wizard/                    # Setup wizard
│   └── Diagnostics/               # Diagnostic service
└── NetUsageMonitor.Wpf/           # Presentation
    ├── ViewModels/                # MVVM view models
    ├── Views/                     # XAML views
    ├── Converters/                # Value converters
    └── Resources/                 # Styles, colors, themes
```

### Adding New Collector
1. Implement `ITrafficCollector` in `NetUsageMonitor.Snmp/Collectors/`
2. Register in `App.xaml.cs` DI container
3. Add to `CollectorType` enum
4. Update `DevicesViewModel.GetCollector()`

### Adding New Router API
1. Extend `RouterApiTrafficCollector.ParseResponse()`
2. Add API type to `ApiTypes` in `DevicesViewModel`
3. Implement `ParseInterfaces()` for discovery
4. Test with target router firmware

### Database Migrations
```bash
cd NetUsageMonitor.Data
dotnet ef migrations add MigrationName
dotnet ef database update
```

## Security Considerations

- **Credentials**: Encrypted via DPAPI (per-user) or Windows Credential Manager
- **Network**: Only connects to explicitly configured devices
- **Data**: SQLite database local to user profile
- **Privacy**: No packet inspection, no DNS/HTTP tracking, no cloud sync
- **Updates**: No auto-update mechanism (manual deploy)

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs` folder
- **Logs**: `%LOCALAPPDATA%\NetUsageMonitor\logs\`

## Changelog

### v1.0.0 (Initial Release)
- Complete monitoring for dual-router topology
- SNMP v2c/v3 with 64-bit counter support
- Router API integrations (Ubiquiti, MikroTik, OpenWrt)
- SQLite persistence with EF Core
- LiveCharts2 visualizations
- Alert system with Windows notifications
- Setup wizard and diagnostics
- Dark/light theme support
- CSV/Excel export
- Comprehensive test suite