import { useState, useEffect, useCallback } from 'react';

interface UseNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return;

      // Only send notification if the tab is not focused
      if (document.hidden) {
        try {
          const notification = new Notification(title, {
            icon: '/favicon.png',
            badge: '/favicon.png',
            ...options,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Auto close after 5 seconds
          setTimeout(() => notification.close(), 5000);
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      }
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
  };
}
