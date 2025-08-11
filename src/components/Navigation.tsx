import React, { useState } from 'react';
import { Home, Building2, Search, Plus, ArrowRightLeft, MessageCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHospitals } from '../hooks/useHospitals';
import { useHospitalColor } from '../hooks/useHospitalColor';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

import { useMessages } from '../hooks/useMessages';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalUnread } = useUnreadMessages();

  const userHospital = hospitals.find(h => h.user_id === user?.id);
  const hospitalColor = useHospitalColor(userHospital?.id);

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'hospitales', label: 'Hospitales', icon: Building2 },
    { id: 'solicitudes', label: 'Solicitudes', icon: Search },
    { id: 'insumos-disponibles', label: 'Insumos Disponibles', icon: Plus },
    { id: 'transferencias', label: 'Transferencias', icon: ArrowRightLeft }, // se mantiene para navegación interna
    { id: 'mensajes', label: 'Mensajes', icon: MessageCircle }
  ];

  // 👇 Ocultamos 'transferencias' solo en el menú
  const menuTabs = tabs.filter(tab => tab.id !== 'transferencias');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation Menu */}
      <nav className="hidden lg:block fixed left-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 bg-white shadow-lg border-r border-gray-200 z-40">
        <div className="p-4">
          <div className="space-y-2">
            {menuTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? `${hospitalColor.primary} text-white shadow-md transform scale-105`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - WhatsApp Style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {menuTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors duration-200 ${
                  isActive 
                    ? `${hospitalColor.text}` 
                    : 'text-gray-500'
                }`}
              >
                <div className="relative p-1 rounded-lg">
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                  {tab.id === 'mensajes' && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </div>

                <span className={`text-xs mt-1 font-medium truncate max-w-full ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
