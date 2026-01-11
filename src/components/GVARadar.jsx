export default function GVARadar({ onZoneClick, mapImageUrl }) {
    const zones = [
        {
            id: 'pasteur',
            name: 'PASTEUR',
            subtitle: 'MACET/TRAP',
            icon: 'warning',
            color: 'hud-red',
            position: 'top-[20%] left-[20%]',
            size: 'w-8 h-8',
            alert: {
                icon: 'traffic',
                title: 'AVOID PASTEUR',
                description: 'Average speed 8km/h. Heavy congestion detected. Suggest alternative route via Sukajadi.',
                color: 'red'
            }
        },
        {
            id: 'dago',
            name: 'DAGO ATAS',
            subtitle: 'HIGH EFFORT',
            icon: 'landscape',
            color: 'hud-yellow',
            position: 'top-[15%] right-[20%]',
            size: 'w-8 h-8',
            alert: {
                icon: 'trending_up',
                title: 'DAGO ATAS - HIGH EFFORT',
                description: 'Steep incline zone. Fuel consumption +40%. Consider only for premium orders above 50k.',
                color: 'yellow'
            }
        },
        {
            id: 'batununggal',
            name: 'BATUNUNGGAL',
            subtitle: 'HIGH VALUE ZONE',
            icon: 'payments',
            color: 'primary',
            position: 'bottom-[30%] right-[30%]',
            size: 'w-10 h-10',
            isPulsing: true,
            alert: {
                icon: 'payments',
                title: 'BATUNUNGGAL - HOT ZONE',
                description: 'Order density +300% detected. Average order value 45k. Recommended deployment zone.',
                color: 'green'
            }
        }
    ];

    const getColorClasses = (color) => {
        switch (color) {
            case 'hud-red':
                return { bg: 'bg-hud-red/20', border: 'border-hud-red', text: 'text-hud-red' };
            case 'hud-yellow':
                return { bg: 'bg-hud-yellow/20', border: 'border-hud-yellow', text: 'text-hud-yellow' };
            case 'primary':
                return { bg: 'bg-primary/20', border: 'border-primary', text: 'text-primary' };
            default:
                return { bg: 'bg-white/20', border: 'border-white', text: 'text-white' };
        }
    };

    return (
        <div className="relative w-full h-[320px] bg-[#050505] overflow-hidden border-y border-white/10 group">
            {/* Map Background */}
            <div
                className="absolute inset-0 opacity-40 grayscale contrast-125 bg-cover bg-center"
                style={{ backgroundImage: `url('${mapImageUrl}')` }}
            />

            {/* Radar Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,249,6,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,249,6,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Radar Sweep Animation */}
            <div className="absolute inset-0 origin-center radar-sweep opacity-30 pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_270deg,rgba(6,249,6,0.2)_360deg)] rounded-full scale-150" />

            {/* Radar Label */}
            <div className="absolute top-2 left-4 z-10">
                <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 border border-white/20 tracking-widest">
                    GVA RADAR // BANDUNG
                </span>
            </div>

            {/* Zone Markers */}
            {zones.map((zone) => {
                const colors = getColorClasses(zone.color);
                return (
                    <button
                        key={zone.id}
                        onClick={() => onZoneClick(zone.alert)}
                        className={`absolute ${zone.position} flex flex-col items-center group/marker cursor-pointer z-20 transition-transform hover:scale-110`}
                    >
                        <div className="relative">
                            {zone.isPulsing && (
                                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                            )}
                            <div className={`hex-marker relative ${zone.size} ${colors.bg} border ${zone.isPulsing ? 'border-2' : ''} ${colors.border} flex items-center justify-center backdrop-blur-sm ${zone.isPulsing ? 'shadow-[0_0_15px_rgba(6,249,6,0.4)]' : ''}`}>
                                <span className={`material-symbols-outlined ${colors.text} text-[${zone.isPulsing ? '18' : '14'}px]`}>
                                    {zone.icon}
                                </span>
                            </div>
                        </div>
                        <div className={`mt-${zone.isPulsing ? '2' : '1'} bg-black/${zone.isPulsing ? '90' : '80'} border ${colors.border.replace('border-', 'border-').replace('border-hud', 'border-hud').split(' ')[0]}${zone.isPulsing ? '' : '/50'} px-${zone.isPulsing ? '3' : '2'} py-${zone.isPulsing ? '1' : '0.5'} text-center ${zone.isPulsing ? 'shadow-lg' : ''}`}>
                            <div className={`${colors.text} text-[10px] font-bold leading-none`}>
                                {zone.name}
                            </div>
                            <div className={`${zone.isPulsing ? 'text-white font-bold' : 'text-white/60'} text-[${zone.isPulsing ? '9' : '8'}px] tracking-tight ${zone.isPulsing ? 'mt-0.5' : ''}`}>
                                {zone.subtitle}
                            </div>
                        </div>
                    </button>
                );
            })}

            {/* Player Position */}
            <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-black shadow-[0_0_10px_white] z-30" />
        </div>
    );
}
