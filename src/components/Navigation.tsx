import React, { useState } from 'react';
import { Home, Building2, Search, Plus, ArrowRightLeft, MessageCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useHospitals } from '../hooks/useHospitals';
import { useHospitalColor } from '../hooks/useHospitalColor';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userHospital = hospitals.find(h => h.user_id === user?.id);
  const hospitalColor = useHospitalColor(userHospital?.id);

  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'hospitales', label: 'Hospitales', icon: Building2 },
    { id: 'solicitudes', label: 'Solicitudes', icon: Search },
    { id: 'insumos-disponibles', label: 'Insumos Disponibles', icon: Plus },
    { id: 'transferencias', label: 'Transferencias', icon: ArrowRightLeft },
    { id: 'mensajes', label: 'Mensajes', icon: MessageCircle }
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Menu */}
      <nav className={`fixed left-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 bg-white shadow-lg border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
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
    </>
  );
};