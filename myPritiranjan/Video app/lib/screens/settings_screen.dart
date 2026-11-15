import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:watch_together/components/animated_background.dart';
import 'package:watch_together/components/glass_card.dart';
import 'package:watch_together/utils/app_theme.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
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
                            'Settings',
                            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SliverList(
                delegate: SliverChildListDelegate([
                  _buildSection('Video', [
                    _buildSettingTile(Icons.hd_rounded, 'Video Quality', 'Auto (Adaptive)', 'Adjusts based on network'),
                    _buildSettingTile(Icons.storage_rounded, 'Buffer Size', 'Auto', 'Preload duration'),
                    _buildSettingTile(Icons.memory_rounded, 'Hardware Decoding', 'Enabled', 'Use GPU acceleration'),
                    _buildSettingTile(Icons.aspect_ratio_rounded, 'Default Aspect Ratio', 'Original', 'Fit / Crop / Stretch'),
                  ]),
                  _buildSection('Audio', [
                    _buildSettingTile(Icons.volume_up_rounded, 'Default Volume', '80%', 'Initial playback volume'),
                    _buildSettingTile(Icons.surround_sound_rounded, 'Audio Ducking', 'Enabled', 'Lower movie volume during voice chat'),
                    _buildSettingTile(Icons.headphones_rounded, 'Output Device', 'Default', 'Speaker / Bluetooth / Headphones'),
                    _buildSettingTile(Icons.equalizer_rounded, 'Audio Normalization', 'Disabled', 'Balance loud/quiet scenes'),
                  ]),
                  _buildSection('Playback', [
                    _buildSettingTile(Icons.speed_rounded, 'Default Speed', '1.0x', 'Playback speed'),
                    _buildSettingTile(Icons.replay_rounded, 'Skip Interval', '10 seconds', 'Forward/backward skip'),
                    _buildSettingTile(Icons.subtitles_rounded, 'Subtitle Size', 'Medium', 'Small / Medium / Large / Custom'),
                    _buildSettingTile(Icons.format_color_text_rounded, 'Subtitle Style', 'White with outline', 'Color, font, background'),
                    _buildSettingTile(Icons.auto_fix_high_rounded, 'Auto-resume', 'Enabled', 'Continue from last position'),
                  ]),
                  _buildSection('Sync & Network', [
                    _buildSettingTile(Icons.sync_rounded, 'Sync Sensitivity', 'Normal', 'Strict / Normal / Relaxed'),
                    _buildSettingTile(Icons.signal_cellular_alt_rounded, 'Max Drift Threshold', '100ms', 'Seek correction threshold'),
                    _buildSettingTile(Icons.analytics_rounded, 'Network Diagnostics', '', 'View detailed stats', onTap: _openDiagnostics),
                    _buildSettingTile(Icons.wifi_rounded, 'Local Network Only', 'Enabled', 'Disable cloud features'),
                  ]),
                  _buildSection('Voice Chat', [
                    _buildSettingTile(Icons.mic_rounded, 'Microphone', 'Ask each time', 'Permission handling'),
                    _buildSettingTile(Icons.keyboard_voice_rounded, 'Push-to-Talk', 'Disabled', 'Hold to speak'),
                    _buildSettingTile(Icons.volume_down_rounded, 'Ducking Level', '30%', 'Movie volume when others speak'),
                    _buildSettingTile(Icons.timer_rounded, 'Ducking Fade', '200ms', 'Fade in/out duration'),
                  ]),
                  _buildSection('Storage', [
                    _buildSettingTile(Icons.cleaning_services_rounded, 'Clear Cache', '', 'Free up space', onTap: _clearCache),
                    _buildSettingTile(Icons.delete_forever_rounded, 'Delete Downloaded Videos', '', 'Remove cached videos', onTap: _deleteVideos),
                    _buildSettingTile(Icons.pie_chart_rounded, 'Cache Limit', '2 GB', 'Maximum cache size'),
                    _buildSettingTile(Icons.info_outline_rounded, 'Storage Info', '', 'View usage details', onTap: _showStorageInfo),
                  ]),
                  _buildSection('Appearance', [
                    _buildSettingTile(Icons.dark_mode_rounded, 'Theme', 'Dark', 'Dark / Light / System'),
                    _buildSettingTile(Icons.color_lens_rounded, 'Accent Color', 'Purple', 'Primary / Teal / Red / Custom'),
                    _buildSettingTile(Icons.text_fields_rounded, 'Font', 'Inter', 'System / Inter / Roboto'),
                    _buildSettingTile(Icons.accessibility_rounded, 'Reduce Motion', 'Disabled', 'Minimize animations'),
                  ]),
                  _buildSection('Notifications', [
                    _buildSettingTile(Icons.notifications_rounded, 'Playback Controls', 'Enabled', 'Show who paused/seeked'),
                    _buildSettingTile(Icons.chat_bubble_rounded, 'Chat Messages', 'Enabled', 'New message alerts'),
                    _buildSettingTile(Icons.person_add_rounded, 'User Join/Leave', 'Enabled', 'Participant notifications'),
                    _buildSettingTile(Icons.warning_rounded, 'Sync Issues', 'Enabled', 'High drift warnings'),
                  ]),
                  _buildSection('Privacy & Security', [
                    _buildSettingTile(Icons.fingerprint_rounded, 'Room PIN', 'Optional', 'Require PIN to join'),
                    _buildSettingTile(Icons.encryption_rounded, 'Local Encryption', 'Enabled', 'Encrypt local traffic'),
                    _buildSettingTile(Icons.analytics_rounded, 'Anonymous Diagnostics', 'Disabled', 'Help improve sync'),
                    _buildSettingTile(Icons.delete_forever_rounded, 'Reset All Data', '', 'Clear all settings', onTap: _resetData),
                  ]),
                  _buildSection('About', [
                    _buildSettingTile(Icons.info_rounded, 'Version', '1.0.0', 'Build 1'),
                    _buildSettingTile(Icons.article_rounded, 'Licenses', '', 'Open source licenses', onTap: _showLicenses),
                    _buildSettingTile(Icons.privacy_tip_rounded, 'Privacy Policy', '', 'Read policy', onTap: _showPrivacy),
                    _buildSettingTile(Icons.bug_report_rounded, 'Report Issue', '', 'GitHub Issues', onTap: _reportIssue),
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

  Widget _buildSettingTile(
    IconData icon,
    String title,
    String subtitle,
    String description, {
    VoidCallback? onTap,
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
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (subtitle.isNotEmpty)
            Text(subtitle, style: TextStyle(fontSize: 13, color: AppTheme.primaryColor, fontWeight: FontWeight.w500)),
          Text(description, style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ],
      ),
      trailing: onTap != null ? const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.textMuted) : null,
    );
  }

  void _openDiagnostics() {
    Navigator.pushNamed(context, '/diagnostics');
  }

  void _clearCache() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Clear Cache'),
        content: const Text('This will remove all cached data. Downloaded videos will need to be re-downloaded.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cache cleared')),
              );
            },
            child: const Text('Clear', style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }

  void _deleteVideos() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: Text('Delete Downloaded Videos', style: TextStyle(color: AppTheme.errorColor)),
        content: const Text('This will permanently delete all cached video files. This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Videos deleted')),
              );
            },
            child: Text('Delete', style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }

  void _showStorageInfo() {
    // Show storage details
  }

  void _resetData() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: Text('Reset All Data', style: TextStyle(color: AppTheme.errorColor)),
        content: const Text('This will reset all settings and clear all data. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Data reset')),
              );
            },
            child: Text('Reset', style: TextStyle(color: AppTheme.errorColor)),
          ),
        ],
      ),
    );
  }

  void _showLicenses() {
    showLicensePage(context: context, applicationName: 'WatchTogether', applicationVersion: '1.0.0');
  }

  void _showPrivacy() {
    // Show privacy policy
  }

  void _reportIssue() {
    // Open GitHub issues
  }
}