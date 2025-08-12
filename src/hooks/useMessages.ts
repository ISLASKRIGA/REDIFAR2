import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useHospitals } from './useHospitals';

export const isProcessingExternalMessage = { current: false };

interface Message {
  id: string;
  sender_hospital_id: string;
  recipient_hospital_id: string;
  content: string;
  messages_type: 'text' | 'file' | 'system';
  created_at: string;
  read_at: string | null;
  sender_hospital?: { name: string };
}

export const useMessages = (selectedHospitalId: string | null) => {
  const { user } = useAuth();
  const { hospitals } = useHospitals();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentHospital, setCurrentHospital] = useState<any>(null);
  const [unreadCountMap, setUnreadCountMap] = useState<Record<string, number>>({});

  const addOptimisticMessage = (tempMessage: Message) => {
    setMessages(prev => [...prev, tempMessage]);
  };

  // Hospital actual
  useEffect(() => {
    if (user && hospitals.length > 0) {
      const hospital = hospitals.find(h => h.user_id === user.id);
      setCurrentHospital(hospital);
      setLoading(false);
    }
  }, [user, hospitals]);

  // Obtener mensajes de una conversación
  const fetchMessages = useCallback(
    async (hospitalId: string) => {
      if (!hospitalId || !currentHospital?.id) return;
      setMessagesLoading(true);
      try {
        const { data, error } = await supabase
          .from('mensajes')
          .select(`
            id,
            sender_hospital_id,
            recipient_hospital_id,
            content,
            messages_type,
            created_at,
            read_at,
            sender_hospital:sender_hospital_id ( name )
          `)
          .or(
            `and(sender_hospital_id.eq.${currentHospital.id},recipient_hospital_id.eq.${hospitalId}),and(sender_hospital_id.eq.${hospitalId},recipient_hospital_id.eq.${currentHospital.id})`
          )
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data as Message[]);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setMessagesLoading(false);
      }
    },
    [currentHospital]
  );

  // Suscripciones realtime: INSERT (nuevos) + UPDATE (read_at)
  useEffect(() => {
    if (!currentHospital?.id) return;

    const channel = supabase
      .channel(`messages-realtime-${currentHospital.id}`)
      // INSERT
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        (payload) => {
          const newMessage = payload.new as Message;

          const isForMe =
            newMessage.recipient_hospital_id === currentHospital.id;
          const belongsToSelected =
            !!selectedHospitalId &&
            ((newMessage.sender_hospital_id === currentHospital.id &&
              newMessage.recipient_hospital_id === selectedHospitalId) ||
              (newMessage.recipient_hospital_id === currentHospital.id &&
                newMessage.sender_hospital_id === selectedHospitalId));

          if (belongsToSelected) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          } else if (isForMe) {
            // fuerza reordenamientos en bandeja/mensajes no leídos
            isProcessingExternalMessage.current = true;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              const temp = [...prev, newMessage];
              setTimeout(() => {
                setMessages((cur) => cur.filter((m) => m.id !== newMessage.id));
              }, 100);
              return temp;
            });
          }
        }
      )
      // UPDATE (para reflejar read_at → checks y contadores)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mensajes' },
        (payload) => {
          const before = payload.old as Message;
          const after = payload.new as Message;

          // si cambió de no leído -> leído
          const becameRead = !before.read_at && !!after.read_at;

          if (!becameRead) return;

          // Refleja check "leído" si el mensaje es de esta conversación cargada
          setMessages((prev) =>
            prev.map((m) => (m.id === after.id ? { ...m, read_at: after.read_at } : m))
          );

          // Si nos estaban enviando y nosotros somos recipient, bajar contador
          if (after.recipient_hospital_id === currentHospital.id) {
            setUnreadCountMap((prev) => {
              const k = after.sender_hospital_id;
              if (!(k in prev)) return prev;
              const v = Math.max(0, prev[k] - 1);
              const next = { ...prev };
              if (v === 0) delete next[k];
              else next[k] = v;
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentHospital?.id, selectedHospitalId]);

  // Enviar mensaje
  const sendMessage = async (messageData: {
    sender_hospital_id: string;
    recipient_hospital_id: string;
    content: string;
    messages_type: 'text' | 'file' | 'system';
  }) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_hospital_id: messageData.sender_hospital_id,
      recipient_hospital_id: messageData.recipient_hospital_id,
      content: messageData.content,
      messages_type: messageData.messages_type,
      created_at: new Date().toISOString(),
      read_at: null,
      sender_hospital: { name: currentHospital?.name || 'Tú' }
    };

    addOptimisticMessage(optimisticMessage);

    try {
      const { data, error } = await supabase
        .from('mensajes')
        .insert({
          sender_hospital_id: messageData.sender_hospital_id,
          recipient_hospital_id: messageData.recipient_hospital_id,
          content: messageData.content,
          messages_type: messageData.messages_type
        })
        .select(`
          id,
          sender_hospital_id,
          recipient_hospital_id,
          content,
          messages_type,
          created_at,
          read_at,
          sender_hospital:sender_hospital_id ( name ),
          recipient_hospital:recipient_hospital_id ( name )
        `);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (data![0] as any) : m))
      );

      return { data: data![0], error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }
  };

  const createConversation = async () => ({ id: 'direct' });

  // ✅ Marcar como leídos todos los mensajes recibidos desde "otherHospitalId"
  const markAsRead = useCallback(
    async (otherHospitalId?: string) => {
      if (!currentHospital?.id || !otherHospitalId) return;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('mensajes')
        .update({ read_at: now })
        .eq('sender_hospital_id', otherHospitalId)
        .eq('recipient_hospital_id', currentHospital.id)
        .is('read_at', null);

      if (error) {
        console.error('markAsRead error', error);
        return;
      }

      // Actualiza checks en UI inmediatamente
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_hospital_id === otherHospitalId &&
          m.recipient_hospital_id === currentHospital.id &&
          m.read_at === null
            ? { ...m, read_at: now }
            : m
        )
      );

      // Pone el contador de ese hospital en 0
      setUnreadCountMap((prev) => {
        const next = { ...prev };
        delete next[otherHospitalId];
        return next;
      });

      // Recalcular por si acaso
      fetchUnreadCounts();
    },
    [currentHospital?.id]
  );

  // Recuento de no leídos por hospital (para la lista lateral)
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentHospital?.id) return;
    const { data, error } = await supabase
      .from('mensajes')
      .select('sender_hospital_id')
      .eq('recipient_hospital_id', currentHospital.id)
      .is('read_at', null);

    if (error) {
      console.error('Error fetching unread counts:', error);
      return;
    }

    const map: Record<string, number> = {};
    for (const msg of (data as any[]) || []) {
      const senderId = msg.sender_hospital_id;
      map[senderId] = (map[senderId] || 0) + 1;
    }
    setUnreadCountMap(map);
  }, [currentHospital?.id]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [currentHospital?.id, messages, fetchUnreadCounts]);

  return {
    messages,
    conversations: [],
    loading,
    messagesLoading,
    sendMessage,
    markAsRead,             // <- ahora implementado (con parámetro)
    createConversation,
    fetchMessages,
    fetchConversations: () => {},
    currentHospital,
    unreadCountMap,
  };
};
