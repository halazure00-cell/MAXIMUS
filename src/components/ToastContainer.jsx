import { useEffect, useState } from 'react';
import { CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const toastStyles = {
    success: {
        icon: CheckCircle,
        iconColor: 'text-ui-success',
        borderColor: 'border-ui-success/40',
        bgColor: 'bg-ui-success/10'
    },
    error: {
        icon: XCircle,
        iconColor: 'text-ui-danger',
        borderColor: 'border-ui-danger/40',
        bgColor: 'bg-ui-danger/10'
    },
    info: {
        icon: Info,
        iconColor: 'text-ui-info',
        borderColor: 'border-ui-info/40',
        bgColor: 'bg-ui-info/10'
    }
};

function ToastItem({ toast, onRemove }) {
    const [isVisible, setIsVisible] = useState(false);
    const { icon: Icon, iconColor, borderColor, bgColor } = toastStyles[toast.type] || toastStyles.info;

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
            className={`flex items-start gap-3 rounded-ui-xl border ${borderColor} ${bgColor} bg-ui-surface/95 px-4 py-3 shadow-ui-lg backdrop-blur-md transition-all duration-300 ${
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`}
            onClick={() => onRemove(toast.id)}
        >
            <div className={`mt-0.5 ${iconColor}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ui-text truncate">
                    {toast.message}
                </p>
            </div>
            <button
                type="button"
                className="text-ui-muted transition hover:text-ui-text press-effect shrink-0"
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
        <div className="fixed z-[100000] flex w-full max-w-sm flex-col gap-2 px-4 toast-container-position">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
}
