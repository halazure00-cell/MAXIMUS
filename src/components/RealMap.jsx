import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { supabase } from '../lib/supabaseClient';

// --- Custom Icons Setup ---
// We'll use simple colored markers via DivIcon or basic Leaflet configuration.
// For reliability without external assets, we define custom colored SVGs or similar.

const createCustomIcon = (color) => {
    // Simple SVG marker string
    const svg = `
        <svg viewBox="0 0 24 24" width="30" height="42" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="9" r="3" fill="white"/>
        </svg>
    `;
    return L.divIcon({
        className: 'custom-pin', // Add empty class to reset default
        html: svg,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -45]
    });
};

const BlueIcon = createCustomIcon('#3B82F6'); // Timur
const RedIcon = createCustomIcon('#EF4444');  // Pusat-Utara / Other

const BANDUNG_CENTER = [-6.9175, 107.6191];

// --- Sub-components for Overlay UI ---

function StrategyCard({ recommendation }) {
    if (!recommendation) return null;

    return (
        <div className="absolute top-4 left-4 right-4 z-[400] mx-auto max-w-sm">
            <div className={`
                backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4
                ${recommendation.isFree ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90' : 'bg-gradient-to-r from-slate-900/90 to-slate-800/90'}
                 text-white transition-all duration-500
            `}>
                <div className="flex items-start gap-3">
                    <div className="text-3xl animate-pulse">
                        {recommendation.isFree ? '🦅' : '🎯'}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight mb-1 font-outfit">
                            {recommendation.title}
                        </h3>
                        <p className="text-sm font-light opacity-90 leading-snug">
                            {recommendation.subtitle}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SOPTimer() {
    const [timeLeft, setTimeLeft] = useState(null); // null = not started
    const [isActive, setIsActive] = useState(false);
    const audioRef = useRef(null);

    const START_TIME = 12 * 60; // 12 minutes in seconds

    useEffect(() => {
        let interval;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Timer finished
            setIsActive(false);
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Audio play failed", e));
                if (navigator.vibrate) navigator.vibrate([500, 200, 500]); // Vibrate pattern
            }
            alert("⏰ WAKTU HABIS! SOP: PINDAH SPOT SEKARANG (1-2KM)!");
            setTimeLeft(null); // Reset
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        if (isActive) {
            setIsActive(false);
            setTimeLeft(null);
        } else {
            setTimeLeft(START_TIME);
            setIsActive(true);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="absolute bottom-6 right-4 z-[400]">
            {/* Hidden Audio Element for Alert */}
            <audio ref={audioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" />

            <button
                onClick={toggleTimer}
                className={`
                    flex flex-col items-center justify-center w-20 h-20 rounded-full shadow-2xl border-4
                    transition-all duration-300 active:scale-95
                    ${isActive
                        ? 'bg-red-600 border-red-400 animate-pulse'
                        : 'bg-slate-900 border-cyan-400 hover:border-cyan-300'}
                `}
            >
                {isActive ? (
                    <>
                        <span className="text-xl font-bold text-white font-mono">{formatTime(timeLeft)}</span>
                        <span className="text-[10px] text-white/80 font-bold">STOP</span>
                    </>
                ) : (
                    <>
                        <span className="text-2xl">⏱️</span>
                        <span className="text-[10px] font-bold text-cyan-400 mt-1">SOP 12'</span>
                    </>
                )}
            </button>
        </div>
    );
}

// --- Main Map Component ---

export default function RealMap() {
    const [strategicSpots, setStrategicSpots] = useState([]);
    const [currentRecommendation, setCurrentRecommendation] = useState(null);
    const [userPos, setUserPos] = useState(null); // Initialize as null per request
    const [isLoading, setIsLoading] = useState(true); // Loading state

    // 1. Fetch Data
    useEffect(() => {
        const fetchSpots = async () => {
            try {
                const { data, error } = await supabase
                    .from('strategic_spots')
                    .select('*');

                if (error) {
                    console.error('Error fetching spots:', error);
                } else {
                    setStrategicSpots(data || []);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpots();

        // Simulating user movement around center for "Real" feel
        // In real app, this would be navigator.geolocation.watchPosition
        setUserPos(BANDUNG_CENTER); // Set initial mock position

        const interval = setInterval(() => {
            setUserPos(prev => {
                if (!prev) return BANDUNG_CENTER;
                return [
                    prev[0] + (Math.random() - 0.5) * 0.0002,
                    prev[1] + (Math.random() - 0.5) * 0.0002
                ];
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // 2. "The Brain" - Live Recommendation Logic
    useEffect(() => {
        const updateRecommendation = () => {
            if (!strategicSpots.length) return;

            const currentHour = new Date().getHours();

            // Find ALL matching spots for current hour
            const activeSpots = strategicSpots.filter(spot => {
                // Handle cases where time might span midnight (e.g. 22 to 02) if logic needed, 
                // but simple start <= curr < end is verified per request.
                // Assuming standard "start_hour" and "end_hour" integers.
                return spot.start_hour <= currentHour && spot.end_hour > currentHour;
            });

            if (activeSpots.length > 0) {
                // Pick the best one? Or just the first one. 
                // Let's pick based on Strategy priority if multiple? 
                // For now, take the first one or a random one to rotate if many match.
                const spot = activeSpots[0];

                setCurrentRecommendation({
                    isFree: false,
                    title: `JAM ${currentHour}:00 - Geser ke ${spot.name}!`,
                    subtitle: `Strategi: ${spot.notes || 'Standby di area ini.'}`
                });
            } else {
                setCurrentRecommendation({
                    isFree: true,
                    title: `JAM ${currentHour}:00 - ZONA BEBAS`,
                    subtitle: "Ikuti Insting / Cek Cluster Driver Terdekat"
                });
            }
        };

        const timer = setInterval(updateRecommendation, 60000); // Check every minute
        updateRecommendation(); // Initial check after data load (needs strategicSpots dependency)

        return () => clearInterval(timer);
    }, [strategicSpots]);

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-t-cyan-400 border-white/20 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-outfit animate-pulse">Loading Live Map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-64px)] relative bg-slate-900">
            <StrategyCard recommendation={currentRecommendation} />
            <SOPTimer />

            <MapContainer
                center={BANDUNG_CENTER} // Static center to prevent crash if userPos is null
                zoom={12}
                zoomControl={false}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Position Guard */}
                {userPos && (
                    <Marker position={userPos}>
                        <Popup>
                            <span className="font-bold text-gray-800">Posisi Anda</span>
                        </Popup>
                    </Marker>
                )}

                {/* Strategic Spots with Safety Guard */}
                {strategicSpots.map((spot) => {
                    // Safety Guard: Check if coordinates exist
                    if (!spot.latitude || !spot.longitude) return null;

                    // Determine Color
                    // Strategy A (Timur) -> Blue
                    // Strategy B (Pusat-Utara) -> Red
                    // Fallback -> Red
                    const isTimur = spot.strategy && spot.strategy.toLowerCase().includes('timur');
                    const icon = isTimur ? BlueIcon : RedIcon;

                    // Parse coords if text, or assume columns latitude/longitude
                    // Assuming table has latitude and longitude columns.
                    // If they are in a 'coords' array column, adjust accordingly.
                    // Safest: check if latitude/longitude exist, else try coords.
                    const position = [spot.latitude, spot.longitude];

                    return (
                        <Marker
                            key={spot.id}
                            position={position}
                            icon={icon}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1">
                                    <h3 className="font-bold text-sm text-gray-900 mb-1">{spot.name}</h3>
                                    <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600 mb-2">
                                        ⏰ {spot.start_hour}:00 - {spot.end_hour}:00
                                    </div>
                                    <p className="text-xs text-gray-700 italic">
                                        "{spot.notes}"
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

            </MapContainer>
        </div>
    );
}
