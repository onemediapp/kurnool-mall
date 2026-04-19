-- Create service_providers table for service provider profiles
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  image_url TEXT,
  address TEXT,
  rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX idx_service_providers_category_id ON service_providers(category_id);
CREATE INDEX idx_service_providers_verified ON service_providers(verified);
CREATE INDEX idx_service_providers_is_active ON service_providers(is_active);
CREATE INDEX idx_service_providers_rating ON service_providers(rating DESC);

-- Add comment
COMMENT ON TABLE service_providers IS 'Service provider profiles with ratings and verification status';
