# Build Instructions

## Prerequisites

### Development Environment
- **Visual Studio 2022 17.8+** with ".NET Desktop Development" workload
- **.NET 8.0 SDK** (8.0.400+)
- **Git** for version control
- **PowerShell 5.1+** or **PowerShell 7+**

### Required Extensions (Recommended)
- **C# Dev Kit** or **Roslynator**
- **XAML Styler**
- **LiveCharts2** preview support

## Building from Source

### Command Line
```bash
# Clone repository
git clone https://github.com/yourusername/NetUsageMonitor.git
cd NetUsageMonitor

# Restore packages
dotnet restore NetUsageMonitor.sln

# Build Debug
dotnet build NetUsageMonitor.sln -c Debug

# Build Release
dotnet build NetUsageMonitor.sln -c Release

# Run tests
dotnet test NetUsageMonitor.Tests/NetUsageMonitor.Tests.csproj -c Release
dotnet test NetUsageMonitor.IntegrationTests/NetUsageMonitor.IntegrationTests.csproj -c Release
```

### Visual Studio
1. Open `NetUsageMonitor.sln`
2. Set `NetUsageMonitor.Wpf` as Startup Project
3. Press `F5` (Debug) or `Ctrl+F5` (Release)

## Publishing

### Self-Contained Single File (Recommended for Distribution)
```bash
cd NetUsageMonitor.Wpf
dotnet publish NetUsageMonitor.Wpf.csproj \
  -c Release \
  -r win-x64 \
  --self-contained true \
  -p:PublishSingleFile=true \
  -p:IncludeNativeLibrariesForSelfExtract=true \
  -p:EnableCompressionInSingleFile=true \
  -o ../publish/win-x64
```

**Output**: `../publish/win-x64/NetUsageMonitor.exe` (~80-100 MB)

### Framework-Dependent (Smaller, Requires .NET Runtime)
```bash
dotnet publish NetUsageMonitor.Wpf.csproj \
  -c Release \
  -r win-x64 \
  --self-contained false \
  -o ../publish/win-x64-fd
```

**Output**: `../publish/win-x64-fd/NetUsageMonitor.exe` (~10-15 MB)

### Publish Profiles
Create `NetUsageMonitor.Wpf/Properties/PublishProfiles/win-x64.pubxml`:
```xml
<Project>
  <PropertyGroup>
    <Configuration>Release</Configuration>
    <TargetFramework>net8.0-windows</TargetFramework>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
    <SelfContained>true</SelfContained>
    <PublishSingleFile>true</PublishSingleFile>
    <PublishReadyToRun>true</PublishReadyToRun>
    <PublishTrimmed>false</PublishTrimmed>
    <IncludeNativeLibrariesForSelfExtract>true</IncludeNativeLibrariesForSelfExtract>
    <EnableCompressionInSingleFile>true</EnableCompressionInSingleFile>
  </PropertyGroup>
</Project>
```

Then: `dotnet publish NetUsageMonitor.Wpf.csproj -p:PublishProfile=win-x64`

## Creating Installer

### Using WiX Toolset (MSI)
```xml
<!-- NetUsageMonitor.Wpf/Installer/Product.wxs -->
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" Name="NetUsage Monitor" Language="1033" Version="1.0.0.0" Manufacturer="Your Company" UpgradeCode="PUT-GUID-HERE">
    <Package InstallerVersion="500" Compressed="yes" InstallScope="perMachine" />
    <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
    <MediaTemplate EmbedCab="yes" />
    <Feature Id="ProductFeature" Title="NetUsage Monitor" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
      <ComponentRef Id="ApplicationShortcut" />
      <ComponentRef Id="UninstallShortcut" />
    </Feature>
  </Product>
  
  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="NetUsageMonitor" />
      </Directory>
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="NetUsage Monitor" />
      </Directory>
    </Directory>
  </Fragment>
  
  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="MainExecutable" Guid="PUT-GUID-HERE">
        <File Source="$(var.PublishDir)NetUsageMonitor.exe" KeyPath="yes" />
        <File Source="$(var.PublishDir)NetUsageMonitor.dll" />
        <!-- All other published files -->
      </Component>
      <Component Id="ApplicationShortcut" Directory="ApplicationProgramsFolder">
        <Shortcut Id="ApplicationStartMenuShortcut" Name="NetUsage Monitor" Target="[INSTALLFOLDER]NetUsageMonitor.exe" WorkingDirectory="INSTALLFOLDER" />
        <RemoveFolder Id="RemoveApplicationProgramsFolder" Directory="ApplicationProgramsFolder" On="uninstall" />
        <RegistryValue Root="HKCU" Key="Software\NetUsageMonitor" Name="Installed" Type="integer" Value="1" KeyPath="yes" />
      </Component>
      <Component Id="UninstallShortcut" Directory="ApplicationProgramsFolder">
        <Shortcut Id="UninstallShortcut" Name="Uninstall NetUsage Monitor" Target="[SystemFolder]msiexec.exe" Arguments="/x [ProductCode]" />
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>
```

Build:
```bash
# Install WiX
dotnet tool install -g wix

# Build installer
cd NetUsageMonitor.Wpf/Installer
wix build Product.wxs -o NetUsageMonitor-Setup.msi
```

### Using Inno Setup (Alternative)
```iss
; NetUsageMonitor.Wpf/Installer/Setup.iss
[Setup]
AppName=NetUsage Monitor
AppVersion=1.0.0
DefaultDirName={autopf}\NetUsageMonitor
DefaultGroupName=NetUsage Monitor
OutputDir=..\..\publish
OutputBaseFilename=NetUsageMonitor-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Files]
Source: "..\..\publish\win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\NetUsage Monitor"; Filename: "{app}\NetUsageMonitor.exe"
Name: "{group}\Uninstall NetUsage Monitor"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\NetUsageMonitor.exe"; Description: "Launch NetUsage Monitor"; Flags: nowait postinstall skipifsilent
```

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/build.yml
name: Build & Release

on:
  push:
    tags: ['v*']
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Restore
        run: dotnet restore NetUsageMonitor.sln
      
      - name: Build
        run: dotnet build NetUsageMonitor.sln -c Release --no-restore
      
      - name: Test
        run: dotnet test NetUsageMonitor.sln -c Release --no-build --logger "trx;LogFileName=test_results.trx"
      
      - name: Publish Self-Contained
        run: |
          dotnet publish NetUsageMonitor.Wpf/NetUsageMonitor.Wpf.csproj \
            -c Release -r win-x64 --self-contained true \
            -p:PublishSingleFile=true \
            -o ${{env.GITHUB_WORKSPACE}}/publish/win-x64
      
      - name: Create Release Zip
        run: |
          cd ${{env.GITHUB_WORKSPACE}}/publish/win-x64
          7z a -tzip ${{env.GITHUB_WORKSPACE}}/NetUsageMonitor-${{github.ref_name}}-win-x64.zip *
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: NetUsageMonitor-${{github.ref_name}}-win-x64
          path: publish/win-x64/**
      
      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v1
        with:
          files: |
            NetUsageMonitor-${{github.ref_name}}-win-x64.zip
          generate_release_notes: true
```

## Code Signing (Production)

```bash
# Sign the executable
signtool sign /fd sha256 /a /tr http://timestamp.digicert.com /td sha256 \
  NetUsageMonitor.Wpf/bin/Release/net8.0-windows/win-x64/publish/NetUsageMonitor.exe

# Verify signature
signtool verify /pa /v NetUsageMonitor.exe
```

Add to publish:
```xml
<PropertyGroup>
  <SignAssembly>true</SignAssembly>
  <AssemblyOriginatorKeyFile>NetUsageMonitor.snk</AssemblyOriginatorKeyFile>
</PropertyGroup>
```

## Docker Build (For Testing)

```dockerfile
# Dockerfile.build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["NetUsageMonitor.sln", "."]
COPY ["NetUsageMonitor.Core/*.csproj", "NetUsageMonitor.Core/"]
COPY ["NetUsageMonitor.Data/*.csproj", "NetUsageMonitor.Data/"]
COPY ["NetUsageMonitor.Snmp/*.csproj", "NetUsageMonitor.Snmp/"]
COPY ["NetUsageMonitor.Services/*.csproj", "NetUsageMonitor.Services/"]
COPY ["NetUsageMonitor.Wpf/*.csproj", "NetUsageMonitor.Wpf/"]
COPY ["NetUsageMonitor.Tests/*.csproj", "NetUsageMonitor.Tests/"]
COPY ["NetUsageMonitor.IntegrationTests/*.csproj", "NetUsageMonitor.IntegrationTests/"]
RUN dotnet restore "NetUsageMonitor.sln"

COPY . .
RUN dotnet build "NetUsageMonitor.sln" -c Release -o /app/build

RUN dotnet test "NetUsageMonitor.Tests/NetUsageMonitor.Tests.csproj" -c Release --no-build
RUN dotnet test "NetUsageMonitor.IntegrationTests/NetUsageMonitor.IntegrationTests.csproj" -c Release --no-build

RUN dotnet publish "NetUsageMonitor.Wpf/NetUsageMonitor.Wpf.csproj" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o /app/publish
```

## Troubleshooting Build

### "SDK not found"
```bash
# Install .NET 8 SDK
winget install Microsoft.DotNet.SDK.8
# Or download from https://dotnet.microsoft.com/download/dotnet/8.0
```

### "Package restore failed"
```bash
dotnet nuget locals all --clear
dotnet restore NetUsageMonitor.sln --force
```

### "WPF designer not loading"
- Ensure "XAML Designer" enabled in VS Options
- Build project first (Ctrl+Shift+B)
- Restart Visual Studio

### "LiveCharts2 not found"
- Clear NuGet cache: `dotnet nuget locals all --clear`
- Restore with: `dotnet restore --force`
- Check nuget.org for latest version

### "EF Core tools not found"
```bash
dotnet tool install --global dotnet-ef
dotnet tool update --global dotnet-ef
```

## Release Checklist

- [ ] All tests pass (`dotnet test`)
- [ ] Version bumped in `Directory.Build.props` or `.csproj`
- [ ] Changelog updated
- [ ] Self-contained publish tested on clean VM
- [ ] Installer created and tested
- [ ] Code signed (production)
- [ ] GitHub Release created with artifacts
- [ ] Documentation updated