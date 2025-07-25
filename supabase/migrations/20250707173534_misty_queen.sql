/*
  # Hospital Network Medication Exchange System Database Schema

  1. New Tables
    - `hospitals`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `phone` (text)
      - `email` (text)
      - `director` (text)
      - `beds` (integer)
      - `type` (text)
      - `specialties` (text array)
      - `status` (text)
      - `verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `medications`
      - `id` (uuid, primary key)
      - `name` (text)
      - `generic_name` (text)
      - `dosage` (text)
      - `form` (text)
      - `manufacturer` (text)
      - `category` (text)
      - `requires_refrigeration` (boolean)
      - `controlled_substance` (boolean)
      - `created_at` (timestamp)

    - `medication_requests`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, foreign key)
      - `medication_id` (uuid, foreign key)
      - `quantity_requested` (integer)
      - `urgency` (text)
      - `reason` (text)
      - `contact_person` (text)
      - `contact_phone` (text)
      - `contact_email` (text)
      - `date_needed` (date)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `medication_offers`
      - `id` (uuid, primary key)
      - `hospital_id` (uuid, foreign key)
      - `medication_id` (uuid, foreign key)
      - `quantity_available` (integer)
      - `price_per_unit` (decimal)
      - `expiration_date` (date)
      - `conditions` (text)
      - `contact_person` (text)
      - `contact_phone` (text)
      - `contact_email` (text)
      - `valid_until` (date)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `medication_responses`
      - `id` (uuid, primary key)
      - `request_id` (uuid, foreign key)
      - `offer_id` (uuid, foreign key)
      - `hospital_id` (uuid, foreign key)
      - `quantity_offered` (integer)
      - `price_per_unit` (decimal)
      - `message` (text)
      - `contact_person` (text)
      - `contact_phone` (text)
      - `contact_email` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their hospital's data
    - Add policies for reading public hospital information
*/

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  director text NOT NULL,
  beds integer NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('public', 'private', 'university')),
  specialties text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  verified boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text NOT NULL,
  dosage text NOT NULL,
  form text NOT NULL CHECK (form IN ('tablet', 'capsule', 'liquid', 'injection', 'cream', 'inhaler')),
  manufacturer text NOT NULL,
  category text NOT NULL CHECK (category IN ('antibiotics', 'analgesics', 'cardiovascular', 'respiratory', 'neurological', 'endocrine', 'oncology', 'other')),
  requires_refrigeration boolean DEFAULT false,
  controlled_substance boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create medication_requests table
CREATE TABLE IF NOT EXISTS medication_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE,
  quantity_requested integer NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  reason text NOT NULL,
  contact_person text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  date_needed date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medication_offers table
CREATE TABLE IF NOT EXISTS medication_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE,
  quantity_available integer NOT NULL,
  price_per_unit decimal(10,2),
  expiration_date date NOT NULL,
  conditions text NOT NULL,
  contact_person text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  valid_until date NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'completed', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medication_responses table
CREATE TABLE IF NOT EXISTS medication_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES medication_requests(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES medication_offers(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  quantity_offered integer NOT NULL,
  price_per_unit decimal(10,2),
  message text,
  contact_person text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for hospitals
CREATE POLICY "Users can read all hospitals"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own hospital"
  ON hospitals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hospital"
  ON hospitals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for medications (public read, authenticated insert)
CREATE POLICY "Anyone can read medications"
  ON medications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert medications"
  ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for medication_requests
CREATE POLICY "Users can read all medication requests"
  ON medication_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert requests for their hospital"
  ON medication_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals 
      WHERE hospitals.id = medication_requests.hospital_id 
      AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their hospital's requests"
  ON medication_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals 
      WHERE hospitals.id = medication_requests.hospital_id 
      AND hospitals.user_id = auth.uid()
    )
  );

-- Create policies for medication_offers
CREATE POLICY "Users can read all medication offers"
  ON medication_offers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert offers for their hospital"
  ON medication_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals 
      WHERE hospitals.id = medication_offers.hospital_id 
      AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their hospital's offers"
  ON medication_offers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals 
      WHERE hospitals.id = medication_offers.hospital_id 
      AND hospitals.user_id = auth.uid()
    )
  );

-- Create policies for medication_responses
CREATE POLICY "Users can read responses to their requests"
  ON medication_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM medication_requests mr
      JOIN hospitals h ON h.id = mr.hospital_id
      WHERE mr.id = medication_responses.request_id 
      AND h.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM hospitals 
      WHERE hospitals.id = medication_responses.hospital_id 
      AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert responses for their hospital"
  ON medication_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals 
      WHERE hospitals.id = medication_responses.hospital_id 
      AND hospitals.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);
CREATE INDEX IF NOT EXISTS idx_medication_requests_hospital_id ON medication_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medication_requests_status ON medication_requests(status);
CREATE INDEX IF NOT EXISTS idx_medication_offers_hospital_id ON medication_offers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medication_offers_status ON medication_offers(status);
CREATE INDEX IF NOT EXISTS idx_medication_responses_request_id ON medication_responses(request_id);

-- Insert sample medications
INSERT INTO medications (name, generic_name, dosage, form, manufacturer, category, requires_refrigeration, controlled_substance) VALUES
('Amoxicilina', 'Amoxicilina', '500mg', 'capsule', 'Laboratorios Pisa', 'antibiotics', false, false),
('Paracetamol', 'Acetaminofén', '500mg', 'tablet', 'Laboratorios Silanes', 'analgesics', false, false),
('Morfina', 'Sulfato de Morfina', '10mg/ml', 'injection', 'Pfizer', 'analgesics', true, true),
('Insulina Glargina', 'Insulina Glargina', '100 UI/ml', 'injection', 'Sanofi', 'endocrine', true, false),
('Omeprazol', 'Omeprazol', '20mg', 'capsule', 'Laboratorios Liomont', 'other', false, false),
('Metformina', 'Metformina', '850mg', 'tablet', 'Laboratorios Pisa', 'endocrine', false, false),
('Salbutamol', 'Salbutamol', '100mcg', 'inhaler', 'GlaxoSmithKline', 'respiratory', false, false),
('Atorvastatina', 'Atorvastatina', '20mg', 'tablet', 'Pfizer', 'cardiovascular', false, false);