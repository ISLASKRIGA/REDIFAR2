import React, { useState } from 'react';
import { Search, Plus, Package, Thermometer, AlertCircle, Grid, List } from 'lucide-react';
import { useMedicationOffers } from '../hooks/useMedicationOffers';
import { useMedications } from '../hooks/useMedications';
import { useHospitals } from '../hooks/useHospitals';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useHospitalColor } from '../hooks/useHospitalColor';

interface MedicationOffersProps {
  onNavigate: (tab: string) => void;
}

export const MedicationOffers: React.FC<MedicationOffersProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { offers, loading, createOffer } = useMedicationOffers();
  const { medications } = useMedications();
  const { hospitals } = useHospitals();
  const { requestPermission, refreshNotifications } = useNotifications();
  
  const userHospital = hospitals.find(h => h.user_id === user?.id);
  const hospitalColor = useHospitalColor(userHospital?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [formData, setFormData] = useState({
    medicationName: '',
    genericName: '',
    dosage: '',
    quantity: 0,
    expirationDate: '',
    pricePerUnit: '',
    conditions: '',
    contactPerson: '',
    contactPhone: '',
    validUntil: '',
    requiresRefrigeration: false,
    controlledSubstance: false
  });

  const handleContactHospital = (hospitalId: string, hospitalName: string, subject: string) => {
    // Guardar información en localStorage para que Messages la pueda usar
    localStorage.setItem('contactHospital', JSON.stringify({
      hospitalId,
      hospitalName,
      subject,
      timestamp: Date.now()
    }));
    
    // Navegar a mensajes
    onNavigate('mensajes');
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.medications?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.hospitals?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || offer.medications?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryLabels = {
    antibiotics: 'Antibióticos',
    analgesics: 'Analgésicos',
    cardiovascular: 'Cardiovascular',
    respiratory: 'Respiratorio',
    neurological: 'Neurológico',
    endocrine: 'Endocrino',
    oncology: 'Oncología',
    other: 'Otros'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userHospital || !user) return;

    try {
      const { error } = await createOffer({
        hospital_id: userHospital.id,
        medication_id: formData.medicationName, // Will be converted to actual ID in the hook
        quantity_available: formData.quantity,
        price_per_unit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : null,
        expiration_date: formData.expirationDate,
        conditions: formData.conditions,
        contact_person: formData.contactPerson,
        contact_phone: formData.contactPhone,
        contact_email: user.email || '',
        valid_until: formData.validUntil
      });

      if (!error) {
        setShowForm(false);
        setFormData({
          medicationName: '',
          genericName: '',
          dosage: '',
          quantity: 0,
          expirationDate: '',
          pricePerUnit: '',
          conditions: '',
          contactPerson: '',
          contactPhone: '',
          validUntil: '',
          requiresRefrigeration: false,
          controlledSubstance: false
        });
        
        // Request notification permission if not already granted
        await requestPermission();
        
        // Force refresh notifications to show the new offer
        setTimeout(refreshNotifications, 1000);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Insumos Disponibles</h2>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'cards' 
                  ? `${hospitalColor.primary} text-white` 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista de tarjetas"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? `${hospitalColor.primary} text-white` 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Vista de tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className={`${hospitalColor.primary} text-white px-4 py-2 rounded-lg ${hospitalColor.hover} transition-colors flex items-center space-x-2`}
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Insumos</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar medicamentos u hospitales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${hospitalColor.text.split('-')[1]}-500 focus:border-transparent text-sm`}
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
        >
          <option value="all">Todas las categorías</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{offer.medications?.name || 'Medicamento no disponible'}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{offer.hospitals?.name || 'Hospital no disponible'}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800 whitespace-nowrap">
                    {categoryLabels[offer.medications?.category] || 'Sin categoría'}
                  </span>
                  <div className="flex items-center space-x-1">
                    {offer.medications?.requires_refrigeration && (
                      <Thermometer className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" title="Requiere refrigeración" />
                    )}
                    {offer.medications?.controlled_substance && (
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" title="Sustancia controlada" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-600">Cantidad Disponible</p>
                    <p className="font-medium">{offer.quantity_available} unidades</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Presentación</p>
                    <p className="font-medium">{offer.medications?.dosage || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha de caducidad</p>
                    <p className="font-medium">{new Date(offer.expiration_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Precio</p>
                    <p className="font-medium">
                      {offer.price_per_unit ? `$${offer.price_per_unit} / unidad` : 'Donación'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Condiciones</p>
                  <p className="text-xs sm:text-sm">{offer.conditions}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Contacto</p>
                  <p className="text-xs sm:text-sm font-medium">{offer.contact_person}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Válido hasta: </span>
                  {new Date(offer.valid_until).toLocaleDateString()}
                </div>
                <button 
                  onClick={() => handleContactHospital(offer.hospitals?.id, offer.hospitals?.name, `Oferta: ${offer.medications?.name}`)}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Contactar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caducidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{offer.medications?.name || 'Medicamento no disponible'}</div>
                        <div className="text-sm text-gray-500">{offer.medications?.dosage || 'No especificada'}</div>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                            {categoryLabels[offer.medications?.category] || 'Sin categoría'}
                          </span>
                          {offer.medications?.requires_refrigeration && (
                            <Thermometer className="w-3 h-3 text-blue-500" title="Requiere refrigeración" />
                          )}
                          {offer.medications?.controlled_substance && (
                            <AlertCircle className="w-3 h-3 text-red-500" title="Sustancia controlada" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{offer.hospitals?.name || 'Hospital no disponible'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{offer.quantity_available} unidades</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {offer.price_per_unit ? `$${offer.price_per_unit}` : 'Donación'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(offer.expiration_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{offer.contact_person}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleContactHospital(offer.hospitals?.id, offer.hospitals?.name, `Oferta: ${offer.medications?.name}`)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Contactar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Nueva Oferta de Medicamento</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clave CNIS
                    </label>
                    <input
                      type="text"
                      value={formData.medicationName}
                      onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ej: 010.000.3609.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Medicamento
                    </label>
                    <input
                      type="text"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ej: Acetaminofén"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presentación
                    </label>
                    <input
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ej: tableta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de medida
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ej: 100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Caducidad
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad a Dispisición
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ej: 0.50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condiciones de la Oferta
                  </label>
                  <textarea
                    rows={3}
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Describa las condiciones del medicamento..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ej: Dr. Ana López"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ej: +52 55 1234 5678"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Válido Hasta
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requiresRefrigeration}
                      onChange={(e) => setFormData({ ...formData, requiresRefrigeration: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Requiere refrigeración</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.controlledSubstance}
                      onChange={(e) => setFormData({ ...formData, controlledSubstance: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sustancia controlada</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`${hospitalColor.primary} text-white px-6 py-2 rounded-lg ${hospitalColor.hover} transition-colors`}
                  >
                    Publicar Oferta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};