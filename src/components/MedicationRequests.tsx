import React, { useState } from 'react';
import { Search, Plus, Clock, AlertTriangle, Filter, Grid, List } from 'lucide-react';
import { useMedicationRequests } from '../hooks/useMedicationRequests';
import { useHospitals } from '../hooks/useHospitals';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useHospitalColor } from '../hooks/useHospitalColor';

interface MedicationRequestsProps {
  onNavigate: (tab: string) => void;
}

export const MedicationRequests: React.FC<MedicationRequestsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { requests, loading, createRequest } = useMedicationRequests();
  const { hospitals } = useHospitals();
  const { requestPermission, refreshNotifications } = useNotifications();
  
  const userHospital = hospitals.find(h => h.user_id === user?.id);
  const hospitalColor = useHospitalColor(userHospital?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [formData, setFormData] = useState({
    medicationName: '',
    genericName: '',
    dosage: '',
    quantity: 0,
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    dateNeeded: '',
    reason: '',
    contactPerson: '',
    contactPhone: ''
  });


  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.medications?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.hospitals?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = selectedUrgency === 'all' || request.urgency === selectedUrgency;
    return matchesSearch && matchesUrgency;
  });

  const urgencyColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const urgencyLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica'
  };

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userHospital || !user) return;

    try {
      const { error } = await createRequest({
        hospital_id: userHospital.id,
medication_name: formData.medicationName, // ✅ Correcto
        quantity_requested: formData.quantity,
        urgency: formData.urgency,
        reason: formData.reason,
        contact_person: formData.contactPerson,
        contact_phone: formData.contactPhone,
        contact_email: user.email || '',
        date_needed: formData.dateNeeded
      });

      if (!error) {
        setShowForm(false);
        setFormData({
          medicationName: '',
          genericName: '',
          dosage: '',
          quantity: 0,
          urgency: 'medium',
          dateNeeded: '',
          reason: '',
          contactPerson: '',
          contactPhone: ''
        });
        
        // Request notification permission if not already granted
        await requestPermission();
        
        // Force refresh notifications to show the new request
        setTimeout(refreshNotifications, 1000);
      }
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Solicitudes</h2>
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
            <span>Nueva Solicitud</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar medicamentos o hospitales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${hospitalColor.text.split('-')[1]}-500 focus:border-transparent text-sm`}
          />
        </div>
        
        <select
          value={selectedUrgency}
          onChange={(e) => setSelectedUrgency(e.target.value)}
          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">Todas las urgencias</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{request.medication_name || 'Medicamento no disponible'}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{request.hospitals?.name || 'Hospital no disponible'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${urgencyColors[request.urgency]}`}>
                    {urgencyLabels[request.urgency]}
                  </span>
                  {request.urgency === 'critical' && <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-600">Cantidad Solicitada</p>
                    <p className="font-medium">{request.quantity_requested} unidades</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dosificación</p>
                    <p className="font-medium">{request.dosage || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha Necesaria</p>
                    <p className="font-medium">{new Date(request.date_needed).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contacto</p>
                    <p className="font-medium">{request.contact_person}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Razón</p>
                  <p className="text-xs sm:text-sm">{request.reason}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {new Date(request.created_at).toLocaleDateString()}
                </div>
                <button className="bg-teal-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">
                  Responder
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
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicamento
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Hospital
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgencia
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Fecha Necesaria
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contacto
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-32 sm:max-w-none">{request.medication_name || 'Medicamento no disponible'}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{request.hospitals?.name || 'Hospital no disponible'}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">{request.dosage || 'No especificada'}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">{request.hospitals?.name || 'Hospital no disponible'}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">{request.quantity_requested}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${urgencyColors[request.urgency]}`}>
                        <span className="sm:hidden">{urgencyLabels[request.urgency].charAt(0)}</span>
                        <span className="hidden sm:inline">{urgencyLabels[request.urgency]}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">{new Date(request.date_needed).toLocaleDateString()}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">{request.contact_person}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <button 
                        onClick={() => handleContactHospital(request.hospitals?.id, request.hospitals?.name, `Solicitud: ${request.medication_name}`)}
                        className="bg-teal-600 text-white px-2 sm:px-3 py-1 rounded-md hover:bg-teal-700 transition-colors text-xs"
                      >
                        <span className="sm:hidden">Resp.</span>
                        <span className="hidden sm:inline">Responder</span>
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
              <h3 className="text-xl font-bold text-gray-900 mb-6">Nueva Solicitud de Medicamento</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Medicamento
                    </label>
                    <input
                      type="text"
                      value={formData.medicationName}
                      onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Amoxicilina"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Genérico
                    </label>
                    <input
                      type="text"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Amoxicilina"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosificación
                    </label>
                    <input
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad Solicitada
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: 100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urgencia
                    </label>
                    <select 
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Necesaria
                    </label>
                    <input
                      type="date"
                      value={formData.dateNeeded}
                      onChange={(e) => setFormData({ ...formData, dateNeeded: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón de la Solicitud
                  </label>
                  <textarea
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describa la razón de la solicitud..."
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Dr. Juan Pérez"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: +52 55 1234 5678"
                      required
                    />
                  </div>
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
                    Enviar Solicitud
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