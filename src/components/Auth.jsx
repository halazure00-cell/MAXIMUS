import { useState } from 'react'
import { supabase, isSupabaseConfigured, supabaseConfigError } from '../lib/supabaseClient'
import { useToast } from '../context/ToastContext'
import Card from './Card'
import PrimaryButton from './PrimaryButton'
import SectionTitle from './SectionTitle'

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const { showToast } = useToast()

    const handleLogin = async (event) => {
        event.preventDefault()

        // Guard: jangan coba login kalau Supabase belum dikonfigurasi
        if (!isSupabaseConfigured) {
            const errText =
                supabaseConfigError ||
                'Konfigurasi Supabase belum lengkap. Lengkapi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.'
            setErrorMessage(errText)
            setMessage('')
            showToast(errText, 'error')
            return
        }

        setLoading(true)
        setErrorMessage('')
        setMessage('')

        // Redirect yang “rapi”: pakai VITE_SITE_URL kalau ada, fallback ke origin saat ini
        const redirectTo =
            (import.meta.env.VITE_SITE_URL && import.meta.env.VITE_SITE_URL.trim()) ||
            window.location.origin

        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
                emailRedirectTo: redirectTo
            }
        })

        if (error) {
            const errorText = error.error_description || error.message
            setErrorMessage(errorText)
            showToast(errorText, 'error')
        } else {
            setMessage('Check your email for the login link!')
            setErrorMessage('')
        }

        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-ui-background p-4">
            <Card className="w-full max-w-md p-8 shadow-ui-lg">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-ui-primary-soft rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-ui-text"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.131A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.85.577-4.147"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-ui-text mb-1 font-display">Maximus Driver</h1>
                    <SectionTitle className="text-[11px] tracking-[0.25em] text-ui-muted">
                        Masuk untuk menyimpan riwayat order
                    </SectionTitle>
                </div>

                {!isSupabaseConfigured && (
                    <div
                        className="bg-ui-warning/10 border border-ui-warning/30 text-ui-warning px-4 py-3 rounded-ui-md relative mb-4"
                        role="alert"
                    >
                        <p className="text-sm font-semibold">Konfigurasi Supabase belum lengkap.</p>
                        <p className="text-sm text-ui-text/80">
                            {supabaseConfigError ||
                                'Lengkapi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env untuk melanjutkan.'}
                        </p>
                    </div>
                )}

                {message ? (
                    <div
                        className="bg-ui-success/10 border border-ui-success/30 text-ui-success px-4 py-3 rounded-ui-md relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">{message}</span>
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        {errorMessage ? (
                            <div
                                className="bg-ui-danger/10 border border-ui-danger/30 text-ui-danger px-4 py-3 rounded-ui-md relative"
                                role="alert"
                            >
                                <span className="block sm:inline">{errorMessage}</span>
                            </div>
                        ) : null}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-ui-text mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                className="w-full px-4 py-2 border border-ui-border rounded-ui-md focus:ring-2 focus:ring-ui-primary focus:border-transparent outline-none transition-all bg-ui-surface text-ui-text placeholder:text-ui-muted"
                                style={{
                                    fontSize: 'max(16px, 1rem)',
                                    minHeight: '48px',
                                    touchAction: 'manipulation'
                                }}
                                type="email"
                                placeholder="nama@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                inputMode="email"
                            />
                        </div>

                        <PrimaryButton className="w-full py-3 text-base font-bold shadow-ui-md" disabled={loading || !isSupabaseConfigured}>
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-ui-text"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Mengirim Link...
                                </span>
                            ) : (
                                <span>Kirim Magic Link</span>
                            )}
                        </PrimaryButton>
                    </form>
                )}

                <p className="mt-8 text-center text-xs text-ui-muted">Powered by Supabase</p>
            </Card>
        </div>
    )
}