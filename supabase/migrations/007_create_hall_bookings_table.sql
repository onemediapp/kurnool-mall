-- Create hall_bookings table for function hall reservations
CREATE TABLE IF NOT EXISTS hall_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES function_halls(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  num_guests INTEGER NOT NULL CHECK (num_guests > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price > 0),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  event_type TEXT,
  special_requirements TEXT,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX idx_hall_bookings_hall_id ON hall_bookings(hall_id);
CREATE INDEX idx_hall_bookings_customer_id ON hall_bookings(customer_id);
CREATE INDEX idx_hall_bookings_status ON hall_bookings(status);
CREATE INDEX idx_hall_bookings_booking_date ON hall_bookings(booking_date);
CREATE INDEX idx_hall_bookings_created_at ON hall_bookings(created_at DESC);

-- Add comment
COMMENT ON TABLE hall_bookings IS 'Function hall reservation bookings with status and reviews';
