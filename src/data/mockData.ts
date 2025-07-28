import { Hospital, MedicationRequest, MedicationOffer } from '../types';

export const hospitals: Hospital[] = [
  {
    id: '1',
    name: 'Hospital General San Juan',
    address: 'Av. Principal 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    phone: '+52 55 1234 5678',
    email: 'contacto@hgsj.mx',
    director: 'Dr. María González',
    beds: 250,
    type: 'public',
    specialties: ['Cardiología', 'Neurología', 'Pediatría'],
    status: 'active',
    verified: true
  },
  {
    id: '2',
    name: 'Hospital Privado Santa María',
    address: 'Calle Reforma 456',
    city: 'Guadalajara',
    state: 'Jalisco',
    phone: '+52 33 2345 6789',
    email: 'info@hpsm.mx',
    director: 'Dr. Carlos Rodríguez',
    beds: 180,
    type: 'private',
    specialties: ['Oncología', 'Cirugía', 'Ginecología'],
    status: 'active',
    verified: true
  },
  {
    id: '3',
    name: 'Hospital Universitario del Norte',
    address: 'Campus Universitario s/n',
    city: 'Monterrey',
    state: 'Nuevo León',
    phone: '+52 81 3456 7890',
    email: 'contacto@hun.edu.mx',
    director: 'Dr. Ana Martínez',
    beds: 320,
    type: 'university',
    specialties: ['Traumatología', 'Medicina Interna', 'Psiquiatría'],
    status: 'active',
    verified: true
  }
];

export const medicationRequests: MedicationRequest[] = [
  {
    id: '1',
    hospitalId: '1',
    hospitalName: 'Hospital General San Juan',
    medication: {
      name: 'Amoxicilina',
      genericName: 'Amoxicilina',
      dosage: '500mg',
      form: 'capsule',
      manufacturer: 'Laboratorios Pisa',
      quantity: 100,
      unit: 'units',
      category: 'antibiotics',
      requiresRefrigeration: false,
      controlledSubstance: false
    },
    quantityRequested: 500,
    urgency: 'high',
    reason: 'Brote de infecciones respiratorias en pediatría',
    contactPerson: 'Dr. Luis Hernández',
    contactPhone: '+52 55 1234 5679',
    contactEmail: 'lhernandez@hgsj.mx',
    dateRequested: '2024-01-15',
    dateNeeded: '2024-01-20',
    status: 'pending',
    responses: []
  },
  {
    id: '2',
    hospitalId: '2',
    hospitalName: 'Hospital Privado Santa María',
    medication: {
      name: 'Morfina',
      genericName: 'Sulfato de Morfina',
      dosage: '10mg/ml',
      form: 'injection',
      manufacturer: 'Pfizer',
      quantity: 50,
      unit: 'ml',
      category: 'analgesics',
      requiresRefrigeration: true,
      controlledSubstance: true
    },
    quantityRequested: 200,
    urgency: 'critical',
    reason: 'Pacientes post-quirúrgicos con dolor severo',
    contactPerson: 'Dr. Patricia Vega',
    contactPhone: '+52 33 2345 6790',
    contactEmail: 'pvega@hpsm.mx',
    dateRequested: '2024-01-16',
    dateNeeded: '2024-01-18',
    status: 'pending',
    responses: []
  }
];

export const medicationOffers: MedicationOffer[] = [
  {
    id: '1',
    hospitalId: '3',
    hospitalName: 'Hospital Universitario del Norte',
    medication: {
      id: '1',
      name: 'Paracetamol',
      genericName: 'Acetaminofén',
      dosage: '500mg',
      form: 'tablet',
      manufacturer: 'Laboratorios Silanes',
      expirationDate: '2024-12-31',
      quantity: 1000,
      unit: 'units',
      category: 'analgesics',
      requiresRefrigeration: false,
      controlledSubstance: false
    },
    quantityAvailable: 1000,
    pricePerUnit: 0.50,
    conditions: 'Medicamento en buen estado, almacenado correctamente',
    contactPerson: 'Dr. Roberto Sánchez',
    contactPhone: '+52 81 3456 7891',
    contactEmail: 'rsanchez@hun.edu.mx',
    datePosted: '2024-01-10',
    validUntil: '2024-02-10',
    status: 'available'
  },
  {
    id: '2',
    hospitalId: '1',
    hospitalName: 'Hospital General San Juan',
    medication: {
      id: '2',
      name: 'Insulina Glargina',
      genericName: 'Insulina Glargina',
      dosage: '100 UI/ml',
      form: 'injection',
      manufacturer: 'Sanofi',
      expirationDate: '2024-08-15',
      quantity: 20,
      unit: 'units',
      category: 'endocrine',
      requiresRefrigeration: true,
      controlledSubstance: false
    },
    quantityAvailable: 20,
    conditions: 'Refrigerado desde origen, cadena de frío garantizada',
    contactPerson: 'Dr. Elena Ramírez',
    contactPhone: '+52 55 1234 5680',
    contactEmail: 'eramirez@hgsj.mx',
    datePosted: '2024-01-12',
    validUntil: '2024-02-12',
    status: 'available'
  }
];