
-- Add push_token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create custom_notifications table for storing notification history
CREATE TABLE IF NOT EXISTS custom_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'custom' CHECK (notification_type IN ('custom', 'spin_wheel', 'birthday', 'reminder')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on custom_notifications
ALTER TABLE custom_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_notifications
CREATE POLICY "Users can view own notifications" ON custom_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON custom_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON custom_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all notifications" ON custom_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_custom_notifications_user_id ON custom_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_notifications_created_at ON custom_notifications(created_at DESC);
