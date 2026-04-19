-- Create subcategories table for drill-down filtering
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_te TEXT, -- Telugu name
  slug TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, slug)
);

-- Create indexes for performance
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_is_active ON subcategories(is_active);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);

-- Add comment
COMMENT ON TABLE subcategories IS 'Third-level taxonomy for detailed product/service categorization';
