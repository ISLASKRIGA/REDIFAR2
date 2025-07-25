import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type MedicationRequest = Database['public']['Tables']['medication_requests']['Row'] & {
  hospitals: Database['public']['Tables']['hospitals']['Row'];
  medications: Database['public']['Tables']['medications']['Row'];
};

export const useMedicationRequests = () => {
  const [requests, setRequests] = useState<MedicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          ),
          medications (
            id,
            name,
            generic_name,
            dosage,
            form,
            manufacturer,
            category,
            requires_refrigeration,
            controlled_substance
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
      // First, ensure the medication exists or create it
      const { data: existingMedication } = await supabase
        .from('medications')
        .select('id')
        .eq('name', requestData.medication_id) // Assuming medication_id is actually the name for now
        .maybeSingle();

      let medicationId = existingMedication?.id;
      
      if (!medicationId) {
        // Create the medication if it doesn't exist
        const { data: newMedication, error: medError } = await supabase
          .from('medications')
          .insert([{
            name: requestData.medication_id as string,
            generic_name: requestData.medication_id as string,
            dosage: '500mg', // Default values - should be from form
            form: 'tablet',
            manufacturer: 'Unknown',
            category: 'other'
          }])
          .select()
          .single();
      }

      const { data, error } = await supabase
        .from('medication_requests')
        .insert([{
          ...requestData,
          medication_id: medicationId
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Force refresh after a short delay to ensure triggers have fired
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
      await fetchRequests(); // Refresh the list
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