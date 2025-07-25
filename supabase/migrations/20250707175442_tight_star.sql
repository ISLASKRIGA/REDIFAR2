/*
  # Add notification broadcasting functionality

  1. New Functions
    - `broadcast_notification` - Function to broadcast notifications to all connected clients
    
  2. New Tables
    - `user_notification_tokens` - Store push notification tokens for users
    
  3. Security
    - Enable RLS on notification tokens table
    - Add policies for users to manage their own tokens
*/

-- Create user notification tokens table
CREATE TABLE IF NOT EXISTS user_notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_type text DEFAULT 'web',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE user_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own notification tokens"
  ON user_notification_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to broadcast notifications
CREATE OR REPLACE FUNCTION broadcast_notification(notification_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification via pg_notify to all connected clients
  PERFORM pg_notify('notifications', notification_data::text);
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_notification_tokens_user_id ON user_notification_tokens(user_id);