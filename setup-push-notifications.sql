
-- Add push_token column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE users ADD COLUMN push_token TEXT;
  END IF;
END $$;

-- Create custom_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'custom',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Enable RLS on custom_notifications
ALTER TABLE custom_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON custom_notifications;
CREATE POLICY "Users can view their own notifications" 
  ON custom_notifications 
  FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON custom_notifications;
CREATE POLICY "Users can update their own notifications" 
  ON custom_notifications 
  FOR UPDATE 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can insert notifications" ON custom_notifications;
CREATE POLICY "Admins can insert notifications" 
  ON custom_notifications 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all notifications" ON custom_notifications;
CREATE POLICY "Admins can view all notifications" 
  ON custom_notifications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_notifications_user_id ON custom_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_notifications_created_at ON custom_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- Add comment
COMMENT ON TABLE custom_notifications IS 'Stores push notifications sent to users';
