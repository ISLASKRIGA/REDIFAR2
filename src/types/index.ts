export interface Hospital {
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
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'inhaler';
  manufacturer: string;
  expirationDate: string;
  quantity: number;
  unit: 'units' | 'ml' | 'mg' | 'g' | 'boxes';
  category: 'antibiotics' | 'analgesics' | 'cardiovascular' | 'respiratory' | 'neurological' | 'endocrine' | 'oncology' | 'other';
  requiresRefrigeration: boolean;
  controlledSubstance: boolean;
}

export interface MedicationRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  medication: Omit<Medication, 'id' | 'expirationDate'>;
  quantityRequested: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  dateRequested: string;
  dateNeeded: string;
  status: 'pending' | 'fulfilled' | 'expired' | 'cancelled';
  responses: MedicationResponse[];
}

export interface MedicationOffer {
  id: string;
  hospitalId: string;
  hospitalName: string;
  medication: Medication;
  quantityAvailable: number;
  pricePerUnit?: number;
  conditions: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  datePosted: string;
  validUntil: string;
  status: 'available' | 'reserved' | 'completed' | 'expired';
}

export interface MedicationResponse {
  id: string;
  offerId: string;
  hospitalId: string;
  hospitalName: string;
  quantityOffered: number;
  pricePerUnit?: number;
  message: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  dateResponded: string;
  status: 'pending' | 'accepted' | 'rejected';
}