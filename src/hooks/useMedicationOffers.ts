import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type MedicationOffer = Database['public']['Tables']['medication_offers']['Row'] & {
  hospitals: Database['public']['Tables']['hospitals']['Row'];
  medication_name?: string;
};

interface CreateOfferData {
  hospital_id: string;
  medication_name: string;
  generic_name?: string;
  dosage?: string;
  form?: string;
  manufacturer?: string;
  category?: string;
  requires_refrigeration?: boolean;
  controlled_substance?: boolean;
  quantity_available: number;
  price_per_unit?: number;
  expiration_date: string;
  conditions: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  valid_until: string;
}

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

  const createOffer = async (offerData: CreateOfferData) => {
    try {
      // First, check if medication exists or create it
      let medicationId: string;
      
      // Try to find existing medication by name
      const { data: existingMedication, error: searchError } = await supabase
        .from('medications')
        .select('id')
        .eq('name', offerData.medication_name)
        .single();

      if (existingMedication) {
        medicationId = existingMedication.id;
      } else {
        // Create new medication
        const { data: newMedication, error: createMedError } = await supabase
          .from('medications')
          .insert([{
            name: offerData.medication_name,
            generic_name: offerData.generic_name || offerData.medication_name,
            dosage: offerData.dosage || 'N/A',
            form: offerData.form || 'tablet',
            manufacturer: offerData.manufacturer || 'N/A',
            category: offerData.category || 'other',
            requires_refrigeration: offerData.requires_refrigeration || false,
            controlled_substance: offerData.controlled_substance || false
          }])
          .select('id')
          .single();

        if (createMedError) throw createMedError;
        medicationId = newMedication.id;
      }

      // Now create the offer with the valid medication ID
      const { data, error } = await supabase
        .from('medication_offers')
        .insert([{
          hospital_id: offerData.hospital_id,
          medication_id: medicationId,
          quantity_available: offerData.quantity_available,
          price_per_unit: offerData.price_per_unit,
          expiration_date: offerData.expiration_date,
          conditions: offerData.conditions,
          contact_person: offerData.contact_person,
          contact_phone: offerData.contact_phone,
          contact_email: offerData.contact_email,
          valid_until: offerData.valid_until,
          medication_name: offerData.medication_name
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

  useEffect(() => {
    fetchOffers();
  }, []);

  const updateOffer = async (id: string, updates: Database['public']['Tables']['medication_offers']['Update']) => {
    try {
      const { data, error } = await supabase
        .from('medication_offers')
        .update(updates)
        .eq('id', id)
        .select()
        

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