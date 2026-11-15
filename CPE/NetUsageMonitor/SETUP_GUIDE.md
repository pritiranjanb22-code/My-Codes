# Setup Guide

## Prerequisites

### Router Requirements
- **SNMP Access**: Router must support SNMP v2c or v3
- **Read-Only Community**: Configure read-only SNMP community
- **MIB Support**: IF-MIB (RFC 2863) required, IF-MIB::ifHCInOctets/OutOctets preferred
- **Network Reachability**: Management IP accessible from monitoring PC

### Windows Requirements
- Windows 10 1909+ or Windows 11
- .NET 8.0 Desktop Runtime (included in self-contained publish)
- Administrator rights for installation (system tray, firewall)
- Local user profile for credential storage

## Installation Steps

### 1. Download & Install
```
1. Download NetUsageMonitor-Setup.exe
2. Right-click → Run as Administrator
3. Follow installer prompts
4. Allow Windows Firewall exception if prompted
5. Launch from Start Menu
```

### 2. Initial Configuration (Setup Wizard)

#### Step 1: Add Router A (Friend A)
- **Device Name**: Descriptive name (e.g., "Friend A - Main Router")
- **Friend Name**: "Friend A" (must match exactly for grouping)
- **IP Address**: Router's LAN management IP (e.g., 192.168.1.1)
- **Collector Type**: SNMP (recommended)
- Click **Next**

#### Step 2: Add Router B (Friend B)
- Same as Step 1 but for Friend B's router
- **Friend Name**: "Friend B"
- Click **Next**

#### Step 3: Test Connectivity
- Wizard attempts SNMP connection to both routers
- Green check = success, Red X = failure
- If failed: Verify IP, community string, firewall
- Click **Retry** or **Back** to fix

#### Step 4: Discover Interfaces
- Queries each router for interface list
- Shows: Index, Name, Description, Type, Speed, Status
- Verify interfaces appear for both routers
- Click **Next**

#### Step 5: Select WAN Interface
- **Critical Step**: Choose the INTERNET-facing interface
- Look for: "WAN", "Internet", "PPP", "eth0" (varies by router)
- **DO NOT** select LAN interfaces (eth1, br-lan, etc.)
- Interface should show traffic counters incrementing
- Click **Next**

#### Step 6: Test Traffic Counters
- Reads current counter values from selected interfaces
- Verifies counters increment on subsequent polls
- Confirms 64-bit counter support (ifHCInOctets)
- Click **Next**

#### Step 7: Set Polling Interval
- **Default**: 60 seconds (recommended)
- **Range**: 10-3600 seconds
- Shorter = more granular data, more router load
- Click **Next**

#### Step 8: Start Monitoring
- Saves all configuration to database
- Starts background polling service
- Opens Dashboard
- **Done!**

### 3. Manual Configuration (Alternative)

If you prefer manual setup or need to modify devices:

1. Go to **Devices** page
2. Click **Add Device**
3. Fill all fields:
   - Basic Info (Name, Friend, IP, Type)
   - Collector Settings (SNMP v2c/v3 or Router API)
   - Interface (after discovery)
   - Polling Interval
4. **Test Connection** → **Discover Interfaces**
5. Select WAN interface from dropdown
6. **Save**

### 4. SNMP Configuration by Router Brand

#### Ubiquiti EdgeRouter / UniFi
```
SSH to router:
configure
set service snmp community public authorization ro
set service snmp listen-address 192.168.1.1
commit; save
```
- Community: "public" (or custom)
- Version: v2c
- Port: 161

#### MikroTik RouterOS
```
WinBox / Terminal:
/snmp set enabled=yes contact="admin" location="Office"
/snmp community add name=public addresses=192.168.1.0/24
```
- Community: "public"
- Version: v2c
- Port: 161

#### OpenWrt
```
/etc/config/snmpd:
config agent
    option agentaddress 'udp:161'
    option community 'public'
    option authorization 'read-only'

service snmpd restart
```
- Community: "public"
- Version: v2c
- Port: 161

#### Generic Linux (net-snmp)
```
/etc/snmp/snmpd.conf:
rocommunity public 192.168.1.0/24
agentaddress udp:161

systemctl restart snmpd
```

#### Windows (Built-in SNMP Service)
- Enable "SNMP Service" in Windows Features
- Configure: Security → Communities → "public" (Read Only)
- Traps: Not needed
- Restart service

### 5. SNMPv3 Configuration (Advanced)

For enhanced security:

**Router Side (Ubiquiti example):**
```
configure
set service snmp v3 user netmonitor auth sha auth-password 'AuthPass123'
set service snmp v3 user netmonitor privacy aes priv-password 'PrivPass123'
set service snmp v3 user netmonitor auth-type sha
set service snmp v3 user netmonitor privacy-type aes
commit; save
```

**NetUsage Monitor Config:**
- Version: v3
- Username: `netmonitor`
- Auth Protocol: SHA
- Auth Password: `AuthPass123`
- Priv Protocol: AES
- Priv Password: `PrivPass123`

### 6. Firewall Rules

**Windows Firewall (Auto-configured by installer)**
- Inbound: UDP 161 (SNMP responses)
- Outbound: UDP 161 (SNMP requests)

**Router Firewall**
```
# Allow SNMP from monitoring PC only
iptables -A INPUT -p udp --dport 161 -s 192.168.1.100 -j ACCEPT
iptables -A INPUT -p udp --dport 161 -j DROP
```

### 7. Verification Checklist

After setup, verify:

- [ ] Dashboard shows "All Online" status
- [ ] Both friends show current speeds (>0 Mbps when active)
- [ ] Last Update timestamp updates every poll interval
- [ ] Daily/Weekly/Monthly totals increment
- [ ] Charts render data points
- [ ] No errors in Diagnostics page
- [ ] Alerts page shows "No active alerts"

### 8. Production Considerations

**High Availability**
- Run on dedicated monitoring PC/server
- Configure Windows auto-login + startup
- Use UPS for monitoring hardware

**Data Retention**
- Default: 365 days (configurable in Settings)
- Daily/Monthly aggregates retained indefinitely
- Raw samples cleaned up by retention policy

**Backup**
- Database: `%LOCALAPPDATA%\NetUsageMonitor\netusagemonitor.db`
- Backup daily via scheduled task:
  ```powershell
  Copy-Item "$env:LOCALAPPDATA\NetUsageMonitor\netusagemonitor.db" "D:\Backups\NetUsageMonitor_$(Get-Date -Format 'yyyyMMdd').db"
  ```

**Monitoring the Monitor**
- Check Windows Event Log for application errors
- Alert on "Polling Failure" alerts in NetUsage Monitor
- Verify disk space for database growth (~10MB/month per device)

## Troubleshooting Installation

### "Application failed to start"
- Install .NET 8 Desktop Runtime: https://dotnet.microsoft.com/download/dotnet/8.0
- Repair Visual C++ Redistributables

### "Access denied" on credential storage
- Run as same user who configured devices
- DPAPI is per-user; credentials not shared across users
- Re-enter credentials if user profile changed

### "Database locked" errors
- Ensure only one instance running
- Check for antivirus locking SQLite file
- Exclude `%LOCALAPPDATA%\NetUsageMonitor\` from real-time scanning

### No data after 5+ minutes
- Run Diagnostics on each device
- Check "Counter Wraparound" warnings (normal)
- Verify correct WAN interface selected
- Increase polling interval if router CPU high

## Upgrading

1. Download new version
2. Close NetUsage Monitor (check system tray)
3. Run new installer (preserves database & settings)
4. Launch - database auto-migrates if needed

## Uninstalling

1. Settings → Apps → NetUsage Monitor → Uninstall
2. Optionally remove data: `%LOCALAPPDATA%\NetUsageMonitor\`
3. Remove firewall rules if manually added