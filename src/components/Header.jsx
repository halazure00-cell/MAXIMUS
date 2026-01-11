export default function Header({ isGhostMode, onGhostToggle }) {
    return (
        <div className="flex items-center justify-between p-4 pt-6 bg-background-dark/90 backdrop-blur-md sticky top-0 z-40 border-b border-white/10">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl animate-pulse">radar</span>
                <h2 className="text-white text-base font-bold tracking-[0.15em] leading-none">
                    MAXIMUS <span className="text-primary font-normal text-xs align-top">PILOT v2.4</span>
                </h2>
            </div>
            <button
                onClick={onGhostToggle}
                className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 active:bg-white/10 transition-colors"
            >
                <span
                    className={`material-symbols-outlined transition-colors ${isGhostMode ? 'text-hud-red' : 'text-white/50 group-hover:text-white'
                        }`}
                    style={{ fontSize: '20px' }}
                >
                    skull
                </span>
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isGhostMode ? 'bg-hud-red' : 'bg-primary'
                    } animate-ping`}></div>
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isGhostMode ? 'bg-hud-red' : 'bg-primary'
                    }`}></div>
            </button>
        </div>
    );
}
