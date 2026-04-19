-- Create service_bookings table for service appointments
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_service_bookings_customer_id ON service_bookings(customer_id);
CREATE INDEX idx_service_bookings_provider_id ON service_bookings(provider_id);
CREATE INDEX idx_service_bookings_status ON service_bookings(status);
CREATE INDEX idx_service_bookings_booking_date ON service_bookings(booking_date);
CREATE INDEX idx_service_bookings_created_at ON service_bookings(created_at DESC);

-- Add comment
COMMENT ON TABLE service_bookings IS 'Service appointment bookings with status and reviews';
