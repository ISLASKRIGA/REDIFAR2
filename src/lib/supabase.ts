import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Should be https://your-project.supabase.co');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'medication-exchange-app'
    }
  }
});

// Test connection on initialization
supabase.from('hospitals').select('count').limit(1).then(
  ({ error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection established successfully');
    }
  }
).catch((error) => {
  console.error('❌ Network error during Supabase connection test:', error.message);
});

// Database types
export interface Database {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          phone: string;
          email: string;
          director: string;
          beds: number;
          type: 'public' | 'private' | 'university';
          specialties: string[];
          status: 'active' | 'inactive';
          verified: boolean;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          city: string;
          state: string;
          phone: string;
          email: string;
          director: string;
          beds?: number;
          type: 'public' | 'private' | 'university';
          specialties?: string[];
          status?: 'active' | 'inactive';
          verified?: boolean;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          phone?: string;
          email?: string;
          director?: string;
          beds?: number;
          type?: 'public' | 'private' | 'university';
          specialties?: string[];
          status?: 'active' | 'inactive';
          verified?: boolean;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          name: string;
          generic_name: string;
          dosage: string;
          form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'inhaler';
          manufacturer: string;
          category: 'antibiotics' | 'analgesics' | 'cardiovascular' | 'respiratory' | 'neurological' | 'endocrine' | 'oncology' | 'other';
          requires_refrigeration: boolean;
          controlled_substance: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          generic_name: string;
          dosage: string;
          form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'inhaler';
          manufacturer: string;
          category: 'antibiotics' | 'analgesics' | 'cardiovascular' | 'respiratory' | 'neurological' | 'endocrine' | 'oncology' | 'other';
          requires_refrigeration?: boolean;
          controlled_substance?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          generic_name?: string;
          dosage?: string;
          form?: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'inhaler';
          manufacturer?: string;
          category?: 'antibiotics' | 'analgesics' | 'cardiovascular' | 'respiratory' | 'neurological' | 'endocrine' | 'oncology' | 'other';
          requires_refrigeration?: boolean;
          controlled_substance?: boolean;
          created_at?: string;
        };
      };
      medication_requests: {
        Row: {
          id: string;
          hospital_id: string;
          medication_id: string;
          quantity_requested: number;
          urgency: 'low' | 'medium' | 'high' | 'critical';
          reason: string;
          contact_person: string;
          contact_phone: string;
          contact_email: string;
          date_needed: string;
          status: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          medication_id: string;
          quantity_requested: number;
          urgency: 'low' | 'medium' | 'high' | 'critical';
          reason: string;
          contact_person: string;
          contact_phone: string;
          contact_email: string;
          date_needed: string;
          status?: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          medication_id?: string;
          quantity_requested?: number;
          urgency?: 'low' | 'medium' | 'high' | 'critical';
          reason?: string;
          contact_person?: string;
          contact_phone?: string;
          contact_email?: string;
          date_needed?: string;
          status?: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      medication_offers: {
        Row: {
          id: string;
          hospital_id: string;
          medication_id: string;
          quantity_available: number;
          price_per_unit: number | null;
          expiration_date: string;
          conditions: string;
          contact_person: string;
          contact_phone: string;
          contact_email: string;
          valid_until: string;
          status: 'available' | 'reserved' | 'completed' | 'expired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          medication_id: string;
          quantity_available: number;
          price_per_unit?: number | null;
          expiration_date: string;
          conditions: string;
          contact_person: string;
          contact_phone: string;
          contact_email: string;
          valid_until: string;
          status?: 'available' | 'reserved' | 'completed' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          medication_id?: string;
          quantity_available?: number;
          price_per_unit?: number | null;
          expiration_date?: string;
          conditions?: string;
          contact_person?: string;
          contact_phone?: string;
          contact_email?: string;
          valid_until?: string;
          status?: 'available' | 'reserved' | 'completed' | 'expired';
          created_at?: string;
          updated_at?: string;
        };
      };
      medication_responses: {
        Row: {
          id: string;
          request_id: string;
          offer_id: string;
          hospital_id: string;
          quantity_offered: number;
          price_per_unit: number | null;
          message: string | null;
          contact_person: string;
          contact_phone: string;
          contact_email: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          offer_id: string;
          hospital_id: string;
          quantity_offered: number;
          price_per_unit?: number | null;
          message?: string | null;
          contact_person: string;
          contact_phone: string;
          contact_email: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          offer_id?: string;
          hospital_id?: string;
          quantity_offered?: number;
          price_per_unit?: number | null;
          message?: string | null;
          contact_person?: string;
          contact_phone?: string;
          contact_email?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}