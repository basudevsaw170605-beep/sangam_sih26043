import { createContext, useContext, useEffect, useState } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from './AuthContext';
const C = createContext();
export const NotificationProvider = ({ children }) => {
  const { role, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!isAuthenticated) return setItems([]);
    notificationService
      .get()
      .then((data) =>
        setItems(data.map((n) => ({ ...n, id: n._id, text: n.message, read: n.isRead })))
      )
      .catch(() => setItems([]));
  }, [isAuthenticated, role]);
  return (
    <C.Provider
      value={{
        items,
        markRead: async (id) => {
          await notificationService.markRead(id);
          setItems((x) => x.map((n) => (n.id === id ? { ...n, read: true } : n)));
        },
      }}
    >
      {children}
    </C.Provider>
  );
};
export const useNotifications = () => useContext(C);
