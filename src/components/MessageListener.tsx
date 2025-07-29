import { useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useHospitals } from '../hooks/useHospitals';
import { useAuth } from '../hooks/useAuth';

const MessageListener = () => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();

  const currentHospital = useMemo(() => {
    if (!user || hospitals.length === 0) return null;
    return hospitals.find(h => h.user_id === user.id) || null;
  }, [user, hospitals]);

  useEffect(() => {
    if (!currentHospital) return;

    console.log('✅ MessageListener activo para:', currentHospital.name);

   const channel = supabase
  .channel('global-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'mensajes',
    },
    handler
  )
  .subscribe();

   

    const handler = (payload: any) => {
      const newMessage = payload.new;

      const isRelevant =
        newMessage.sender_hospital_id === currentHospital.id ||
        newMessage.recipient_hospital_id === currentHospital.id;

      if (!isRelevant) return;

      const otherHospitalId =
        newMessage.sender_hospital_id === currentHospital.id
          ? newMessage.recipient_hospital_id
          : newMessage.sender_hospital_id;

      console.log('🔔 Nuevo mensaje relevante:', newMessage);

      // Actualizar el orden de conversaciones
      const stored = JSON.parse(localStorage.getItem('conversationOrder') || '[]');
      const updated = [otherHospitalId, ...stored.filter(id => id !== otherHospitalId)];
      localStorage.setItem('conversationOrder', JSON.stringify(updated));
      window.dispatchEvent(new Event('conversationOrderUpdated'));

      // 🟢 Actualizar contador de mensajes no leídos
      const unreadMap = JSON.parse(localStorage.getItem("unreadCountMap") || "{}");
      unreadMap[otherHospitalId] = (unreadMap[otherHospitalId] || 0) + 1;
      localStorage.setItem("unreadCountMap", JSON.stringify(unreadMap));
      window.dispatchEvent(new Event("unreadMessagesUpdated"));

      // 🔔 Mostrar pop-up si no estás en la sección de mensajes
      if (document.visibilityState === 'visible' && window.location.pathname !== '/mensajes') {
        const notification = document.createElement('div');
        notification.innerText = `📩 Nuevo mensaje recibido`;
        notification.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: white;
          color: black;
          padding: 10px 16px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          font-family: sans-serif;
          font-size: 14px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 4000);
      }
    };

    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'mensajes',
    }, handler);

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentHospital]);

  return null;
};

export default MessageListener;
