import { X } from 'lucide-react';
import PrimaryButton from './PrimaryButton';

/**
 * SubscriptionModal - High-conversion sales modal for PRO upgrade
 * Designed with psychological triggers and clear value proposition
 */
export default function SubscriptionModal({ isOpen, onClose, userEmail = '' }) {
    if (!isOpen) return null;

    // WhatsApp URL with pre-filled message
    const whatsappUrl = `https://wa.me/6285953937946?text=${encodeURIComponent(
        `Halo Admin Maximus, saya mau aktifkan PRO. Email Akun: ${userEmail}. Saya sudah transfer ke DANA.`
    )}`;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={handleOverlayClick}
        >
            {/* Main Container: Added max-h and flex-col to enable scrolling */}
            <div className="relative w-full max-w-md bg-ui-surface rounded-ui-xl shadow-2xl border border-ui-border max-h-[85vh] flex flex-col"
>
                
                {/* 1. Header Area (Fixed) */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-ui-background/80 hover:bg-ui-background text-ui-text transition-colors shadow-sm border border-ui-border/50"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Scrollable Content Area */}
                <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain">
                    
                    {/* HEADLINE */}
                    <div className="text-center space-y-2 mt-2">
                        <h2 className="text-2xl font-black text-red-600 uppercase tracking-tight leading-none">
                            ⛔ STOP BAKAR BENSIN!
                        </h2>
                        <p className="text-lg font-bold text-yellow-500 leading-tight">
                            Aktifkan Mode Gacor Maximus PRO sekarang.
                        </p>
                    </div>

                    {/* PAIN POINTS */}
                    <div className="space-y-3 p-4 bg-ui-background rounded-ui-lg border border-ui-border/50">
                        <p className="text-sm font-semibold text-ui-muted mb-2">Masih ngalamin ini?</p>
                        <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                                <span className="text-red-500 font-bold text-lg shrink-0">❌</span>
                                <p className="text-sm text-ui-text">Capek muter-muter tapi orderan anyep?</p>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="text-red-500 font-bold text-lg shrink-0">❌</span>
                                <p className="text-sm text-ui-text">Ngetem berjam-jam buang waktu?</p>
                            </div>
                        </div>
                    </div>

                    {/* VALUE PROPS */}
                    <div className="space-y-3 p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-ui-lg border border-yellow-500/30">
                        <p className="text-sm font-semibold text-yellow-600 mb-2">Dengan Maximus PRO:</p>
                        <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                                <span className="text-green-500 font-bold text-lg shrink-0">✅</span>
                                <p className="text-sm text-ui-text font-medium">Buka Peta Harta Karun (Titik Strategis Real-time)</p>
                            </div>
                            <div className="flex items-start space-x-2">
                                <span className="text-green-500 font-bold text-lg shrink-0">✅</span>
                                <p className="text-sm text-ui-text font-medium">Analisis Penghasilan & Jam Sibuk</p>
                            </div>
                        </div>
                    </div>

                    {/* PRICE ANCHOR */}
                    <div className="text-center p-4 bg-yellow-500/20 rounded-ui-lg border-2 border-yellow-500">
                        <p className="text-sm text-ui-muted mb-1">Hanya</p>
                        <p className="text-3xl font-black text-yellow-600">Rp 15.000 / Bulan</p>
                        <p className="text-xs text-ui-muted mt-2">
                            Lebih murah dari sebungkus rokok! 1x Tarikan langsung balik modal!
                        </p>
                    </div>

                    {/* INSTRUCTIONS */}
                    <div className="space-y-3 p-4 bg-ui-background rounded-ui-lg border border-ui-border">
                        <p className="text-sm font-semibold text-ui-text mb-2">Cara Upgrade:</p>
                        <ol className="space-y-2 text-sm text-ui-muted list-decimal list-inside">
                            <li>
                                Transfer <span className="font-bold text-ui-text">Rp 15.000</span> ke DANA: 
                                <div className="font-mono font-bold text-blue-500 text-lg my-1 select-all bg-blue-500/10 p-2 rounded text-center">
                                    085953937946
                                </div>
                            </li>
                            <li>Klik tombol di bawah untuk konfirmasi otomatis.</li>
                        </ol>
                    </div>

                    {/* CTA BUTTON */}
                    <div className="pt-2 pb-2">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full transform active:scale-95 transition-transform"
                        >
                            <PrimaryButton className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-lg flex items-center justify-center space-x-2 rounded-xl">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                <span>Kirim Bukti via WhatsApp</span>
                            </PrimaryButton>
                        </a>
                    </div>
                    
                    <p className="text-xs text-center text-ui-muted pb-2">
                        Aktivasi manual dalam 1-24 jam setelah verifikasi.
                    </p>
                </div>
            </div>
        </div>
    );
}
