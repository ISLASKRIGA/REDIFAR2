import { useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useHospitals } from '../hooks/useHospitals';
import { useAuth } from '../hooks/useAuth';
import { alertNewMessage } from '../utils/newMessageAlert';


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

    const handler = (payload: any) => {
      const newMessage = payload.new;

      // ✅ Solo si tu hospital RECIBE el mensaje
      const isIncoming = newMessage.recipient_hospital_id === currentHospital.id;
      if (!isIncoming) return;
      // 🔔🔊📳 Sonido + vibración en mensajes entrantes
alertNewMessage();


      const otherHospitalId = newMessage.sender_hospital_id;
// 📝 Guardar último mensaje (entrada o salida) en localStorage
const lastMessages = JSON.parse(localStorage.getItem("lastMessages") || "{}");
lastMessages[otherHospitalId] = {
  text: newMessage.content,          // ← el campo correcto en tu tabla
  timestamp: newMessage.created_at
};
localStorage.setItem("lastMessages", JSON.stringify(lastMessages));

// 🔄 Notificar a la UI que hubo actualización
window.dispatchEvent(new Event("lastMessagesUpdated"));

      console.log('📩 Mensaje entrante recibido de:', otherHospitalId);

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
      // ... (importaciones y lógica previa iguales)

      // 🔔 Mostrar pop-up si la pestaña está activa (sin importar ruta)
      if (document.visibilityState === 'visible') {
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
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('📩 Nuevo mensaje recibido', {
    body: 'Has recibido un nuevo mensaje de otro hospital.',
    icon: '/logo.png', // Asegúrate de tener este ícono en /public
  });
}

    };

    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
                filter: `recipient_hospital_id=eq.${currentHospital.id}`, // 👈 solo lo que te toca

        },
        handler
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentHospital]);

  return null;
};

export default MessageListener;
