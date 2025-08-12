import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useHospitals } from './useHospitals';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();

  const currentHospital = useMemo(
    () => hospitals.find(h => h.user_id === user?.id) || null,
    [user, hospitals]
  );

  const [byHospital, setByHospital] = useState<Record<string, number>>({});

  const refreshUnread = useCallback(async () => {
    if (!currentHospital?.id) return;
    const { data, error } = await supabase
      .from('mensajes')
      .select('id,sender_hospital_id')
      .eq('recipient_hospital_id', currentHospital.id)
      .is('read_at', null);

    if (error) {
      console.error('refreshUnread error', error);
      return;
    }
    const map: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      map[row.sender_hospital_id] = (map[row.sender_hospital_id] || 0) + 1;
    });
    setByHospital(map);
  }, [currentHospital?.id]);

  // carga inicial
  useEffect(() => { refreshUnread(); }, [refreshUnread]);
// 🔁 Recontar cuando el usuario regresa a la pestaña
useEffect(() => {
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      refreshUnread();
    }
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onVisible);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', onVisible);
  };
}, [refreshUnread]);

  // tiempo real: INSERT y UPDATE(read_at)
  useEffect(() => {
    if (!currentHospital?.id) return;

    const ch = supabase
      .channel(`unread-${currentHospital.id}`)
   .on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'mensajes',
    // 🔴 FILTRO por receptor para asegurar que nos llegue siempre
    filter: `recipient_hospital_id=eq.${currentHospital.id}`
  },
  (payload) => {
    const m = payload.new as any;
    // solo cuenta si llega sin leer
    if (m.read_at == null) {
      setByHospital(prev => ({
        ...prev,
        [m.sender_hospital_id]: (prev[m.sender_hospital_id] || 0) + 1
      }));
    }
  }
)

      .on(
  'postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public',
    table: 'mensajes',
    // 🔴 FILTRO por receptor
    filter: `recipient_hospital_id=eq.${currentHospital.id}`
  },
  (payload) => {
    const oldR = payload.old as any;
    const m = payload.new as any;
    // si pasó de no leído -> leído
    if (oldR?.read_at == null && m.read_at != null) {
      setByHospital(prev => {
        const next = { ...prev };
        const k = m.sender_hospital_id;
        const v = Math.max(0, (next[k] || 0) - 1);
        if (v === 0) delete next[k]; else next[k] = v;
        return next;
      });
    }
  }
)

      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [currentHospital?.id]);

  const totalUnread = Object.values(byHospital).reduce((a, b) => a + b, 0);
  return { totalUnread, byHospital, refreshUnread };
};
