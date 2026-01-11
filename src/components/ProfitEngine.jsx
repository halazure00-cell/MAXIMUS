export default function ProfitEngine({ dailyGross, fuelCost, serviceCost }) {
    const netProfit = dailyGross - fuelCost - serviceCost;
    const targetPercent = Math.round((netProfit / dailyGross) * 100);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID').format(value);
    };

    const formatShort = (value) => {
        if (value >= 1000) {
            return `${value / 1000}k`;
        }
        return value;
    };

    return (
        <div className="flex flex-col gap-1 px-4 py-4 bg-background-dark relative">
            <div className="flex justify-between items-end mb-1">
                <p className="text-primary/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                    PROFIT REALITY ENGINE
                </p>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span className="text-primary text-[10px] font-bold tracking-wider">TARGET: {targetPercent}%</span>
                </div>
            </div>
            <h1 className="text-primary text-5xl font-bold tracking-tighter leading-none filter drop-shadow-[0_0_8px_rgba(6,249,6,0.5)]">
                <span className="text-2xl align-top opacity-50 font-normal mr-1">IDR</span>
                {formatCurrency(netProfit)}
            </h1>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <p className="text-gray-400 text-xs font-mono tracking-tight flex gap-2">
                    <span>G: {formatShort(dailyGross)}</span>
                    <span className="text-white/20">|</span>
                    <span>BBM: {formatShort(fuelCost)}</span>
                    <span className="text-white/20">|</span>
                    <span>SVC: {formatShort(serviceCost)}</span>
                </p>
                <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
            </div>
        </div>
    );
}
