import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, SkipForward, Target, TrendingUp, History, Settings, MapPin } from 'lucide-react';

/**
 * OnboardingSlides - First-time onboarding experience
 * Shows once after first successful session
 * 3-5 simple slides explaining MAXIMUS basics
 */
export default function OnboardingSlides({ onComplete, onSkip }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            icon: Target,
            title: 'Selamat Datang di MAXIMUS',
            description: 'Asisten keputusan pintar untuk driver ojol. MAXIMUS membantu Anda memaksimalkan profit dengan data real-time.',
            color: 'text-ui-primary'
        },
        {
            icon: TrendingUp,
            title: 'Catat Income & Expense',
            description: 'Mulai dengan mencatat pendapatan dan pengeluaran Anda di halaman Home. Lihat estimasi profit bersih secara instan.',
            color: 'text-ui-success'
        },
        {
            icon: MapPin,
            title: 'Lihat Rekomendasi',
            description: 'Buka halaman Insight untuk melihat heatmap dan rekomendasi lokasi terbaik berdasarkan data historis Anda.',
            color: 'text-ui-warning'
        },
        {
            icon: History,
            title: 'Review & Sync',
            description: 'Pantau riwayat transaksi di halaman History. Data Anda otomatis tersinkronisasi dan aman.',
            color: 'text-ui-info'
        },
        {
            icon: Settings,
            title: 'Sesuaikan Pengaturan',
            description: 'Atur target harian, jenis kendaraan, dan preferensi lainnya di halaman Profile untuk hasil yang lebih akurat.',
            color: 'text-ui-accent'
        }
    ];

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onSkip();
    };

    const slide = slides[currentSlide];
    const Icon = slide.icon;

    return (
        <div className="fixed inset-0 z-[9999] bg-ui-background flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className={`p-6 rounded-full bg-ui-surface-muted ${slide.color}`}>
                                <Icon size={48} strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-ui-text mb-4">
                            {slide.title}
                        </h2>

                        {/* Description */}
                        <p className="text-ui-text-secondary text-base leading-relaxed mb-8">
                            {slide.description}
                        </p>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 mb-8">
                            {slides.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-2 rounded-full transition-all ${
                                        index === currentSlide
                                            ? 'w-8 bg-ui-primary'
                                            : 'w-2 bg-ui-border'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={handleSkip}
                                className="text-sm text-ui-muted hover:text-ui-text transition-colors flex items-center gap-1"
                            >
                                <SkipForward size={14} />
                                Lewati
                            </button>

                            <button
                                onClick={handleNext}
                                className="px-6 py-3 bg-ui-primary text-ui-background rounded-ui-lg hover:bg-ui-primary/90 transition-colors flex items-center gap-2 font-medium"
                            >
                                {currentSlide === slides.length - 1 ? 'Mulai' : 'Lanjut'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
