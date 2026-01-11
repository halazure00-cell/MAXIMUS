import { useEffect } from 'react';

export default function StatusFooter({ oilLevel, driverEnergy, setDriverEnergy }) {
    // Fatigue simulator - decrease energy by 1% every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setDriverEnergy((prev) => Math.max(0, prev - 1));
        }, 5000);

        return () => clearInterval(interval);
    }, [setDriverEnergy]);

    const isCritical = driverEnergy <= 35;

    return (
        <div className="mt-auto bg-[#0a0a0a] border-t border-white/10 p-4 pb-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-white/40 text-sm">settings_heart</span>
                <h3 className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">
                    MACHINE & BODY STATUS
                </h3>
            </div>

            {/* Oil Status */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-medium text-gray-400">
                    <span>YAMAHA NMAX OIL</span>
                    <span className="text-primary">{oilLevel}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(6,249,6,0.5)] transition-all duration-500"
                        style={{ width: `${oilLevel}%` }}
                    />
                </div>
            </div>

            {/* Driver Energy */}
            <div className="space-y-1 relative">
                <div className={`flex justify-between text-xs font-mono font-medium ${isCritical ? 'text-hud-red animate-pulse' : 'text-gray-400'}`}>
                    <span className="flex items-center gap-1">
                        {isCritical && (
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                        )}
                        DRIVER ENERGY
                    </span>
                    <span className="font-bold">
                        {isCritical ? 'CRITICAL ' : ''}{driverEnergy}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isCritical
                                ? 'bg-hud-red animate-pulse shadow-[0_0_10px_rgba(255,0,51,0.5)]'
                                : 'bg-primary shadow-[0_0_10px_rgba(6,249,6,0.5)]'
                            }`}
                        style={{ width: `${driverEnergy}%` }}
                    />
                </div>

                {/* Critical Alert Text */}
                {isCritical && (
                    <div className="mt-2 p-2 bg-hud-red/10 border border-hud-red/30 rounded flex gap-2 items-start">
                        <span className="material-symbols-outlined text-hud-red text-sm mt-0.5">medical_services</span>
                        <p className="text-hud-red text-[10px] leading-tight font-bold">
                            FATIGUE DETECTED. SUGGEST REST AT SARIJADI BASECAMP.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
