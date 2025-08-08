import React, { useState } from 'react';
import { Activity, LogOut } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../hooks/useAuth';
import { useHospitals } from '../hooks/useHospitals';
import { useHospitalColor } from '../hooks/useHospitalColor';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { hospitals } = useHospitals();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hospital actual del usuario
  const userHospital = hospitals.find(h => h.user_id === user?.id);
  const hospitalColor = useHospitalColor(userHospital?.id);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className={`${hospitalColor.primary} shadow-lg border-b-4 ${hospitalColor.border} fixed top-0 left-0 right-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
           <div className="p-2 rounded-full bg-white/20 mr-3 flex items-center justify-center overflow-hidden ring-1 ring-white/30 backdrop-blur-sm">
 <img
  src="/logos/LogoRETMI_SFond.png"
  alt="RETMI Logo"
  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
/>

</div>


            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">RETMI</h1>
              {userHospital && (
                <p className="text-xs sm:text-sm text-white/90 font-medium hidden sm:block">
                  {userHospital.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <NotificationCenter />

            {/* 🏥 Logo del hospital */}
            <div className="hidden sm:flex items-center space-x-3 border-r border-white/30 pr-4">
              <div className="w-8 h-8 bg-white rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={`/logos/${userHospital?.id || 'default'}.png`}
                  alt="Logo hospital"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-sm">
                <p className="text-white/80">{userHospital?.name || 'Hospital General San Juan'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
