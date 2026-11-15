export const DATABASE_VERSION = 1;
export const DATABASE_NAME = 'WiFiTalk.db';

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT '',
    phone_number TEXT,
    wifitalk_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    device_name TEXT NOT NULL,
    is_current_user INTEGER DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_version TEXT,
    app_version TEXT,
    local_ip TEXT,
    public_ip TEXT,
    mac_address TEXT,
    is_online INTEGER DEFAULT 0,
    last_seen INTEGER DEFAULT 0,
    capabilities TEXT NOT NULL,
    network_segment TEXT,
    signal_strength INTEGER,
    is_trusted INTEGER DEFAULT 0,
    is_relay INTEGER DEFAULT 0,
    paired_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
  CREATE INDEX IF NOT EXISTS idx_devices_is_online ON devices(is_online);
  CREATE INDEX IF NOT EXISTS idx_devices_network_segment ON devices(network_segment);`,

  `CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT,
    avatar TEXT,
    is_muted INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    settings TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    last_read_message_id TEXT,
    is_active INTEGER DEFAULT 1,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    status TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    delivered_at INTEGER,
    read_at INTEGER,
    edited_at INTEGER,
    deleted_at INTEGER,
    reply_to TEXT,
    reactions TEXT DEFAULT '[]',
    is_local INTEGER DEFAULT 1,
    encryption TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);`,

  `CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    owner_id TEXT NOT NULL,
    settings TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    invited_by TEXT,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS file_transfers (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    local_path TEXT NOT NULL,
    remote_path TEXT,
    status TEXT NOT NULL,
    progress REAL DEFAULT 0,
    chunks_total INTEGER DEFAULT 0,
    chunks_transferred INTEGER DEFAULT 0,
    checksum TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    cancelled_at INTEGER,
    error TEXT,
    is_paused INTEGER DEFAULT 0,
    transfer_mode TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_file_transfers_conversation ON file_transfers(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_file_transfers_status ON file_transfers(status);`,

  `CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    initiator_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    connected_at INTEGER,
    ended_at INTEGER,
    duration INTEGER DEFAULT 0,
    quality TEXT,
    network_info TEXT,
    FOREIGN KEY (initiator_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS call_participants (
    call_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    status TEXT NOT NULL,
    audio_enabled INTEGER DEFAULT 1,
    video_enabled INTEGER DEFAULT 1,
    screen_sharing INTEGER DEFAULT 0,
    joined_at INTEGER,
    left_at INTEGER,
    quality TEXT,
    rtt INTEGER,
    PRIMARY KEY (call_id, user_id),
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS walkie_talkie_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    type TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    settings TEXT NOT NULL,
    current_speaker TEXT,
    is_priority INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS channel_members (
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    is_listening INTEGER DEFAULT 0,
    can_speak INTEGER DEFAULT 1,
    PRIMARY KEY (channel_id, user_id),
    FOREIGN KEY (channel_id) REFERENCES walkie_talkie_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS voice_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    local_path TEXT NOT NULL,
    duration INTEGER NOT NULL,
    waveform TEXT,
    status TEXT NOT NULL,
    played_at INTEGER,
    timestamp INTEGER NOT NULL,
    encryption TEXT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS network_peers (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    discovered_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    discovery_method TEXT NOT NULL,
    reachable INTEGER DEFAULT 1,
    latency INTEGER,
    hops INTEGER,
    network_segment TEXT,
    capabilities TEXT NOT NULL,
    is_relay INTEGER DEFAULT 0,
    version TEXT,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_network_peers_reachable ON network_peers(reachable);
  CREATE INDEX IF NOT EXISTS idx_network_peers_network_segment ON network_peers(network_segment);`,

  `CREATE TABLE IF NOT EXISTS pairing_requests (
    id TEXT PRIMARY KEY,
    from_device_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    from_user_name TEXT NOT NULL,
    from_public_key TEXT NOT NULL,
    to_device_id TEXT,
    to_user_id TEXT,
    code TEXT NOT NULL,
    qr_data TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY (from_device_id) REFERENCES devices(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS trusted_devices (
    device_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    public_key TEXT NOT NULL,
    trusted_at INTEGER NOT NULL,
    last_verified INTEGER NOT NULL,
    is_revoked INTEGER DEFAULT 0,
    revoked_at INTEGER,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data TEXT,
    timestamp INTEGER NOT NULL,
    read INTEGER DEFAULT 0,
    action_url TEXT
  );`,

  `CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);`,

  `CREATE TABLE IF NOT EXISTS relay_nodes (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    port INTEGER NOT NULL,
    is_enabled INTEGER DEFAULT 1,
    is_trusted INTEGER DEFAULT 0,
    last_connected INTEGER,
    latency INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS discovery_records (
    id TEXT PRIMARY KEY,
    peer_id TEXT NOT NULL,
    method TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    success INTEGER DEFAULT 1,
    latency INTEGER,
    FOREIGN KEY (peer_id) REFERENCES network_peers(id)
  );`,
];

export const MIGRATIONS: Record<number, string[]> = {};

export function getMigrationSql(version: number): string[] {
  return MIGRATIONS[version] || [];
}