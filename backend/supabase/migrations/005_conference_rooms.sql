-- Conference rooms + hourly bookings (9:00–20:00 local day, one row per hour slot)
-- Run in Supabase SQL Editor after prior migrations, or as a new migration.

-- Master: rooms
CREATE TABLE IF NOT EXISTS conference_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking header
CREATE TABLE IF NOT EXISTS conference_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES conference_rooms(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booked_by TEXT NOT NULL,
  purpose TEXT,
  -- Must match existing visits.id type in this DB (integer)
  visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per claimed hour; prevents double booking for same room + date + hour
CREATE TABLE IF NOT EXISTS conference_booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES conference_bookings(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES conference_rooms(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  slot_hour INTEGER NOT NULL CHECK (slot_hour >= 9 AND slot_hour <= 20),
  UNIQUE (room_id, booking_date, slot_hour)
);

CREATE INDEX IF NOT EXISTS idx_conference_bookings_room_date
  ON conference_bookings (room_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_conference_booking_slots_lookup
  ON conference_booking_slots (room_id, booking_date);

-- Seed: three rooms (A=4, B=4, C=7) — safe to re-run
INSERT INTO conference_rooms (name, capacity, is_active)
VALUES
  ('A', 4, true),
  ('B', 4, true),
  ('C', 7, true)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE conference_rooms IS 'Conference room master';
COMMENT ON TABLE conference_bookings IS 'A booking can span multiple hours via conference_booking_slots';
COMMENT ON COLUMN conference_booking_slots.slot_hour IS 'Start hour 9..20 (9:00 = 9, last block 20:00–21:00)';
