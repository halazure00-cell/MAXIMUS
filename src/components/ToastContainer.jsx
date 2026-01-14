import { useEffect, useState } from 'react';
import { CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const toastStyles = {
    success: {
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
        borderColor: 'border-emerald-500/40'
    },
    error: {
        icon: XCircle,
        iconColor: 'text-red-500',
        borderColor: 'border-red-500/40'
    },
    info: {
        icon: Info,
        iconColor: 'text-sky-500',
        borderColor: 'border-sky-500/40'
    }
};

function ToastItem({ toast, onRemove }) {
    const [isVisible, setIsVisible] = useState(false);
    const { icon: Icon, iconColor, borderColor } = toastStyles[toast.type] || toastStyles.info;

    useEffect(() => {
        const enterFrame = requestAnimationFrame(() => setIsVisible(true));
        const exitTimer = setTimeout(() => setIsVisible(false), 2600);
        return () => {
            cancelAnimationFrame(enterFrame);
            clearTimeout(exitTimer);
        };
    }, []);

    return (
        <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border ${borderColor} bg-white/90 dark:bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur transition-all duration-300 ${
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`}
            onClick={() => onRemove(toast.id)}
        >
            <div className={`mt-0.5 ${iconColor}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {toast.message}
                </p>
            </div>
            <button
                type="button"
                className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => onRemove(toast.id)}
                aria-label="Dismiss toast"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-3 px-4">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
}
