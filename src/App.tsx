import React, { useState, useEffect } from 'react';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'solicitudes' | 'insumos-disponibles' | 'hospitales' | 'transferencias' | 'mensajes'>('dashboard');
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);

  const [showAuthForm, setShowAuthForm] = useState(false);

  // Orden de pestañas que existen en el switch
 const tabsOrder: Array<'dashboard' | 'hospitales' | 'solicitudes' | 'mensajes'> = [
  'dashboard',
  'hospitales',
  'solicitudes',
   'insumos-disponibles',
  'mensajes',
];


const goTo = (tab: typeof tabsOrder[number]) => {
  const currentIndex = tabsOrder.indexOf(activeTab as any);
  const nextIndex = tabsOrder.indexOf(tab as any);
  if (currentIndex !== -1 && nextIndex !== -1) {
    setSlideDirection(nextIndex > currentIndex ? 1 : -1);
  }
  setActiveTab(tab);
};

 const goNextTab = () => {
  const i = tabsOrder.indexOf(activeTab as any);
  if (i === -1) return; // si la pestaña actual no está en tabsOrder, no hacer swipe
  if (i < tabsOrder.length - 1) {
    setSlideDirection(1);
    goTo(tabsOrder[i + 1]);
  }
};


 const goPrevTab = () => {
  const i = tabsOrder.indexOf(activeTab as any);
  if (i === -1) return; // si la pestaña actual no está en tabsOrder, no hacer swipe
  if (i > 0) {
    setSlideDirection(-1);
    goTo(tabsOrder[i - 1]);
  }
};


  // Habilitar swipe sólo en pantallas pequeñas (<= 640px)
  const isMobile = typeof window !== 'undefined'
    ? window.matchMedia('(max-width: 640px)').matches
    : false;

  // Handlers de swipe (colócalo ANTES de cualquier return condicional)
  const swipeBind = useSwipeNavigation({
    onSwipeLeft: goNextTab,
    onSwipeRight: goPrevTab,
    minDistance: 48,
  enabled: isMobile,
  });

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

  // Pantalla de carga mientras se verifica autenticación
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
        return <MedicationOffers onNavigate={goTo} />;
      case 'transferencias':
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
        return <Dashboard onNavigate={goTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16 pb-20 lg:pb-0">
      <Header />
<Navigation activeTab={activeTab} setActiveTab={goTo} />
      <MessageListener /> {/* Escucha global de nuevos mensajes */}
     <main
  className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-4 lg:pb-8 touch-pan-y overflow-hidden"
  {...swipeBind}
>
  <div className="relative min-h-[60vh]">
<AnimatePresence mode="wait" custom={slideDirection} initial={false}>
      <motion.div
        key={activeTab}
        custom={slideDirection}
        initial="enter"
        animate="center"
        exit="exit"
        variants={{
  enter: (dir: 1 | -1) => ({
    x: dir === 1 ? '100%' : '-100%', // entra desde fuera de pantalla
    position: 'absolute',
    inset: 0,
  }),
  center: {
    x: '0%',                         // queda en su lugar
    position: 'relative',
  },
  exit: (dir: 1 | -1) => ({
    x: dir === 1 ? '-100%' : '100%', // sale completamente, sin fade
    position: 'absolute',
    inset: 0,
  }),
}}

transition={{ duration: 0.28, ease: 'easeOut' }}
        className="w-full"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  </div>
</main>

    </div>
  );
}

export default App;
