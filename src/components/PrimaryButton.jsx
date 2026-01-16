import { forwardRef } from 'react';

const PrimaryButton = forwardRef(({ className = '', children, ...props }, ref) => (
    <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-ui-lg bg-ui-primary px-4 py-2 text-sm font-semibold text-ui-text shadow-ui-sm transition hover:bg-ui-primary-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-primary disabled:cursor-not-allowed disabled:bg-ui-surface-muted disabled:text-ui-muted disabled:shadow-none ${className}`}
        style={{
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
        }}
        {...props}
    >
        {children}
    </button>
));

PrimaryButton.displayName = 'PrimaryButton';

export default PrimaryButton;
