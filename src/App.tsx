import React, { useState, useEffect } from 'react';
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
      }S
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

  // Mostrar formulario de login si no
