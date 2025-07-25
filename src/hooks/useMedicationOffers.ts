import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type MedicationOffer = Database['public']['Tables']['medication_offers']['Row'] & {
  hospitals: Database['public']['Tables']['hospitals']['Row'];
  medications: Database['public']['Tables']['medications']['Row'];
};

export const useMedicationOffers = () => {
  const [offers, setOffers] = useState<MedicationOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medication_offers')
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
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching medication offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const createOffer = async (offerData: Database['public']['Tables']['medication_offers']['Insert']) => {
    try {
      // First, ensure the medication exists or create it
      const { data: existingMedication } = await supabase
        .from('medications')
        .select('id')
        .eq('name', offerData.medication_id) // Assuming medication_id is actually the name for now
        .maybeSingle();

      let medicationId = existingMedication?.id;
      
      if (!medicationId) {
        // Create the medication if it doesn't exist
        const { data: newMedication, error: medError } = await supabase
          .from('medications')
          .insert([{
            name: offerData.medication_id as string,
            generic_name: offerData.medication_id as string,
            dosage: '500mg', // Default values - should be from form
            form: 'tablet',
            manufacturer: 'Unknown',
            category: 'other'
          }])
          .select()
          .single();
      }

      const { data, error } = await supabase
        .from('medication_offers')
        .insert([{
          ...offerData,
          medication_id: medicationId
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Force refresh after a short delay to ensure triggers have fired
      setTimeout(fetchOffers, 500);
      
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Error creating offer' };
    }
  };

  const updateOffer = async (id: string, updates: Database['public']['Tables']['medication_offers']['Update']) => {
    try {
      const { data, error } = await supabase
        .from('medication_offers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchOffers(); // Refresh the list
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Error updating offer' };
    }
  };

  return {
    offers,
    loading,
    error,
    createOffer,
    updateOffer,
    refetch: fetchOffers,
  };
};