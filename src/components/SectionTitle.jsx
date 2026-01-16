
export default function SectionTitle({ as: Component = 'h2', className = '', children, ...props }) {
    return (
        <Component
            className={`text-xs font-semibold uppercase tracking-[0.2em] text-ui-muted ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
}
