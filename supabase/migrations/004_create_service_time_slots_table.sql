-- Create service_time_slots table for provider availability
CREATE TABLE IF NOT EXISTS service_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX idx_service_time_slots_provider_id ON service_time_slots(provider_id);
CREATE INDEX idx_service_time_slots_day_of_week ON service_time_slots(day_of_week);
CREATE INDEX idx_service_time_slots_available ON service_time_slots(available);

-- Add comment
COMMENT ON TABLE service_time_slots IS 'Provider availability slots by day of week';
COMMENT ON COLUMN service_time_slots.day_of_week IS '0=Monday, 1=Tuesday, ..., 6=Sunday';
