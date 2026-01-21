import { HelpCircle } from 'lucide-react';

/**
 * HelpButton - Trigger button for page tours
 * Small, non-intrusive "?" icon that starts a guided tour
 */
export default function HelpButton({ onClick, className = '' }) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-full bg-ui-surface-muted hover:bg-ui-border text-ui-muted hover:text-ui-text transition-all active:scale-95 ${className}`}
            aria-label="Bantuan"
            title="Bantuan"
        >
            <HelpCircle size={20} />
        </button>
    );
}
