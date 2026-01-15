import React from 'react';

export default function Card({ className = '', children, ...props }) {
    return (
        <div
            className={`rounded-ui-xl border border-ui-border bg-ui-surface shadow-ui-sm ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
