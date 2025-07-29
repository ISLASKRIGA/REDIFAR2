import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, Package, RefreshCw, Wifi, WifiOff, Settings, Volume2, VolumeX } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { useHospitals } from '../hooks/useHospitals';
import { useHospitalColor } from '../hooks/useHospitalColor';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();
  const { 
    notifications, 
    permission, 
    lastUpdate,
    requestPermission, 
    refreshNotifications,
    clearNotifications, 
    markAsRead, 
    unreadCount 
  } = useNotifications();
  
  const userHospital = hospitals.find(h => h.user_id === user?.id);
  const hospitalColor = useHospitalColor(userHospital?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Force re-render when lastUpdate changes
  useEffect(() => {
    console.log('🔄 NotificationCenter re-rendered, lastUpdate:', new Date(lastUpdate).toLocaleTimeString());
  }, [lastUpdate]);

  const handleRequestPermission = async () => {
    console.log('🔔 Requesting notification permission...');
    const granted = await requestPermission();
    if (granted) {
      console.log('✅ Notification permission granted');
    } else {
      console.log('❌ Notification permission denied');
    }
  };

  const getNotificationIcon = (type: string, urgency?: string) => {
    if (type === 'request') {
      return urgency === 'critical' ? 
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div> :
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>;
    }
    return (
      <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
        <Package className="w-4 h-4 text-white" />
      </div>
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)}h`;
    return `hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white animate-pulse';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getNotificationBackground = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-l-4 border-red-500';
      case 'high': return 'bg-orange-50 border-l-4 border-orange-500';
      case 'medium': return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'low': return 'bg-green-50 border-l-4 border-green-500';
      default: return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  return (
    <div className="relative">
      <button
 onClick={() => {
  setIsOpen(!isOpen);
  if (!isOpen) markAsRead(); // ✅ Esto reinicia el contador
}}


        className={`relative p-2 sm:p-3 rounded-full transition-all duration-300 transform hover:scale-110 border-2 border-white/30 ${
          unreadCount > 0 
            ? `text-white bg-gradient-to-r ${hospitalColor.gradient} shadow-lg animate-pulse` 
            : `text-white/80 hover:text-white hover:bg-white/20`
        }`}
      >
        <Bell className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
          unreadCount > 0 ? 'animate-bounce' : ''
        }`} />
        
        {/* Notification count badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 flex items-center justify-center">
            <span className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-ping">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 sm:mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[28rem] sm:max-h-[32rem] overflow-hidden">
            {/* Header */}
            <div className={`p-3 sm:p-4 bg-gradient-to-r ${hospitalColor.gradient} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    🔔 Centro de Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <p className="text-xs sm:text-sm opacity-90">
                      {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} nueva{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors hidden sm:block"
                    title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
                  >
                    {soundEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs sm:text-sm bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time status */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-green-500/20 border border-green-300/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-200">
                    🌐 Sistema Global Activo
                  </p>
                  <p className="text-xs opacity-80 hidden sm:block">
                    Alertas instantáneas de TODOS los hospitales
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-64 sm:max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-500">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-700">No hay notificaciones</p>
                  <p className="text-xs sm:text-sm mt-1">
                    Las notificaciones aparecen automáticamente cuando cualquier hospital envía solicitudes u ofertas
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 transition-all duration-300 hover:bg-gray-50 ${
                        getNotificationBackground(notification.urgency)
                      } ${index === 0 ? 'animate-slideInRight' : ''}`}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        {getNotificationIcon(notification.type, notification.urgency)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">
                                {notification.title}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-700 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                            </div>
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-gray-400 hover:text-red-500 ml-1 sm:ml-2 p-1 rounded-full hover:bg-red-50 transition-colors"
                              title="Descartar notificación"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full truncate max-w-32 sm:max-w-none">
                                📍 {notification.hospitalName}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full truncate max-w-32 sm:max-w-none">
                                💊 {notification.medicationName}
                              </span>
                            </div>
                            {notification.urgency && (
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                getUrgencyColor(notification.urgency)
                              }`}>
                                {notification.urgency === 'critical' ? '🚨 CRÍTICO' : 
                                 notification.urgency === 'high' ? '⚠️ ALTO' :
                                 notification.urgency === 'medium' ? '📋 MEDIO' : '📝 BAJO'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              ⏰ {getTimeAgo(notification.timestamp)}
                            </span>
                            <div className="flex items-center space-x-1">
                              {notification.type === 'request' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  <span className="sm:hidden">📋</span>
                                  <span className="hidden sm:inline">📋 Solicitud</span>
                                </span>
                              )}
                              {notification.type === 'offer' && (
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                                  <span className="sm:hidden">💊</span>
                                  <span className="hidden sm:inline">💊 Oferta</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 sm:p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span>📊 Total: {notifications.length}</span>
                  <span className="hidden sm:inline">🔄 {new Date(lastUpdate).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="hidden sm:inline">🌐 Global</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};