/*
  # Enable Realtime Publications for Notification System

  1. Updates
    - Safely add tables to supabase_realtime publication
    - Handle cases where tables are already in the publication
    - Grant necessary permissions for realtime access

  2. Tables Added to Realtime
    - notifications
    - medication_requests
    - medication_offers
    - medication_responses
    - hospitals
*/

-- Function to safely add table to realtime publication
DO $$
BEGIN
  -- Add notifications table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Added notifications table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Notifications table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add notifications to realtime: %', SQLERRM;
  END;

  -- Add medication_requests table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE medication_requests;
    RAISE NOTICE 'Added medication_requests table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Medication_requests table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add medication_requests to realtime: %', SQLERRM;
  END;

  -- Add medication_offers table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE medication_offers;
    RAISE NOTICE 'Added medication_offers table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Medication_offers table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add medication_offers to realtime: %', SQLERRM;
  END;

  -- Add medication_responses table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE medication_responses;
    RAISE NOTICE 'Added medication_responses table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Medication_responses table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add medication_responses to realtime: %', SQLERRM;
  END;

  -- Add hospitals table to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;
    RAISE NOTICE 'Added hospitals table to realtime publication';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Hospitals table already in realtime publication';
    WHEN OTHERS THEN
      RAISE WARNING 'Could not add hospitals to realtime: %', SQLERRM;
  END;
END $$;

-- Grant necessary permissions for realtime (only if not already granted)
DO $$
BEGIN
  -- Grant SELECT permissions for authenticated users
  BEGIN
    GRANT SELECT ON notifications TO authenticated;
    RAISE NOTICE 'Granted SELECT on notifications to authenticated';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'SELECT permission on notifications already exists or could not be granted: %', SQLERRM;
  END;

  BEGIN
    GRANT SELECT ON medication_requests TO authenticated;
    RAISE NOTICE 'Granted SELECT on medication_requests to authenticated';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'SELECT permission on medication_requests already exists or could not be granted: %', SQLERRM;
  END;

  BEGIN
    GRANT SELECT ON medication_offers TO authenticated;
    RAISE NOTICE 'Granted SELECT on medication_offers to authenticated';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'SELECT permission on medication_offers already exists or could not be granted: %', SQLERRM;
  END;

  BEGIN
    GRANT SELECT ON medication_responses TO authenticated;
    RAISE NOTICE 'Granted SELECT on medication_responses to authenticated';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'SELECT permission on medication_responses already exists or could not be granted: %', SQLERRM;
  END;

  BEGIN
    GRANT SELECT ON hospitals TO authenticated;
    RAISE NOTICE 'Granted SELECT on hospitals to authenticated';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'SELECT permission on hospitals already exists or could not be granted: %', SQLERRM;
  END;
END $$;

-- Verify realtime configuration
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Count tables in realtime publication
  SELECT COUNT(*) INTO table_count
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime' 
  AND schemaname = 'public'
  AND tablename IN ('notifications', 'medication_requests', 'medication_offers', 'medication_responses', 'hospitals');
  
  RAISE NOTICE 'Realtime publication now includes % relevant tables', table_count;
  
  IF table_count >= 5 THEN
    RAISE NOTICE '✅ Realtime configuration completed successfully';
  ELSE
    RAISE WARNING '⚠️ Some tables may not be properly configured for realtime';
  END IF;
END $$;