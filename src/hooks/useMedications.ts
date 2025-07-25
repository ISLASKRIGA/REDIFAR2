import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Medication = Database['public']['Tables']['medications']['Row'];

export const useMedications = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name');

      if (error) throw error;
      setMedications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching medications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const createMedication = async (medicationData: Database['public']['Tables']['medications']['Insert']) => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .insert([medicationData])
        .select()
        .single();

      if (error) throw error;
      await fetchMedications(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Error creating medication' };
    }
  };

  return {
    medications,
    loading,
    error,
    createMedication,
    refetch: fetchMedications,
  };
};