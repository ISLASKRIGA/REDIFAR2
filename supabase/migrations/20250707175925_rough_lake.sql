/*
  # Fix Notifications System for Real-time Broadcasting

  1. Create proper notification broadcast function
  2. Add triggers for automatic notifications
  3. Fix RLS policies for proper access
  4. Add notification history table
*/

-- Create notifications table for history
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('request', 'offer', 'response')),
  title text NOT NULL,
  message text NOT NULL,
  hospital_name text NOT NULL,
  medication_name text NOT NULL,
  urgency text,
  related_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read notifications
CREATE POLICY "All users can read notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow system to insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to send notification to all users
CREATE OR REPLACE FUNCTION notify_all_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_data jsonb;
  hospital_name text;
  medication_name text;
  notification_title text;
  notification_message text;
  notification_type text;
  urgency_level text;
BEGIN
  -- Handle medication requests
  IF TG_TABLE_NAME = 'medication_requests' AND TG_OP = 'INSERT' THEN
    -- Get hospital and medication names
    SELECT h.name, m.name INTO hospital_name, medication_name
    FROM hospitals h, medications m
    WHERE h.id = NEW.hospital_id AND m.id = NEW.medication_id;
    
    notification_type := 'request';
    notification_title := '🚨 Nueva Solicitud de Medicamento';
    urgency_level := NEW.urgency;
    
    IF NEW.urgency = 'critical' THEN
      notification_message := hospital_name || ' solicita URGENTEMENTE ' || medication_name || ' (CRÍTICO)';
    ELSE
      notification_message := hospital_name || ' solicita ' || medication_name || ' (' || UPPER(NEW.urgency) || ')';
    END IF;
    
    -- Insert notification record
    INSERT INTO notifications (type, title, message, hospital_name, medication_name, urgency, related_id)
    VALUES (notification_type, notification_title, notification_message, hospital_name, medication_name, urgency_level, NEW.id);
    
  -- Handle medication offers
  ELSIF TG_TABLE_NAME = 'medication_offers' AND TG_OP = 'INSERT' THEN
    -- Get hospital and medication names
    SELECT h.name, m.name INTO hospital_name, medication_name
    FROM hospitals h, medications m
    WHERE h.id = NEW.hospital_id AND m.id = NEW.medication_id;
    
    notification_type := 'offer';
    notification_title := '💊 Nueva Oferta de Medicamento';
    notification_message := hospital_name || ' ofrece ' || medication_name || ' (' || NEW.quantity_available || ' unidades)';
    
    -- Insert notification record
    INSERT INTO notifications (type, title, message, hospital_name, medication_name, related_id)
    VALUES (notification_type, notification_title, notification_message, hospital_name, medication_name, NEW.id);
  END IF;
  
  -- Create notification payload
  notification_data := jsonb_build_object(
    'id', gen_random_uuid(),
    'type', notification_type,
    'title', notification_title,
    'message', notification_message,
    'hospitalName', hospital_name,
    'medicationName', medication_name,
    'urgency', urgency_level,
    'timestamp', extract(epoch from now()) * 1000,
    'relatedId', COALESCE(NEW.id, OLD.id)
  );
  
  -- Broadcast notification using pg_notify
  PERFORM pg_notify('medication_notifications', notification_data::text);
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_medication_request ON medication_requests;
DROP TRIGGER IF EXISTS trigger_notify_medication_offer ON medication_offers;

-- Create triggers for automatic notifications
CREATE TRIGGER trigger_notify_medication_request
  AFTER INSERT ON medication_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_all_users();

CREATE TRIGGER trigger_notify_medication_offer
  AFTER INSERT ON medication_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_all_users();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);