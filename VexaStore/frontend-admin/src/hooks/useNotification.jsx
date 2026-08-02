import { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '../components/ToastNotification';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);
  
  const showSuccess = (msg) => addToast(msg, 'success');
  const showError = (msg) => addToast(msg, 'error');
  const showInfo = (msg) => addToast(msg, 'info');
  
  return (
    <NotificationContext.Provider value={{ addToast, showSuccess, showError, showInfo }}>
      {children}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-full max-w-md">
            <ToastNotification {...toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);