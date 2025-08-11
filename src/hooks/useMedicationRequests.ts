import { useState, useEffect } from 'react';
import { useNotifications } from './useNotifications'; // 👈 asegúrate de que la ruta sea correcta
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type MedicationRequest = Database['public']['Tables']['medication_requests']['Row'] & {
  hospitals: Database['public']['Tables']['hospitals']['Row'];
};

export const useMedicationRequests = () => {
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshNotifications } = useNotifications();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medication_requests')
        .select(`
          *,
          hospitals (
            id,
            name,
            city,
            state,
            phone,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching medication requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

 const createRequest = async (requestData: Database['public']['Tables']['medication_requests']['Insert']) => {
  try {
    const { data, error } = await supabase
      .from('medication_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) throw error;

   refreshNotifications();


    setTimeout(fetchRequests, 500);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error creating request' };
  }
};

    
  const updateRequest = async (id: string, updates: Database['public']['Tables']['medication_requests']['Update']) => {
    try {
      const { data, error } = await supabase
        .from('medication_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchRequests();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Error updating request' };
    }
  };

  return {
    requests,
    loading,
    error,
    createRequest,
    updateRequest,
    refetch: fetchRequests,
  };
};
