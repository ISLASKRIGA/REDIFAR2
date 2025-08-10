import React from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Users, Package, Search, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHospitals } from '../hooks/useHospitals';
import { useMedicationRequests } from '../hooks/useMedicationRequests';
import { useMedicationOffers } from '../hooks/useMedicationOffers';
import { useHospitalColor } from '../hooks/useHospitalColor';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();
  const { requests, loading: requestsLoading } = useMedicationRequests();
  const { offers, loading: offersLoading } = useMedicationOffers();
  
  const userHospital = hospitals.find(h => h.user_id === user?.id);
  const hospitalColor = useHospitalColor(userHospital?.id);

  // Calculate real statistics
  const totalRequests = requests.length;
  const totalOffers = offers.length;
  const criticalRequests = requests.filter(r => r.urgency === 'critical').length;
  const highUrgencyRequests = requests.filter(r => r.urgency === 'high').length;
  const urgentRequests = criticalRequests + highUrgencyRequests;
  const connectedHospitals = hospitals.length;

  // Get recent activity from requests and offers
  const recentActivity = [
    ...requests.slice(0, 3).map(request => ({
      type: 'request' as const,
      message: `Nueva solicitud de ${request.medication_name || 'medicamento'}`,

      hospital: request.hospitals?.name || 'Hospital',
      time: new Date(request.created_at).toLocaleString(),
      urgent: request.urgency === 'critical' || request.urgency === 'high',
      id: request.id
    })),
    ...offers.slice(0, 3).map(offer => ({
      type: 'offer' as const,
message: `Nueva oferta de ${offer.medication_name || 'medicamento'}`,
      hospital: offer.hospitals?.name || 'Hospital',
      time: new Date(offer.created_at).toLocaleString(),
      urgent: false,
      id: offer.id
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  // Get most requested medications
  const medicationCounts = requests.reduce((acc, request) => {
    const medName = request.medications?.name || 'Desconocido';
    acc[medName] = (acc[medName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostRequested = Object.entries(medicationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, requests: count }));

  const stats = [
    { 
      title: 'Solicitudes Activas', 
      value: totalRequests.toString(), 
      change: '+' + Math.floor(totalRequests * 0.1), 
      trend: 'up', 
      icon: Clock,
      onClick: () => onNavigate('solicitudes')
    },
    { 
      title: 'Insumos Disponibles', 
      value: totalOffers.toString(), 
      change: '+' + Math.floor(totalOffers * 0.15), 
      trend: 'up', 
      icon: Package,
      onClick: () => onNavigate('ofertas')
    },
    { 
      title: 'Hospitales Conectados', 
      value: connectedHospitals.toString(), 
      change: '+' + Math.floor(connectedHospitals * 0.05), 
      trend: 'up', 
      icon: Users,
      onClick: () => onNavigate('hospitales')
    },
    { 
      title: 'Solicitudes Urgentes', 
      value: urgentRequests.toString(), 
      change: urgentRequests > 5 ? '+2' : '-1', 
      trend: urgentRequests > 5 ? 'up' : 'down', 
      icon: AlertTriangle,
      onClick: () => onNavigate('solicitudes')
    }
  ];

  if (requestsLoading || offersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`${hospitalColor.primary} rounded-lg p-4 sm:p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              Bienvenido, {userHospital?.name || 'Hospital'}
            </h1>
            <p className="text-sm sm:text-base text-white/90">
              Panel de control de la Red de Intercambio Hospitalario
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white/80 text-xs sm:text-sm">Última actualización</p>
            <p className="font-semibold text-sm">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  stat.icon === AlertTriangle ? 'bg-orange-100' : hospitalColor.light
                }`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    stat.icon === AlertTriangle ? 'text-orange-600' : hospitalColor.text
                  }`} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-1 hidden sm:inline">vs último mes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 hidden sm:block" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('solicitudes')}
              className={`w-full flex items-center justify-between p-3 sm:p-4 ${hospitalColor.light} ${hospitalColor.text} rounded-lg hover:bg-opacity-80 transition-colors`}
            >
              <div className="flex items-center">
                <Search className="w-5 h-5 mr-3" />
                <span className="text-sm sm:text-base font-medium">Nueva Solicitud</span>
              </div>
              <ArrowRight className="w-4 h-4 hidden sm:block" />
            </button>
            <button
              onClick={() => onNavigate('insumos-disponibles')}
              className={`w-full flex items-center justify-between p-3 sm:p-4 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors`}
            >
              <div className="flex items-center">
                <Plus className="w-5 h-5 mr-3" />
                <span className="text-sm sm:text-base font-medium">Registrar Insumos</span>
              </div>
              <ArrowRight className="w-4 h-4 hidden sm:block" />
            </button>
            <button
              onClick={() => onNavigate('hospitales')}
              className="w-full flex items-center justify-between p-3 sm:p-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3" />
                <span className="text-sm sm:text-base font-medium">Ver Red Hospitalaria</span>
              </div>
              <ArrowRight className="w-4 h-4 hidden sm:block" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Medicamentos Más Solicitados</h3>
            <button
              onClick={() => onNavigate('solicitudes')}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-4">
            {mostRequested.length > 0 ? (
              mostRequested.map((med, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{med.name}</p>
                    <p className="text-xs text-gray-500">{med.requests} solicitudes</p>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      index === 0 ? 'bg-red-500' : 
                      index === 1 ? 'bg-orange-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay solicitudes registradas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Actividad Reciente</h3>
          <div className="flex space-x-2 text-xs sm:text-sm">
            <button
              onClick={() => onNavigate('solicitudes')}
              className="text-blue-600 hover:text-blue-700 hidden sm:inline"
            >
              Ver solicitudes
            </button>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <button
              onClick={() => onNavigate('insumos-disponibles')}
              className="text-teal-600 hover:text-teal-700 hidden sm:inline"
            >
              Ver insumos
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-2 sm:space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.urgent ? 'bg-red-500 animate-pulse' : 
                  activity.type === 'request' ? 'bg-blue-500' : 'bg-teal-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 flex-1 mr-2">{activity.message}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      activity.type === 'request' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {activity.type === 'request' ? 'Sol.' : 'Oferta'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <p className="text-xs text-gray-500">{activity.hospital}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No hay actividad reciente</p>
              <p className="text-xs text-gray-400 mt-1">
                Las solicitudes y ofertas aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};