import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isDestructive = false
}) {
    const confirmLabel = isDestructive ? 'Ya, Hapus' : 'Ya';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-ui-overlay backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={(event) => event.stopPropagation()}
                        className="relative z-10 w-full max-w-sm rounded-ui-xl bg-ui-surface p-5 sm:p-6 shadow-ui-lg border border-ui-border"
                    >
                        <div className="space-y-2">
                            <h3 className="text-lg sm:text-xl font-bold text-ui-text font-display break-words">{title}</h3>
                            <p className="text-sm sm:text-base text-ui-muted leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:flex-1 rounded-ui-lg border border-ui-border bg-ui-surface px-4 py-3 text-sm sm:text-base font-semibold text-ui-muted shadow-ui-sm transition hover:bg-ui-surface-muted press-effect min-h-[44px]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={`w-full sm:flex-1 rounded-ui-lg px-4 py-3 text-sm sm:text-base font-semibold shadow-ui-sm transition active:scale-[0.98] press-effect min-h-[44px] ${
                                    isDestructive
                                        ? 'bg-ui-danger text-white hover:bg-ui-danger/90'
                                        : 'bg-ui-primary text-ui-text hover:bg-ui-primary-strong'
                                }`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
