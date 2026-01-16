#!/bin/bash

# Memuat environment variables
export VITE_SUPABASE_URL="https://haywceiagliqoqxixaks.supabase.co"
# export VITE_SUPABASE_ANON_KEY="..." # Tidak dipakai di script ini

# Script akan menggunakan .env untuk service role key dan google places api key
# Pastikan Anda sudah menambahkan ke .env atau export manual:
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
# GOOGLE_PLACES_API_KEY=<your-google-places-api-key>

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY belum diset."
    exit 1
fi

# Validasi format key (Basic check)
if [[ "$SUPABASE_SERVICE_ROLE_KEY" == sb_publishable_* ]]; then
    echo "❌ Error: Key yang Anda masukkan terlihat seperti 'anon/public' key (diawali sb_publishable)."
    echo "⚠️  Script ini membutuhkan SERVICE ROLE SECRET (biasanya diawali 'ey...' dan panjang)."
    echo ""
    echo "Cara mendapatkan SERVICE ROLE KEY yang benar:"
    echo "1. Buka Dashboard: https://supabase.com/dashboard/project/haywceiagliqoqxixaks/settings/api"
    echo "2. Lihat bagian 'Project API keys'"
    echo "3. Copy key yang labelnya 'service_role' (secret)"
    echo ""
    exit 1
fi

if [ -z "$GOOGLE_PLACES_API_KEY" ]; then
    echo "❌ Error: GOOGLE_PLACES_API_KEY belum diset."
    exit 1
fi

echo "✅ Environment variables loaded"
echo "Target URL: $VITE_SUPABASE_URL"
echo "🚀 Running geocoding script..."
echo ""

npx tsx scripts/geocode_strategic_spots_google_places.ts
