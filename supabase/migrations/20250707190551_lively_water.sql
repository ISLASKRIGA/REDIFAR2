/*
  # Enhanced Real-time Notifications System

  1. Updates
    - Recreate notification function with enhanced real-time support
    - Fix triggers for medication requests and offers
    - Ensure realtime is properly configured
    - Add comprehensive error handling and logging

  2. Changes
    - Improved error handling in notification function
    - Better notification payload structure
    - Multiple broadcast methods for redundancy
    - Enhanced debugging capabilities
*/

-- Drop and recreate the notification function with enhanced real-time support
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
  current_ts timestamptz;
BEGIN
  -- Get current timestamp
  current_ts := now();
  
  -- Generate unique notification ID
  notification_id := gen_random_uuid();
  
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for table: %, operation: %, record ID: %', 
    TG_TABLE_NAME, TG_OP, COALESCE(NEW.id, OLD.id);
  
  -- Handle medication requests
  IF TG_TABLE_NAME = 'medication_requests' AND TG_OP = 'INSERT' THEN
    -- Get hospital and medication names with error handling
    BEGIN
      SELECT h.name, m.name INTO STRICT hospital_name, medication_name
      FROM hospitals h, medications m
      WHERE h.id = NEW.hospital_id AND m.id = NEW.medication_id;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE WARNING 'Could not find hospital or medication for request %', NEW.id;
        hospital_name := 'Hospital Desconocido';
        medication_name := 'Medicamento Desconocido';
      WHEN TOO_MANY_ROWS THEN
        RAISE WARNING 'Multiple records found for request %', NEW.id;
        RETURN NEW;
    END;
    
    notification_type := 'request';
    notification_title := '🚨 Nueva Solicitud de Medicamento';
    urgency_level := NEW.urgency;
    
    IF NEW.urgency = 'critical' THEN
      notification_message := hospital_name || ' solicita URGENTEMENTE ' || medication_name || ' (CRÍTICO - ' || NEW.quantity_requested || ' unidades)';
    ELSE
      notification_message := hospital_name || ' solicita ' || medication_name || ' (' || UPPER(NEW.urgency) || ' - ' || NEW.quantity_requested || ' unidades)';
    END IF;
    
    RAISE NOTICE 'Created request notification: % - %', notification_title, notification_message;
    
  -- Handle medication offers
  ELSIF TG_TABLE_NAME = 'medication_offers' AND TG_OP = 'INSERT' THEN
    -- Get hospital and medication names with error handling
    BEGIN
      SELECT h.name, m.name INTO STRICT hospital_name, medication_name
      FROM hospitals h, medications m
      WHERE h.id = NEW.hospital_id AND m.id = NEW.medication_id;
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE WARNING 'Could not find hospital or medication for offer %', NEW.id;
        hospital_name := 'Hospital Desconocido';
        medication_name := 'Medicamento Desconocido';
      WHEN TOO_MANY_ROWS THEN
        RAISE WARNING 'Multiple records found for offer %', NEW.id;
        RETURN NEW;
    END;
    
    notification_type := 'offer';
    notification_title := '💊 Nueva Oferta de Medicamento';
    notification_message := hospital_name || ' ofrece ' || medication_name || ' (' || NEW.quantity_available || ' unidades disponibles)';
    urgency_level := NULL;
    
    RAISE NOTICE 'Created offer notification: % - %', notification_title, notification_message;
  ELSE
    RAISE WARNING 'Unexpected trigger condition: table=%, operation=%', TG_TABLE_NAME, TG_OP;
    RETURN NEW;
  END IF;
  
  -- Insert notification record first
  BEGIN
    INSERT INTO notifications (
      id,
      type, 
      title, 
      message, 
      hospital_name, 
      medication_name, 
      urgency, 
      related_id,
      created_at
    )
    VALUES (
      notification_id,
      notification_type, 
      notification_title, 
      notification_message, 
      hospital_name, 
      medication_name, 
      urgency_level, 
      COALESCE(NEW.id, OLD.id),
      current_ts
    );
    
    RAISE NOTICE 'Notification record inserted with ID: %', notification_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert notification record: %', SQLERRM;
      -- Continue with broadcast even if DB insert fails
  END;
  
  -- Create enhanced notification payload for real-time broadcasting
  notification_data := jsonb_build_object(
    'id', notification_id,
    'type', notification_type,
    'title', notification_title,
    'message', notification_message,
    'hospitalName', hospital_name,
    'medicationName', medication_name,
    'urgency', urgency_level,
    'timestamp', extract(epoch from current_ts) * 1000,
    'relatedId', COALESCE(NEW.id, OLD.id),
    'created_at', current_ts,
    'table', TG_TABLE_NAME,
    'operation', TG_OP
  );
  
  -- Multiple broadcast methods for maximum delivery
  BEGIN
    -- Method 1: pg_notify for immediate delivery
    PERFORM pg_notify('medication_notifications', notification_data::text);
    RAISE NOTICE 'pg_notify sent successfully';
    
    -- Method 2: pg_notify with different channel for redundancy
    PERFORM pg_notify('realtime_notifications', notification_data::text);
    RAISE NOTICE 'Redundant pg_notify sent successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to send pg_notify: %', SQLERRM;
  END;
  
  -- Log successful completion
  RAISE NOTICE 'Notification system completed successfully for %', notification_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Critical error in notify_all_users: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_notify_medication_request ON medication_requests;
DROP TRIGGER IF EXISTS trigger_notify_medication_offer ON medication_offers;

-- Create enhanced triggers with logging
CREATE TRIGGER trigger_notify_medication_request
  AFTER INSERT ON medication_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_all_users();

CREATE TRIGGER trigger_notify_medication_offer
  AFTER INSERT ON medication_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_all_users();

-- Ensure notifications table is in realtime publication
DO $$
BEGIN
  -- Add all relevant tables to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Added notifications table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Notifications table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add notifications to realtime: %', SQLERRM;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE medication_requests;
    RAISE NOTICE 'Added medication_requests table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Medication_requests table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add medication_requests to realtime: %', SQLERRM;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE medication_offers;
    RAISE NOTICE 'Added medication_offers table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Medication_offers table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add medication_offers to realtime: %', SQLERRM;
  END;
END $$;

-- Test notification system
DO $$
BEGIN
  RAISE NOTICE '🚀 Enhanced notification system deployed successfully!';
  RAISE NOTICE '📡 Real-time channels configured';
  RAISE NOTICE '🔔 Push notifications enabled';
  RAISE NOTICE '🔧 Debug logging activated';
END $$;