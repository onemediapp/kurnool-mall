-- Create sections table for top-level categorization
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_te TEXT, -- Telugu name
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shopping', 'services')),
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on type for faster queries
CREATE INDEX idx_sections_type ON sections(type);
CREATE INDEX idx_sections_slug ON sections(slug);
CREATE INDEX idx_sections_is_active ON sections(is_active);

-- Add comment
COMMENT ON TABLE sections IS 'Top-level sections (Shopping, Services)';
