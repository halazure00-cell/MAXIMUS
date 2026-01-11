import { useEffect } from 'react';

export default function Toast({ message, isVisible, type = 'success', onClose }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const bgColor = type === 'success' ? 'bg-primary/20 border-primary' : 'bg-hud-red/20 border-hud-red';
    const textColor = type === 'success' ? 'text-primary' : 'text-hud-red';

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-pulse">
            <div className={`${bgColor} border px-4 py-3 rounded shadow-lg backdrop-blur-md`}>
                <p className={`${textColor} text-xs font-bold tracking-wider text-center`}>
                    {message}
                </p>
            </div>
        </div>
    );
}
