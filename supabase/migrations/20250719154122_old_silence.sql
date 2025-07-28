/*
  # User-specific notification management

  1. New Tables
    - `user_notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `notification_id` (uuid, foreign key to notifications)
      - `is_read` (boolean, default false)
      - `is_dismissed` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_notifications` table
    - Add policy for users to manage their own notification states
*/

CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification states"
  ON user_notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_id ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_dismissed ON user_notifications(user_id, is_dismissed);

-- Function to automatically create user notification entries when a new notification is created
CREATE OR REPLACE FUNCTION create_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user notification entries for all authenticated users
  INSERT INTO user_notifications (user_id, notification_id)
  SELECT id, NEW.id
  FROM auth.users
  WHERE id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create user notification entries
DROP TRIGGER IF EXISTS trigger_create_user_notifications ON notifications;
CREATE TRIGGER trigger_create_user_notifications
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notifications();