import React, { useState, useEffect } from 'react';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';

import { HeroDemo } from './components/ui/demo';
import { useAuth } from './hooks/useAuth';
import { useHospitals } from './hooks/useHospitals';
import { AuthForm } from './components/AuthForm';
import { HospitalSetup } from './components/HospitalSetup';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MedicationRequests } from './components/MedicationRequests';
import { MedicationOffers } from './components/MedicationOffers';
import { HospitalNetwork } from './components/HospitalNetwork';
import { Messages } from './components/Messages';
import MessageListener from './components/MessageListener';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { hospitals, loading: hospitalsLoading } = useHospitals();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const tabsOrder: Array<'dashboard' | 'solicitudes' | 'ofertas' | 'insumos-disponibles' | 'hospitales' | 'transferencias' | 'mensajes'> = [
  'dashboard',
  'solicitudes',
  'ofertas',
  'insumos-disponibles',
  'hospitales',
  'transferencias',
  'mensajes',
];

const goTo = (tab: typeof tabsOrder[number]) => setActiveTab(tab);

const goNextTab = () => {
  const i = tabsOrder.indexOf(activeTab as typeof tabsOrder[number]);
  if (i < tabsOrder.length - 1) goTo(tabsOrder[i + 1]);
};

const goPrevTab = () => {
  const i = tabsOrder.indexOf(activeTab as typeof tabsOrder[number]);
  if (i > 0) goTo(tabsOrder[i - 1]);
};

// Habilitar sólo en pantallas pequeñas (<= 640px)
const isMobile = typeof window !== 'undefined'
  ? window.matchMedia('(max-width: 640px)').matches
  : false;


  // ✅ Solicitar permisos de notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Permiso de notificaciones:', permission);
      });
    }
  }, []);

  const scrollToAuthForm = () => {
    setShowAuthForm(true);
    setTimeout(() => {
      const authFormElement = document.getElementById('auth-form-section');
      if (authFormElement) {
        authFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Mostrar pantalla de carga mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar formulario de login si no hay usuario autenticado
  if (!user) {
    return (
      <div className="min-h-screen">
        <HeroDemo onLoginClick={scrollToAuthForm} />
        {showAuthForm && (
          <div id="auth-form-section" className="min-h-screen bg-gray-50 py-12">
            <AuthForm onSuccess={() => setShowAuthForm(false)} />
          </div>
        )}
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
     case 'dashboard':
  return <Dashboard onNavigate={goTo} />;

      case 'hospitales':
        return <HospitalNetwork />;
      case 'solicitudes':
  return <MedicationRequests onNavigate={goTo} />;

      case 'insumos-disponibles':
  return <MedicationOffers onNavigate={setActiveTab} />;

      case 'transferencias':
        const swipeBind = useSwipeNavigation({
  onSwipeLeft: goNextTab,
  onSwipeRight: goPrevTab,
  minDistance: 48,   // sensibilidad del gesto
  enabled: isMobile, // sólo móvil
});

        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Transferencias</h2>
            <p className="text-gray-600">
              Las transferencias se gestionan a través del sistema de mensajería cuando ambos hospitales están de acuerdo
            </p>
          </div>
        );
      case 'mensajes':
        return <Messages />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16 pb-20 lg:pb-0">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <MessageListener /> {/* Escucha global de nuevos mensajes */}
      <main
  className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-4 lg:pb-8 touch-pan-y"
  {...swipeBind}
>

      </main>
    </div>
  );
}

export default App;
