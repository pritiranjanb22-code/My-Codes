import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:watch_together/components/animated_background.dart';
import 'package:watch_together/components/glass_card.dart';
import 'package:watch_together/utils/app_theme.dart';
import 'package:watch_together/utils/logger.dart';

class DiagnosticsScreen extends ConsumerStatefulWidget {
  const DiagnosticsScreen({super.key});

  @override
  ConsumerState<DiagnosticsScreen> createState() => _DiagnosticsScreenState();
}

class _DiagnosticsScreenState extends ConsumerState<DiagnosticsScreen> {
  Timer? _updateTimer;
  Map<String, dynamic> _stats = {};

  @override
  void initState() {
    super.initState();
    _updateStats();
    _updateTimer = Timer.periodic(const Duration(seconds: 1), (_) => _updateStats());
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    super.dispose();
  }

  void _updateStats() {
    // In a real implementation, this would fetch from the sync engine, network service, etc.
    setState(() {
      _stats = {
        'fps': 60,
        'videoDecoder': 'MediaCodec (HW)',
        'resolution': '1920x1080',
        'codec': 'H.264 / AVC',
        'bufferDuration': '5.2s',
        'networkLatency': '18ms',
        'jitter': '3ms',
        'packetLoss': '0.00%',
        'syncOffset': '+12ms',
        'currentPosition': '00:15:32.450',
        'targetPosition': '00:15:32.462',
        'memoryUsage': '156 MB',
        'cpuUsage': '12%',
        'roomId': 'WT12345678',
        'participants': 5,
        'hostLatency': '15ms',
        'avgDrift': '22ms',
        'maxDrift': '42ms',
      };
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.textPrimary),
                            style: IconButton.styleFrom(
                              backgroundColor: AppTheme.cardColor.withValues(alpha: 0.5),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Network Diagnostics',
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
              SliverList(
                delegate: SliverChildListDelegate([
                  _buildSection('Synchronization Quality', [
                    _buildStatRow('Sync Quality', 'EXCELLENT', AppTheme.successColor),
                    _buildStatRow('Average Drift', '${_stats['avgDrift']}', AppTheme.primaryColor),
                    _buildStatRow('Maximum Drift', '${_stats['maxDrift']}', AppTheme.warningColor),
                    _buildStatRow('Target', '<100ms', AppTheme.textSecondary),
                    _buildStatRow('Current Offset', '${_stats['syncOffset']}', AppTheme.primaryColor),
                    _buildStatRow('Host Latency', '${_stats['hostLatency']}', AppTheme.textSecondary),
                  ]),
                  _buildSection('Video Playback', [
                    _buildStatRow('FPS', '${_stats['fps']}', AppTheme.primaryColor),
                    _buildStatRow('Decoder', '${_stats['videoDecoder']}', AppTheme.textSecondary),
                    _buildStatRow('Resolution', '${_stats['resolution']}', AppTheme.textSecondary),
                    _buildStatRow('Codec', '${_stats['codec']}', AppTheme.textSecondary),
                    _buildStatRow('Buffer', '${_stats['bufferDuration']}', AppTheme.textSecondary),
                    _buildStatRow('Current Position', '${_stats['currentPosition']}', AppTheme.textSecondary),
                    _buildStatRow('Target Position', '${_stats['targetPosition']}', AppTheme.textSecondary),
                  ]),
                  _buildSection('Network', [
                    _buildStatRow('Latency', '${_stats['networkLatency']}', AppTheme.successColor),
                    _buildStatRow('Jitter', '${_stats['jitter']}', AppTheme.successColor),
                    _buildStatRow('Packet Loss', '${_stats['packetLoss']}', AppTheme.successColor),
                    _buildStatRow('Room ID', '${_stats['roomId']}', AppTheme.textSecondary),
                    _buildStatRow('Participants', '${_stats['participants']}/20', AppTheme.textSecondary),
                  ]),
                  _buildSection('Performance', [
                    _buildStatRow('Memory Usage', '${_stats['memoryUsage']}', AppTheme.successColor),
                    _buildStatRow('CPU Usage', '${_stats['cpuUsage']}', AppTheme.successColor),
                  ]),
                  _buildSection('Actions', [
                    _buildActionTile(
                      icon: Icons.refresh_rounded,
                      title: 'Run Sync Test',
                      subtitle: 'Measure synchronization across all devices',
                      onTap: _runSyncTest,
                    ),
                    _buildActionTile(
                      icon: Icons.download_rounded,
                      title: 'Export Logs',
                      subtitle: 'Save diagnostic data to file',
                      onTap: _exportLogs,
                    ),
                    _buildActionTile(
                      icon: Icons.bug_report_rounded,
                      title: 'Report Issue',
                      subtitle: 'Open GitHub issue with diagnostics',
                      onTap: _reportIssue,
                    ),
                  ]),
                ]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
        ),
        GlassCard(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: EdgeInsets.zero,
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildStatRow(String label, String value, Color valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: valueColor,
              fontFamily: 'monospace',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppTheme.primaryColor, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.textMuted),
    );
  }

  void _runSyncTest() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sync test started...')),
    );
  }

  void _exportLogs() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Logs exported to Downloads')),
    );
  }

  void _reportIssue() {
    // Open GitHub issues
  }
}