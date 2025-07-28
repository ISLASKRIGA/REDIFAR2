import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Hospital = Database['public']['Tables']['hospitals']['Row'];

export const useHospitals = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setHospitals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const createHospital = async (hospitalData: Database['public']['Tables']['hospitals']['Insert']) => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .insert([hospitalData])
        .select()
        .single();

      if (error) throw error;
      await fetchHospitals(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Error creating hospital' };
    }
  };

  const updateHospital = async (id: string, updates: Database['public']['Tables']['hospitals']['Update']) => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchHospitals(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Error updating hospital' };
    }
  };

  return {
    hospitals,
    loading,
    error,
    createHospital,
    updateHospital,
    refetch: fetchHospitals,
  };
};