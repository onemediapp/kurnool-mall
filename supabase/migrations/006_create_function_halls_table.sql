-- Create function_halls table for venue rentals
CREATE TABLE IF NOT EXISTS function_halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT NOT NULL,
  price_per_hour DECIMAL(10, 2) NOT NULL CHECK (price_per_hour > 0),
  amenities JSONB DEFAULT '[]'::jsonb,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_function_halls_category_id ON function_halls(category_id);
CREATE INDEX idx_function_halls_is_active ON function_halls(is_active);
CREATE INDEX idx_function_halls_rating ON function_halls(rating DESC);
CREATE INDEX idx_function_halls_capacity ON function_halls(capacity);

-- Add comment
COMMENT ON TABLE function_halls IS 'Function hall and venue listings with capacity and pricing';
