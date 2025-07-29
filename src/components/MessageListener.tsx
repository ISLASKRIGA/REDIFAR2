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

    const channel = supabase.channel('global-messages', {
      broadcast: { self: true },
    });

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

      const stored = JSON.parse(localStorage.getItem('conversationOrder') || '[]');
      const updated = [otherHospitalId, ...stored.filter(id => id !== otherHospitalId)];
      localStorage.setItem('conversationOrder', JSON.stringify(updated));

      window.dispatchEvent(new Event('conversationOrderUpdated'));
    };D

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
