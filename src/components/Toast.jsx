import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((text, type = 'info') => {
    idRef.current += 1;
    const id = idRef.current;
    setItems((list) => [...list, { id, text, type }]);
    setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`toast toast-${i.type}`}>
            {i.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
