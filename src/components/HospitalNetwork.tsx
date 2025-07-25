import React, { useState } from 'react';
import { Search, MapPin, Phone, Mail, User, Bed, CheckCircle, Building2 } from 'lucide-react';
import { useHospitals } from '../hooks/useHospitals';
import { getHospitalColorByIndex } from '../utils/hospitalColors';

export const HospitalNetwork: React.FC = () => {
  const { hospitals, loading } = useHospitals();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedState, setSelectedState] = useState('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || hospital.type === selectedType;
    const matchesState = selectedState === 'all' || hospital.state === selectedState;
    return matchesSearch && matchesType && matchesState;
  });

  const typeLabels = {
    public: 'Público',
    private: 'Privado',
    university: 'Universitario'
  };

  const typeColors = {
    public: 'bg-blue-100 text-blue-800',
    private: 'bg-green-100 text-green-800',
    university: 'bg-purple-100 text-purple-800'
  };

  const states = [...new Set(hospitals.map(h => h.state))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Red Hospitalaria</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4" />
          <span>{hospitals.length} hospitales conectados</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="all">Todos los estados</option>
          {states.map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital, index) => {
          const hospitalColor = getHospitalColorByIndex(index);
          return (
            <div key={hospital.id} className={`bg-white rounded-lg shadow-sm border-l-4 ${hospitalColor.border} p-4 sm:p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${hospitalColor.primary}`}></div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{hospital.name}</h3>
                  </div>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1" />
                    <span className="text-xs sm:text-sm text-gray-600">{hospital.city}, {hospital.state}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[hospital.type]}`}>
                    {typeLabels[hospital.type]}
                  </span>
                  {hospital.verified && (
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" title="Hospital verificado" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>Director:</strong> {hospital.director}
                  </span>
                </div>

                <div className="flex items-center">
                  <Bed className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" />
                  <span className="text-xs sm:text-sm text-gray-700">
                    <strong>Camas:</strong> {hospital.beds}
                  </span>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    <strong>Especialidades:</strong>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {hospital.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1" />
                      <span className="text-gray-600">{hospital.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1" />
                      <span className="text-gray-600">{hospital.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Contactar
                </button>
                <button className={`flex-1 ${hospitalColor.light} ${hospitalColor.text} px-3 sm:px-4 py-2 rounded-lg ${hospitalColor.hover} hover:text-white transition-colors text-sm`}>
                  Ver Perfil
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};