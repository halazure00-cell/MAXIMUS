/**
 * Heatmap QA Debug View
 * 
 * Dev-only component to show score breakdown and validate recommendations
 * Enable by adding ?debug=heatmap to URL
 * 
 * PRO FEATURE: Access requires active PRO subscription
 */

import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getCachedOrders } from '../lib/localDb';
import { fetchStrategicSpots } from '../lib/db';
import { 
    aggregateOrdersToSpots, 
    getBaselineMetrics 
} from '../lib/heatmapAggregator';
import { 
    generateRecommendations, 
    createContext,
    getTimePeriod,
    getDayType
} from '../lib/heatmapEngine';
import SubscriptionModal from './SubscriptionModal';
import PrimaryButton from './PrimaryButton';

export default function HeatmapDebugView() {
    const { session, isPro } = useSettings();
    const [debugData, setDebugData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

    useEffect(() => {
        async function loadDebugData() {
            if (!session?.user) return;

            try {
                setLoading(true);
                const orders = await getCachedOrders(session.user.id);
                const spots = await fetchStrategicSpots();
                
                // Aggregate with debug mode
                const cells = aggregateOrdersToSpots(orders, spots, { 
                    windowDays: 30,
                    decayDays: 7 
                });

                // Generate recommendations with debug breakdown
                const baseline = getBaselineMetrics(orders);
                const context = createContext({
                    userLat: -6.917, // Example location (Bandung)
                    userLon: 107.619,
                    baselineNPH: baseline.baselineNPH,
                });

                const recs = generateRecommendations(cells, context, { 
                    limit: 10, 
                    debugMode: true // Keep breakdown
                });

                setDebugData({
                    totalOrders: orders.length,
                    totalCells: cells.length,
                    recommendations: recs,
                    baseline: baseline,
                    context: {
                        timePeriod: getTimePeriod(),
                        dayType: getDayType(),
                        baselineNPH: baseline.baselineNPH,
                    }
                });
            } catch (error) {
                console.error('Debug view error:', error);
            } finally {
                setLoading(false);
            }
        }

        loadDebugData();
    }, [session]);

    if (loading) {
        return <div className="p-4 bg-ui-surface">Loading debug data...</div>;
    }

    // Feature Gate: Show lock overlay if user is not PRO
    if (!isPro) {
        return (
            <>
                <div className="relative min-h-screen bg-ui-surface">
                    {/* Blurred Preview */}
                    <div className="blur-md opacity-30 p-4 bg-ui-surface text-xs font-mono">
                        <h1 className="text-lg font-bold mb-4 text-ui-primary">🔍 Heatmap QA Debug View</h1>
                        <div className="mb-4 p-3 bg-ui-background rounded-ui-lg">
                            <h2 className="font-bold mb-2 text-ui-text">Summary</h2>
                            <div className="space-y-1 text-ui-muted">
                                <div>Total Orders: ███</div>
                                <div>Total Cells: ███</div>
                                <div>Recommendations: ███</div>
                            </div>
                        </div>
                    </div>

                    {/* Lock Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-ui-background/95 backdrop-blur-sm">
                        <div className="max-w-md p-8 text-center space-y-6">
                            {/* Lock Icon */}
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <svg 
                                        className="w-10 h-10 text-yellow-500" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Lock Message */}
                            <div className="space-y-3">
                                <h2 className="text-2xl font-bold text-ui-text">
                                    🔒 Fitur Terkunci
                                </h2>
                                <p className="text-lg text-ui-muted">
                                    Upgrade ke <span className="text-yellow-500 font-bold">PRO</span> untuk melihat titik gacor.
                                </p>
                                <p className="text-sm text-ui-muted">
                                    Dapatkan akses ke Peta Harta Karun dan analisis lengkap untuk maksimalkan penghasilan harian.
                                </p>
                            </div>

                            {/* CTA Button */}
                            <PrimaryButton
                                onClick={() => setShowSubscriptionModal(true)}
                                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-base shadow-lg"
                            >
                                Upgrade ke PRO - Rp 15.000/Bulan
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                {/* Subscription Modal */}
                <SubscriptionModal
                    isOpen={showSubscriptionModal}
                    onClose={() => setShowSubscriptionModal(false)}
                    userEmail={session?.user?.email || ''}
                />
            </>
        );
    }

    if (!debugData) {
        return <div className="p-4 bg-ui-surface text-ui-danger">No debug data available</div>;
    }

    return (
        <div className="p-4 bg-ui-surface text-xs font-mono overflow-auto">
            <h1 className="text-lg font-bold mb-4 text-ui-primary">🔍 Heatmap QA Debug View</h1>
            
            {/* Summary */}
            <div className="mb-4 p-3 bg-ui-background rounded-ui-lg">
                <h2 className="font-bold mb-2 text-ui-text">Summary</h2>
                <div className="space-y-1 text-ui-muted">
                    <div>Total Orders: {debugData.totalOrders}</div>
                    <div>Total Cells: {debugData.totalCells}</div>
                    <div>Recommendations: {debugData.recommendations.length}</div>
                    <div>Time Period: {debugData.context.timePeriod}</div>
                    <div>Day Type: {debugData.context.dayType}</div>
                    <div>Baseline NPH: Rp {debugData.context.baselineNPH.toLocaleString()}/hr</div>
                </div>
            </div>

            {/* Recommendations with Breakdown */}
            <div className="space-y-3">
                <h2 className="font-bold text-ui-text">Recommendations (Score Breakdown)</h2>
                {debugData.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-ui-background rounded-ui-lg border border-ui-border">
                        <div className="font-bold text-ui-primary mb-2">
                            #{rec.rank} {rec.spot_name || rec.cell_id}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-ui-muted">
                            <div>Final Score:</div>
                            <div className="text-ui-success font-bold">{rec.score.toFixed(2)}</div>
                            
                            <div>Sample Count:</div>
                            <div className={rec.order_count < 5 ? 'text-ui-danger' : 'text-ui-text'}>
                                {rec.order_count} orders
                            </div>
                            
                            <div>Distance:</div>
                            <div>{rec.distance_km?.toFixed(1)} km</div>
                            
                            <div>Deadhead Cost:</div>
                            <div>Rp {rec.deadhead_cost?.toFixed(0)}</div>
                        </div>

                        {rec.breakdown && (
                            <details className="mt-3">
                                <summary className="cursor-pointer text-ui-primary hover:underline">
                                    Show detailed breakdown
                                </summary>
                                <div className="mt-2 p-2 bg-ui-surface-muted rounded space-y-1">
                                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                                        <div>NPH (raw):</div>
                                        <div>Rp {rec.breakdown.nph_raw.toLocaleString()}</div>
                                        
                                        <div>NPH (norm):</div>
                                        <div>{rec.breakdown.nph_norm.toFixed(3)}</div>
                                        
                                        <div>CR (raw):</div>
                                        <div>{rec.breakdown.cr_raw.toFixed(2)} orders/hr</div>
                                        
                                        <div>CR (norm):</div>
                                        <div>{rec.breakdown.cr_norm.toFixed(3)}</div>
                                        
                                        <div>Deadhead (raw):</div>
                                        <div>Rp {rec.breakdown.dc_raw.toFixed(0)}</div>
                                        
                                        <div>Deadhead (norm):</div>
                                        <div>{rec.breakdown.dc_norm.toFixed(3)}</div>
                                        
                                        <div>Volatility (raw):</div>
                                        <div>{rec.breakdown.v_raw.toFixed(3)}</div>
                                        
                                        <div>Volatility (norm):</div>
                                        <div>{rec.breakdown.v_norm.toFixed(3)}</div>
                                        
                                        <div>Confidence:</div>
                                        <div className={rec.breakdown.confidence < 0.5 ? 'text-ui-danger' : 'text-ui-success'}>
                                            {rec.breakdown.confidence.toFixed(2)}
                                        </div>
                                        
                                        <div>Conf. Multiplier:</div>
                                        <div>{rec.breakdown.confidence_multiplier.toFixed(3)}</div>
                                        
                                        <div>Base Score:</div>
                                        <div>{rec.breakdown.base_score.toFixed(3)}</div>
                                    </div>
                                </div>
                            </details>
                        )}
                    </div>
                ))}
            </div>

            {debugData.recommendations.length === 0 && (
                <div className="p-4 bg-ui-danger/10 border border-ui-danger/30 rounded-ui-lg text-ui-danger">
                    ⚠️ No recommendations generated. Possible issues:
                    <ul className="list-disc ml-4 mt-2">
                        <li>Insufficient orders (&lt;5)</li>
                        <li>No cells match current time period</li>
                        <li>All cells below minimum score threshold (3.0)</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
