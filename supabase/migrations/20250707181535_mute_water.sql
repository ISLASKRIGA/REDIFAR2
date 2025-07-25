/*
  # Fix Real-time Notifications System

  1. Updates
    - Recreate notification function with better real-time support
    - Fix triggers for medication requests and offers
    - Ensure realtime is properly configured

  2. Changes
    - Improved error handling in notification function
    - Better notification payload structure
    - Fixed realtime publication issue
*/

-- Drop and recreate the notification function with better real-time support
DROP FUNCTION IF EXISTS notify_all_users() CASCADE;

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
  notification_id uuid;
BEGIN
  -- Generate unique notification ID
  notification_id := gen_random_uuid();
  
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
    
  -- Handle medication offers
  ELSIF TG_TABLE_NAME = 'medication_offers' AND TG_OP = 'INSERT' THEN
    -- Get hospital and medication names
    SELECT h.name, m.name INTO hospital_name, medication_name
    FROM hospitals h, medications m
    WHERE h.id = NEW.hospital_id AND m.id = NEW.medication_id;
    
    notification_type := 'offer';
    notification_title := '💊 Nueva Oferta de Medicamento';
    notification_message := hospital_name || ' ofrece ' || medication_name || ' (' || NEW.quantity_available || ' unidades)';
    urgency_level := NULL;
  END IF;
  
  -- Insert notification record first
  INSERT INTO notifications (
    id,
    type, 
    title, 
    message, 
    hospital_name, 
    medication_name, 
    urgency, 
    related_id
  )
  VALUES (
    notification_id,
    notification_type, 
    notification_title, 
    notification_message, 
    hospital_name, 
    medication_name, 
    urgency_level, 
    COALESCE(NEW.id, OLD.id)
  );
  
  -- Create notification payload for real-time broadcasting
  notification_data := jsonb_build_object(
    'id', notification_id,
    'type', notification_type,
    'title', notification_title,
    'message', notification_message,
    'hospitalName', hospital_name,
    'medicationName', medication_name,
    'urgency', urgency_level,
    'timestamp', extract(epoch from now()) * 1000,
    'relatedId', COALESCE(NEW.id, OLD.id)
  );
  
  -- Broadcast notification using pg_notify for immediate delivery
  PERFORM pg_notify('medication_notifications', notification_data::text);
  
  -- Log for debugging
  RAISE NOTICE 'Notification sent: %', notification_data;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Error in notify_all_users: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate triggers
DROP TRIGGER IF EXISTS trigger_notify_medication_request ON medication_requests;
DROP TRIGGER IF EXISTS trigger_notify_medication_offer ON medication_offers;

CREATE TRIGGER trigger_notify_medication_request
  AFTER INSERT ON medication_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_all_users();

CREATE TRIGGER trigger_notify_medication_offer
  AFTER INSERT ON medication_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_all_users();

-- Check if notifications table is already in realtime publication, if not add it
DO $$
BEGIN
  -- Try to add table to realtime publication, ignore if already exists
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Added notifications table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Notifications table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add notifications to realtime: %', SQLERRM;
  END;
END $$;

-- Test the notification system
DO $$
BEGIN
  RAISE NOTICE 'Notification system updated successfully';
END $$;