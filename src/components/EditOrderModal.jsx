import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { useSettings } from '../context/SettingsContext';

const parseLocalDateTime = (value) => {
    if (!value) return null;
    const [datePart, timePart] = value.split('T');
    if (!datePart || !timePart) return null;
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) return null;
    return new Date(year, month - 1, day, hour, minute);
};

const formatLocalDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return format(date, "yyyy-MM-dd'T'HH:mm");
};

const formatUtcDateTime = (value) => {
    const date = parseLocalDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toISOString();
};

export default function EditOrderModal({ isOpen, onClose, order, onSave, showToast }) {
    const { settings } = useSettings();
    const [price, setPrice] = useState('');
    const [distance, setDistance] = useState('');
    const [createdAt, setCreatedAt] = useState('');
    const [commissionRate, setCommissionRate] = useState('');
    const [createdAtError, setCreatedAtError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const title = useMemo(() => (order ? `Edit Order #${order.id}` : 'Edit Order'), [order]);

    const getInitialGrossPrice = () => {
        if (!order) return '';
        const grossValue = parseFloat(order.gross_price);
        if (Number.isFinite(grossValue)) return grossValue.toString();
        const rateValue = parseFloat(order.commission_rate);
        const fallbackRate = Number.isFinite(rateValue)
            ? rateValue
            : parseFloat(settings.defaultCommission) || 0;
        const netValue = parseFloat(order.net_profit ?? order.price);
        if (!Number.isFinite(netValue)) return '';
        if (fallbackRate >= 0 && fallbackRate < 1) {
            return (netValue / (1 - fallbackRate)).toString();
        }
        return netValue.toString();
    };

    useEffect(() => {
        if (!isOpen || !order) return;
        setPrice(getInitialGrossPrice());
        setDistance(order.distance?.toString() ?? '');
        setCreatedAt(formatLocalDateTime(order.created_at));
        const initialCommission = Number.isFinite(parseFloat(order.commission_rate))
            ? parseFloat(order.commission_rate)
            : parseFloat(settings.defaultCommission) || 0;
        setCommissionRate(initialCommission.toString());
        setCreatedAtError(false);
    }, [isOpen, order, settings.defaultCommission]);

    const handleCreatedAtChange = (event) => {
        const { value } = event.target;
        setCreatedAt(value);
        if (createdAtError && formatUtcDateTime(value)) {
            setCreatedAtError(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!order || isSubmitting) return;

        const formattedCreatedAt = formatUtcDateTime(createdAt);
        if (!formattedCreatedAt) {
            setCreatedAtError(true);
            if (showToast) {
                showToast('Tanggal & waktu wajib diisi dengan benar.', 'error');
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const grossPrice = price ? parseFloat(price) : 0;
            const commissionValue = commissionRate ? parseFloat(commissionRate) : 0;
            const appFee = grossPrice * commissionValue;
            const netProfit = grossPrice - appFee;
            const updatedOrder = {
                ...order,
                price: grossPrice,
                gross_price: grossPrice,
                commission_rate: commissionValue,
                app_fee: appFee,
                net_profit: netProfit,
                distance: distance ? parseFloat(distance) : 0,
                created_at: formattedCreatedAt
            };

            await onSave(updatedOrder);
        } catch (error) {
            console.error('Error updating order:', error);
            if (showToast) {
                showToast('Gagal menyimpan perubahan order.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-ui-overlay backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-ui-surface w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-ui-lg pointer-events-auto relative z-10 safe-bottom-padding"
                        style={{
                            maxHeight: 'calc(100vh - env(safe-area-inset-top, 20px) - 20px)',
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        {/* Handle bar for mobile */}
                        <div className="flex justify-center mb-4 sm:hidden">
                            <div className="w-10 h-1 bg-ui-border rounded-full" />
                        </div>

                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-ui-text font-display">{title}</h2>
                                <p className="text-xs text-ui-muted">Time travel untuk edit tanggal transaksi.</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 bg-ui-surface-muted rounded-full hover:bg-ui-border transition-colors press-effect"
                            >
                                <X size={20} className="text-ui-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 pb-20 sm:pb-8">
                            <div>
                                <label className="block text-xs font-bold text-ui-muted uppercase tracking-wider mb-2">Omzet (Rp)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(event) => setPrice(event.target.value)}
                                    className="w-full p-3 bg-ui-surface-muted rounded-ui-xl border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none text-ui-text placeholder-ui-muted transition-all"
                                    style={{
                                        fontSize: 'max(16px, 0.875rem)',
                                        minHeight: '48px',
                                        touchAction: 'manipulation'
                                    }}
                                    placeholder="Masukkan nominal"
                                    required
                                    inputMode="numeric"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ui-muted uppercase tracking-wider mb-2">Komisi</label>
                                <select
                                    value={commissionRate}
                                    onChange={(event) => setCommissionRate(event.target.value)}
                                    className="w-full p-3 bg-ui-surface-muted rounded-ui-xl border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none text-ui-text transition-all"
                                    style={{
                                        fontSize: 'max(16px, 0.875rem)',
                                        minHeight: '48px',
                                        touchAction: 'manipulation'
                                    }}
                                >
                                    <option value="0.1">Prioritas (10%)</option>
                                    <option value="0.15">Reguler (15%)</option>
                                    {![0.1, 0.15].includes(parseFloat(settings.defaultCommission)) && (
                                        <option value={settings.defaultCommission}>
                                            Default Profil ({Math.round(settings.defaultCommission * 100)}%)
                                        </option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ui-muted uppercase tracking-wider mb-2">Jarak (Km)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={distance}
                                    onChange={(event) => setDistance(event.target.value)}
                                    className="w-full p-3 bg-ui-surface-muted rounded-ui-xl border border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30 outline-none text-ui-text placeholder-ui-muted transition-all"
                                    style={{
                                        fontSize: 'max(16px, 0.875rem)',
                                        minHeight: '48px',
                                        touchAction: 'manipulation'
                                    }}
                                    placeholder="0"
                                    inputMode="decimal"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-ui-muted uppercase tracking-wider mb-2">Tanggal & Waktu</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-3 top-3.5 text-ui-muted pointer-events-none" style={{ zIndex: 1 }} />
                                    <input
                                        type="datetime-local"
                                        value={createdAt}
                                        onChange={handleCreatedAtChange}
                                        className={`w-full pl-10 p-3 bg-ui-surface-muted rounded-ui-xl border outline-none text-ui-text transition-all ${
                                            createdAtError
                                                ? 'border-ui-danger focus:border-ui-danger focus:ring-2 focus:ring-ui-danger/30'
                                                : 'border-ui-border focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/30'
                                        }`}
                                        style={{
                                            fontSize: 'max(16px, 0.875rem)',
                                            minHeight: '48px',
                                            touchAction: 'manipulation'
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Button - Sticky */}
                            <div className="fixed bottom-0 left-0 right-0 sm:static p-4 sm:p-0 bg-gradient-to-t from-ui-surface via-ui-surface to-transparent sm:bg-none"
                                style={{
                                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
                                    zIndex: 20
                                }}
                            >
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-3 sm:py-4 rounded-ui-xl font-bold text-base sm:text-lg shadow-ui-md flex items-center justify-center space-x-2 transition-all press-effect min-h-[48px] ${
                                        isSubmitting
                                            ? 'bg-ui-surface-muted text-ui-muted cursor-not-allowed shadow-none'
                                            : 'bg-ui-inverse text-ui-primary hover:bg-ui-inverse/90 active:scale-[0.98]'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-2 border-ui-primary/30 border-t-ui-primary rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            <span>Simpan Perubahan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
