import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

export default function ExpenseModal({ isOpen, onClose, onSave, showToast }) {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Bensin');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setAmount('');
        setCategory('Bensin');
        setNote('');
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const categories = [
        { id: 'Bensin', label: 'Bensin', color: 'bg-ui-danger/10 text-ui-danger' },
        { id: 'Makan', label: 'Makan', color: 'bg-ui-warning/10 text-ui-warning' },
        { id: 'Service', label: 'Service', color: 'bg-ui-info/10 text-ui-info' },
        { id: 'Lainnya', label: 'Lainnya', color: 'bg-ui-muted/10 text-ui-muted' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || isSubmitting) return;

        const amountValue = parseFloat(amount);
        if (Number.isNaN(amountValue) || amountValue < 0) {
            if (showToast) {
                showToast('Jumlah pengeluaran tidak valid.', 'error');
            }
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                amount,
                category,
                note
            });
            resetForm();
            onClose();

        } catch (error) {
            console.error('Error saving expense:', error);
            if (showToast) {
                showToast('Gagal menyimpan pengeluaran.', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-ui-overlay backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-ui-surface w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-ui-lg pointer-events-auto relative z-10 max-h-[85vh] overflow-y-auto safe-bottom-padding"
                    >
                        {/* Handle bar for mobile */}
                        <div className="flex justify-center mb-4 sm:hidden">
                            <div className="w-10 h-1 bg-ui-border rounded-full" />
                        </div>

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-ui-text font-display">Catat Pengeluaran</h2>
                            <button 
                                onClick={onClose} 
                                className="p-2 bg-ui-surface-muted rounded-full hover:bg-ui-border transition-colors press-effect"
                            >
                                <X size={20} className="text-ui-muted" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Amount Input */}
                            <div>
                                <label className="block text-xs font-bold text-ui-muted uppercase tracking-wider mb-2">Jumlah (Rp)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-ui-muted font-bold">Rp</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-10 w-full p-4 text-2xl font-bold bg-ui-surface-muted rounded-ui-xl border border-ui-border focus:border-ui-danger focus:ring-2 focus:ring-ui-danger/30 outline-none transition-all text-ui-text placeholder-ui-muted"
                                        placeholder="0"
                                        min="0"
                                        step="1000"
                                        autoFocus
                                        required
                                        inputMode="numeric"
                                    />
                                </div>

                                {/* Quick Chips */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {[5000, 10000, 15000, 20000, 50000].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAmount(val.toString())}
                                            className="px-3 py-2 bg-ui-surface-muted border border-ui-border rounded-ui-md text-xs font-bold text-ui-muted active:bg-ui-danger active:text-white active:border-ui-danger transition-colors press-effect"
                                        >
                                            {val / 1000}k
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="block text-xs font-bold text-ui-muted uppercase tracking-wider mb-2">Kategori</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`p-3 rounded-ui-xl border-2 text-sm font-semibold transition-all press-effect ${category === cat.id
                                                ? 'border-ui-danger bg-ui-danger/10 text-ui-danger'
                                                : 'border-transparent bg-ui-surface-muted text-ui-muted hover:bg-ui-border'
                                                }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-xs font-bold text-ui-muted uppercase tracking-wider mb-2">Catatan (Opsional)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full p-3 bg-ui-surface-muted rounded-ui-xl border border-ui-border focus:border-ui-danger focus:ring-2 focus:ring-ui-danger/30 outline-none text-sm text-ui-text placeholder-ui-muted transition-all"
                                    placeholder="Contoh: Pertalite Full Tank"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!amount || isSubmitting}
                                className={`w-full py-4 rounded-ui-xl font-bold text-lg shadow-ui-md flex items-center justify-center space-x-2 transition-all press-effect ${!amount || isSubmitting
                                    ? 'bg-ui-surface-muted text-ui-muted cursor-not-allowed shadow-none'
                                    : 'bg-ui-danger text-white hover:bg-ui-danger/90 active:scale-[0.98]'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Simpan Pengeluaran</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
