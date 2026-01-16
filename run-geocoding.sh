#!/bin/bash

# Memuat environment variables
export VITE_SUPABASE_URL="https://haywceiagliqoqxixaks.supabase.co"

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY belum diset."
    echo "Export key dengan perintah: export SUPABASE_SERVICE_ROLE_KEY='ey...'"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "Target URL: $VITE_SUPABASE_URL"
echo "🚀 Running GEOCODING (OpenStreetMap/Nominatim)..."
echo "ℹ️  Kecepatan dibatasi (1.5 detik/req) karena menggunakan layanan GRATIS."
echo ""

npx tsx scripts/geocode_strategic_spots_nominatim.ts
