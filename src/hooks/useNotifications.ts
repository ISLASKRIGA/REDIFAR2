import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface NotificationData {
  id: string;
  type: 'request' | 'offer';
  title: string;
  message: string;
  hospitalName: string;
  medicationName: string;
  urgency?: string;
  timestamp: string;
  relatedId?: string;
  isRead?: boolean;
  isDismissed?: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [lastUpdate, setLastUpdate] = useState(0);

  // Request notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  // Show browser notification with enhanced features
  const showNotification = useCallback((data: NotificationData) => {
    if (permission === 'granted' && 'Notification' in window) {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: '/vite.svg',
        tag: data.id
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, [permission]);

  // Add notification to local state
  const addNotification = useCallback((data: NotificationData) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === data.id)) {
        return prev;
      }
      return [data, ...prev.slice(0, 19)]; // Limit to 20 notifications
    });
    setLastUpdate(Date.now());
    showNotification(data);
  }, [showNotification]);

  // Clear all notifications for current user only
  const clearNotifications = useCallback(() => {
    if (!user) return;
    setNotifications([]);
    setLastUpdate(Date.now());
  }, []);

  // Mark notification as read for current user only
 const markAsRead = useCallback(() => {
  if (!user) return;

  setNotifications(prev => {
    const readIds = prev.map(n => n.id);
    localStorage.setItem('readNotificationIds', JSON.stringify(readIds)); // ✅ Guardar en localStorage

    return prev.map(n => ({ ...n, isRead: true }));
  });

  setLastUpdate(Date.now());
}, [user]);





  // Force refresh notifications from database
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error refreshing notifications:', error);
        return;
      }

      if (data) {
     const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');

const formattedNotifications = data.map(item => ({
  id: item.id,
  type: item.type as 'request' | 'offer',
  title: item.title,
  message: item.message,
  hospitalName: item.hospital_name,
  medicationName: item.medication_name,
  urgency: item.urgency,
  timestamp: item.created_at,
  relatedId: item.related_id,
  isRead: readIds.includes(item.id) // ✅ Solo marcar como no leído si no está en localStorage
}));


        
        setNotifications(formattedNotifications);
        setLastUpdate(Date.now());
      }
    } catch (error) {
      console.error('Network error refreshing notifications:', error);
    }
  }, [user]);

  // Main effect for setting up the notification system
  useEffect(() => {
    if (!user) {
      return;
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    refreshNotifications();

    // Simple polling for notifications
    const interval = setInterval(refreshNotifications, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [user, refreshNotifications]);
  // Escucha en tiempo real las solicitudes y ofertas nuevas
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('realtime:notifications');

    // Solicitudes nuevas
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'medication_requests'
    }, payload => {
      const item = payload.new;
      addNotification({
  id: item.id,
  type: 'request',
  title: 'Nueva solicitud de medicamento',
  message: `${item.medication_name} solicitado por ${item.hospital_name}`,
  hospitalName: item.hospital_name,
  medicationName: item.medication_name,
  urgency: item.urgency,
  timestamp: item.created_at,
  relatedId: item.id,
  isRead: false // 👈 AÑADE ESTO
});

    });

    // Ofertas nuevas
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'medication_offers'
    }, payload => {
      const item = payload.new;
     addNotification({
  id: item.id,
  type: 'offer',
  title: 'Nuevo insumo disponible',
  message: `${item.medication_name} ofrecido por ${item.hospital_name}`,
  hospitalName: item.hospital_name,
  medicationName: item.medication_name,
  timestamp: item.created_at,
  relatedId: item.id,
  isRead: false // 👈 Esto es lo que faltaba
});

    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  return {
    notifications,
    permission,
    lastUpdate,
    requestPermission,
    refreshNotifications,
    clearNotifications,
    markAsRead,
    unreadCount: notifications.filter(n => !n.isRead).length
  };
};