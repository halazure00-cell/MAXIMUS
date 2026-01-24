import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timeouts = useRef(new Map());

    const generateToastId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
        const timeout = timeouts.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeouts.current.delete(id);
        }
    }, []);

    const showToast = useCallback(
        (message, type = 'info') => {
            const id = generateToastId();
            setToasts((prev) => [...prev, { id, message, type }]);
            const timeout = setTimeout(() => removeToast(id), 3000);
            timeouts.current.set(id, timeout);
            return id;
        },
        [removeToast]
    );

    useEffect(() => {
        const currentTimeouts = timeouts.current;
        return () => {
            currentTimeouts.forEach((timeout) => clearTimeout(timeout));
            currentTimeouts.clear();
        };
    }, []);

    const value = useMemo(
        () => ({
            toasts,
            showToast,
            removeToast
        }),
        [toasts, showToast, removeToast]
    );

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
