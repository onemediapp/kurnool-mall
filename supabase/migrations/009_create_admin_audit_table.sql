-- Create admin_audit table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for queries and retention
CREATE INDEX idx_admin_audit_admin_id ON admin_audit(admin_id);
CREATE INDEX idx_admin_audit_entity_type ON admin_audit(entity_type);
CREATE INDEX idx_admin_audit_entity_id ON admin_audit(entity_id);
CREATE INDEX idx_admin_audit_created_at ON admin_audit(created_at DESC);
CREATE INDEX idx_admin_audit_action ON admin_audit(action);

-- Add comment
COMMENT ON TABLE admin_audit IS 'Comprehensive audit log of all admin actions for compliance and debugging';
COMMENT ON COLUMN admin_audit.changes IS 'JSON object storing before/after values for changed fields';
