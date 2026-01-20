import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Circle } from 'lucide-react';
import Card from './Card';
import { 
    buildDailyMetrics, 
    buildMonthlyMetrics, 
    generateDailyFeedback, 
    generateMonthlyFeedback,
    formatRupiah,
    formatRupiahWithSign,
    getStatusColor
} from '../lib/feedbackEngine';

export default function FeedbackCard({ orders = [], expenses = [], settings = {}, onAddTransaction }) {
    const [scope, setScope] = useState('daily'); // 'daily' | 'monthly'
    const [isExpanded, setIsExpanded] = useState(false);

    // Compute metrics based on current scope (memoized for performance)
    const currentMetrics = useMemo(() => {
        if (scope === 'daily') {
            return buildDailyMetrics(orders, expenses, settings);
        }
        return buildMonthlyMetrics(orders, expenses, settings);
    }, [scope, orders, expenses, settings]);

    // Generate feedback based on current metrics
    const feedback = useMemo(() => {
        if (scope === 'daily') {
            return generateDailyFeedback(currentMetrics);
        }
        return generateMonthlyFeedback(currentMetrics);
    }, [scope, currentMetrics]);

    // Status color mapping
    const colorClass = {
        'danger': 'text-ui-danger',
        'warning': 'text-ui-warning',
        'success': 'text-ui-success',
        'muted': 'text-ui-muted'
    }[getStatusColor(feedback.status)] || 'text-ui-muted';

    const bgColorClass = {
        'danger': 'bg-ui-danger',
        'warning': 'bg-ui-warning',
        'success': 'bg-ui-success',
        'muted': 'bg-ui-muted'
    }[getStatusColor(feedback.status)] || 'bg-ui-muted';

    return (
        <Card className="mb-4 p-4">
            {/* Scope toggle */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => setScope('daily')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            scope === 'daily'
                                ? 'bg-ui-primary text-ui-inverse'
                                : 'bg-ui-surface-muted text-ui-muted hover:bg-ui-border'
                        }`}
                    >
                        Hari ini
                    </button>
                    <button
                        onClick={() => setScope('monthly')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            scope === 'monthly'
                                ? 'bg-ui-primary text-ui-inverse'
                                : 'bg-ui-surface-muted text-ui-muted hover:bg-ui-border'
                        }`}
                    >
                        Bulan ini
                    </button>
                </div>

                {/* Status indicator */}
                <Circle 
                    className={`w-3 h-3 ${bgColorClass} fill-current`}
                    strokeWidth={0}
                />
            </div>

            {/* 3-line feedback */}
            <div className="space-y-1 mb-3">
                <p className={`text-sm font-semibold ${colorClass}`}>
                    {feedback.headline}
                </p>
                <p className="text-xs text-ui-muted">
                    {feedback.reason}
                </p>
                <p className="text-xs text-ui-text font-medium">
                    💡 {feedback.action}
                </p>
            </div>

            {/* Empty state CTA */}
            {feedback.isEmpty && onAddTransaction && (
                <div className="mt-2">
                    <button
                        onClick={onAddTransaction}
                        className="text-xs text-ui-primary font-medium hover:underline"
                    >
                        + Tambah transaksi
                    </button>
                </div>
            )}

            {/* Detail expand/collapse */}
            {!feedback.isEmpty && (
                <>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs text-ui-primary font-medium hover:underline mt-2"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                Sembunyikan detail
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                Lihat detail
                            </>
                        )}
                    </button>

                    {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-ui-border space-y-2">
                            <DetailRow 
                                label="Pemasukan" 
                                value={currentMetrics.pemasukan} 
                                positive 
                            />
                            <DetailRow 
                                label="Potongan" 
                                value={currentMetrics.potongan} 
                            />
                            <DetailRow 
                                label="Operasional" 
                                value={currentMetrics.bensin + currentMetrics.maintenance} 
                                sublabel={`Bensin ${formatRupiah(currentMetrics.bensin)} + Maintenance ${formatRupiah(currentMetrics.maintenance)}`}
                            />
                            <DetailRow 
                                label="Pengeluaran" 
                                value={currentMetrics.pengeluaran} 
                            />
                            <div className="pt-2 border-t border-ui-border">
                                <DetailRow 
                                    label="Net Cashflow" 
                                    value={currentMetrics.netCashflow} 
                                    bold
                                    positive={currentMetrics.netCashflow >= 0}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
}

function DetailRow({ label, value, sublabel, positive, bold }) {
    const valueColor = positive 
        ? 'text-ui-success' 
        : value < 0 
            ? 'text-ui-danger' 
            : 'text-ui-text';

    return (
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <p className={`text-xs ${bold ? 'font-semibold' : 'font-medium'} text-ui-muted`}>
                    {label}
                </p>
                {sublabel && (
                    <p className="text-xs text-ui-muted opacity-70 mt-0.5">
                        {sublabel}
                    </p>
                )}
            </div>
            <p className={`text-xs ${bold ? 'font-bold' : 'font-medium'} ${valueColor}`}>
                {formatRupiahWithSign(value)}
            </p>
        </div>
    );
}
