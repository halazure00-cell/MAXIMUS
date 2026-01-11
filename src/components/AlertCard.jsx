export default function AlertCard({ alert, onDismiss, onSetRoute }) {
    const getColorClasses = (color) => {
        switch (color) {
            case 'red':
                return {
                    border: 'border-l-hud-red',
                    iconBg: 'bg-red-900/30 border-red-500/30',
                    iconText: 'text-hud-red',
                    titleText: 'text-hud-red'
                };
            case 'yellow':
                return {
                    border: 'border-l-hud-yellow',
                    iconBg: 'bg-yellow-900/30 border-yellow-500/30',
                    iconText: 'text-hud-yellow',
                    titleText: 'text-hud-yellow'
                };
            case 'green':
                return {
                    border: 'border-l-primary',
                    iconBg: 'bg-green-900/30 border-green-500/30',
                    iconText: 'text-primary',
                    titleText: 'text-primary'
                };
            default:
                return {
                    border: 'border-l-blue-400',
                    iconBg: 'bg-blue-900/30 border-blue-500/30',
                    iconText: 'text-blue-400',
                    titleText: 'text-blue-400'
                };
        }
    };

    const colors = getColorClasses(alert.color);

    return (
        <div className="px-4 -mt-6 relative z-30">
            <div className={`hex-shape bg-[#111] ${colors.border} border-l-4 border-t border-r border-b border-white/10 p-4 shadow-2xl`}>
                <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${colors.iconBg} rounded flex items-center justify-center border`}>
                        <span className={`material-symbols-outlined ${colors.iconText} text-3xl`}>
                            {alert.icon}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h3 className={`${colors.titleText} font-bold text-sm tracking-wide mb-1`}>
                            {alert.title}
                        </h3>
                        <p className="text-gray-300 text-xs leading-relaxed"
                            dangerouslySetInnerHTML={{
                                __html: alert.description.replace(
                                    /(\+?\d+%)/g,
                                    '<span class="text-primary font-bold">$1</span>'
                                )
                            }}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                        onClick={onDismiss}
                        className="h-12 rounded bg-white/5 border border-white/10 text-gray-400 font-bold text-sm hover:bg-white/10 active:scale-95 transition-all uppercase tracking-wider"
                    >
                        Abaikan
                    </button>
                    <button
                        onClick={onSetRoute}
                        className="h-12 rounded bg-primary text-black font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(6,249,6,0.3)]"
                    >
                        Set Rute
                    </button>
                </div>
            </div>
        </div>
    );
}
