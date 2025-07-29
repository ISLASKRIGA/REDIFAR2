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
  sender_hospital?: {
    name: string;
  };
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


  // Get current hospital
  useEffect(() => {
    if (user && hospitals.length > 0) {
      const hospital = hospitals.find(h => h.user_id === user.id);
      setCurrentHospital(hospital);
      setLoading(false);
    }
  }, [user, hospitals]);
    // Subscribe to real-time new messages
 


  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (hospitalId: string) => {
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
        sender_hospital:sender_hospital_id (
          name
        )
      `)
      .or(`and(sender_hospital_id.eq.${currentHospital.id},recipient_hospital_id.eq.${hospitalId}),and(sender_hospital_id.eq.${hospitalId},recipient_hospital_id.eq.${currentHospital.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    setMessages(data as Message[]);
  } catch (error) {
    console.error('Error fetching messages:', error);
  } finally {
    setMessagesLoading(false);
  }
}, [currentHospital]);

  ////////////////////////////////////
 useEffect(() => {
  if (!currentHospital?.id) return;

  const channel = supabase
    .channel(`messages-realtime-${currentHospital.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
      },
      (payload) => {
        const newMessage = payload.new as Message;

        const isForMe = newMessage.recipient_hospital_id === currentHospital.id;
        const isMine = newMessage.sender_hospital_id === currentHospital.id;

        const belongsToSelected =
          selectedHospitalId &&
          (
            (newMessage.sender_hospital_id === currentHospital.id && newMessage.recipient_hospital_id === selectedHospitalId) ||
            (newMessage.recipient_hospital_id === currentHospital.id && newMessage.sender_hospital_id === selectedHospitalId)
          );

        if (belongsToSelected) {
          setMessages((prev) => {
            const alreadyExists = prev.some((m) => m.id === newMessage.id);
            if (alreadyExists) return prev;
            return [...prev, newMessage];
          });
       } else if (isForMe) {
  isProcessingExternalMessage.current = true;

  // Inyectamos temporalmente para disparar el reordenamiento
  setMessages(prev => {
    const alreadyExists = prev.some((m) => m.id === newMessage.id);
    if (alreadyExists) return prev;
    const temp = [...prev, newMessage];

    // Eliminamos el mensaje después de un ciclo (no afecta la UI)
    setTimeout(() => {
      setMessages(current => current.filter(m => m.id !== newMessage.id));
    }, 100); // lo suficientemente corto para el efecto

    return temp;
  });
}

      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentHospital?.id, selectedHospitalId]);






  ////////////////////////////////

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

  // Mostrar el mensaje inmediatamente
  addOptimisticMessage(optimisticMessage);

  try {
    const { data, error } = await supabase
      .from('mensajes')
      .insert({
  sender_hospital_id: messageData.sender_hospital_id,
  recipient_hospital_id: messageData.recipient_hospital_id,
  content: messageData.content,
  messages_type: messageData.messages_type // 👈 Asegúrate que está con “s”
})

      .select(`
  id,
  sender_hospital_id,
  recipient_hospital_id,
  content,
  messages_type,
  created_at,
  read_at,
  sender_hospital:sender_hospital_id (
    name
  ),
  recipient_hospital:recipient_hospital_id (
    name
  )
`)



    if (error) throw error;

    // Reemplazar el mensaje temporal por el real
    setMessages(prev =>
      prev.map(msg => (msg.id === tempId ? data[0] : msg))
    );

    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    // (Opcional) podrías marcar el mensaje como fallido aquí
    return { data: null, error };
  }
};


  const createConversation = async () => {
    return { id: 'direct' };
  };

  const markAsRead = async () => {
    // Opcional, no implementado aún
  };
// Recuento de mensajes no leídos por hospital
useEffect(() => {
  if (!currentHospital?.id) return;

  const fetchUnreadCounts = async () => {
    const { data, error } = await supabase
      .from('mensajes')
      .select('sender_hospital_id', { count: 'exact', head: false })
      .eq('recipient_hospital_id', currentHospital.id)
      .is('read_at', null);

    if (error) {
      console.error('Error fetching unread counts:', error);
      return;
    }

    // Agrupar por hospital
    const countMap: Record<string, number> = {};
    for (const msg of data) {
      const senderId = msg.sender_hospital_id;
      countMap[senderId] = (countMap[senderId] || 0) + 1;
    }

    setUnreadCountMap(countMap);
  };

  fetchUnreadCounts();
}, [currentHospital?.id, messages]);

  
  return {
    messages,
    conversations: [],
    loading,
    messagesLoading,
    sendMessage,
    markAsRead,
    createConversation,
    fetchMessages,
    fetchConversations: () => {},
    currentHospital,
    unreadCountMap,

  };
};
