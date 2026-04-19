-- Create category_vendor_assignments table for vendor-category mapping
CREATE TABLE IF NOT EXISTS category_vendor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, category_id, COALESCE(subcategory_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Create indexes
CREATE INDEX idx_category_vendor_assignments_vendor_id ON category_vendor_assignments(vendor_id);
CREATE INDEX idx_category_vendor_assignments_category_id ON category_vendor_assignments(category_id);
CREATE INDEX idx_category_vendor_assignments_subcategory_id ON category_vendor_assignments(subcategory_id);

-- Add comment
COMMENT ON TABLE category_vendor_assignments IS 'Many-to-many mapping of vendors to categories and subcategories';
