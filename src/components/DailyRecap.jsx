
import { useState, useEffect } from 'react';
import { Coffee } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabaseClient';

export default function DailyRecap({ session }) {
    const { settings } = useSettings();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDailyOrders();
    }, [session]);

    const fetchDailyOrders = async () => {
        try {
            setLoading(true);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const totalProfit = orders.reduce((acc, order) => acc + (order.net_profit || 0), 0);
    const totalOrders = orders.length;
    const progress = Math.min(100, Math.max(0, (totalProfit / settings.dailyTarget) * 100));

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    // Helper to format time from ISO string
    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-maxim-bg p-4 space-y-4 pb-24 text-maxim-dark items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maxim-dark"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-maxim-bg p-4 space-y-4 pb-24 text-maxim-dark">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Pendapatan</p>
                        <h2 className="text-3xl font-bold text-maxim-dark mt-1">
                            <span className="text-sm font-normal text-gray-400 mr-1">Rp</span>
                            {formatCurrency(totalProfit)}
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total Order</p>
                        <h2 className="text-3xl font-bold text-maxim-dark mt-1">{totalOrders}</h2>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Target: Rp {formatCurrency(settings.dailyTarget)}</span>
                        <span className="font-bold text-maxim-dark">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-maxim-yellow h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center px-2">
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Riwayat Order</h3>
                {/* Clear History button removed as we are syncing with cloud DB now. Deleting would need DB delete. */}
            </div>

            {/* Order List */}
            <div className="space-y-3 flex-1 overflow-y-auto">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                        <div className="bg-gray-100 p-4 rounded-full">
                            <Coffee className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Belum ada tarikan hari ini.</p>
                            <p className="text-xs text-gray-300 mt-1">Semangat cari cuan!</p>
                        </div>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-medium mb-0.5">{formatTime(order.created_at)}</span>
                                <span className="text-xs font-medium text-gray-300">
                                    {order.distance} km
                                </span>
                            </div>
                            <div className={`text-base font-bold ${order.net_profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {order.net_profit > 0 ? '+' : ''}{formatCurrency(order.net_profit)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
