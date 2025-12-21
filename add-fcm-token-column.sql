
-- Add fcm_token column to users table for Firebase Cloud Messaging
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token);
