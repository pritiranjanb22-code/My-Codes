import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.username,
  password: config.database.password,
  database: config.database.name,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const getClient = () => pool.connect();

export const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Users
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(500),
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Trips
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        start_location JSONB NOT NULL,
        end_location JSONB NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'planning',
        owner_id UUID REFERENCES users(id) NOT NULL,
        budget DECIMAL(12,2),
        currency VARCHAR(3) DEFAULT 'INR',
        trip_code VARCHAR(6) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Trip Members
      CREATE TABLE IF NOT EXISTS trip_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        vehicle_id UUID,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        location_sharing BOOLEAN DEFAULT FALSE,
        UNIQUE(trip_id, user_id)
      );

      -- Vehicles
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(50) NOT NULL,
        registration_number VARCHAR(20) NOT NULL,
        fuel_type VARCHAR(20) NOT NULL,
        tank_capacity DECIMAL(6,2),
        current_mileage DECIMAL(10,2),
        driver_id UUID REFERENCES users(id) NOT NULL,
        fuel_level DECIMAL(5,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Vehicle Members
      CREATE TABLE IF NOT EXISTS vehicle_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        is_driver BOOLEAN DEFAULT FALSE,
        UNIQUE(vehicle_id, user_id)
      );

      -- Itinerary Stops
      CREATE TABLE IF NOT EXISTS itinerary_stops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        stop_order INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        location JSONB NOT NULL,
        arrival_time TIMESTAMP WITH TIME ZONE,
        departure_time TIMESTAMP WITH TIME ZONE,
        duration INTEGER,
        notes TEXT,
        photos JSONB DEFAULT '[]',
        expenses JSONB DEFAULT '[]',
        activities JSONB DEFAULT '[]',
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Expenses
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        category VARCHAR(30) NOT NULL,
        description TEXT NOT NULL,
        paid_by UUID REFERENCES users(id) NOT NULL,
        participants JSONB NOT NULL,
        split_type VARCHAR(20) DEFAULT 'equal',
        receipt_url VARCHAR(500),
        receipt_ocr_data JSONB,
        vehicle_id UUID REFERENCES vehicles(id),
        stop_id UUID REFERENCES itinerary_stops(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Settlements
      CREATE TABLE IF NOT EXISTS settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        from_user_id UUID REFERENCES users(id) NOT NULL,
        to_user_id UUID REFERENCES users(id) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(20),
        payment_reference VARCHAR(100),
        payment_screenshot VARCHAR(500),
        confirmed_by UUID REFERENCES users(id),
        confirmed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Trip Wallet
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL UNIQUE,
        total_contributed DECIMAL(12,2) DEFAULT 0,
        spent DECIMAL(12,2) DEFAULT 0,
        remaining DECIMAL(12,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'INR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Wallet Transactions
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Fuel Entries
      CREATE TABLE IF NOT EXISTS fuel_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
        fuel_type VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        litres DECIMAL(8,2) NOT NULL,
        price_per_litre DECIMAL(8,2) NOT NULL,
        odometer DECIMAL(10,2) NOT NULL,
        mileage DECIMAL(6,2),
        paid_by UUID REFERENCES users(id) NOT NULL,
        receipt_url VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Toll Entries
      CREATE TABLE IF NOT EXISTS toll_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        location JSONB NOT NULL,
        name VARCHAR(100) NOT NULL,
        paid_by UUID REFERENCES users(id) NOT NULL,
        receipt_url VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Checklists
      CREATE TABLE IF NOT EXISTS checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Checklist Items
      CREATE TABLE IF NOT EXISTS checklist_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE NOT NULL,
        text TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_by UUID REFERENCES users(id),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Messages
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        type VARCHAR(20) DEFAULT 'text',
        content TEXT NOT NULL,
        media_url VARCHAR(500),
        voice_duration INTEGER,
        location JSONB,
        expense_id UUID REFERENCES expenses(id),
        poll_id UUID,
        reply_to_id UUID REFERENCES messages(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Polls
      CREATE TABLE IF NOT EXISTS polls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        is_closed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Poll Votes
      CREATE TABLE IF NOT EXISTS poll_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        option_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Media
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        type VARCHAR(10) NOT NULL,
        url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        location JSONB,
        stop_id UUID REFERENCES itinerary_stops(id),
        day INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Emergency Events
      CREATE TABLE IF NOT EXISTS emergency_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        type VARCHAR(30) NOT NULL,
        location JSONB NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        notified_members JSONB DEFAULT '[]',
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Trip Events (Timeline)
      CREATE TABLE IF NOT EXISTS trip_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        type VARCHAR(30) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        user_id UUID REFERENCES users(id),
        location JSONB,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Budgets
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL UNIQUE,
        total_budget DECIMAL(12,2) NOT NULL,
        per_person_budget DECIMAL(12,2),
        currency VARCHAR(3) DEFAULT 'INR',
        alert_threshold DECIMAL(3,2) DEFAULT 0.8,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Location Sessions
      CREATE TABLE IF NOT EXISTS location_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        vehicle_id UUID REFERENCES vehicles(id),
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        accuracy DECIMAL(8,2),
        speed DECIMAL(6,2),
        heading DECIMAL(6,2),
        altitude DECIMAL(8,2),
        battery_level INTEGER,
        is_sharing BOOLEAN DEFAULT TRUE,
        share_mode VARCHAR(20) DEFAULT 'during_trip',
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_trips_owner ON trips(owner_id);
      CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
      CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
      CREATE INDEX IF NOT EXISTS idx_settlements_trip ON settlements(trip_id);
      CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id);
      CREATE INDEX IF NOT EXISTS idx_location_sessions_trip ON location_sessions(trip_id);
      CREATE INDEX IF NOT EXISTS idx_emergency_trip ON emergency_events(trip_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_trip_events_trip ON trip_events(trip_id);
    `);
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;