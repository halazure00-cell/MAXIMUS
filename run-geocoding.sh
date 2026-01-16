#!/bin/bash

# Memuat environment variables
export VITE_SUPABASE_URL="https://erfjhbrsttzkvggksdhx.supabase.co"
export VITE_SUPABASE_ANON_KEY="sb_publishable_YcOdkaudSwpAp-shiv3P7A_WGkEvE7A"

# Script akan menggunakan .env untuk service role key dan google places api key
# Pastikan Anda sudah menambahkan ke .env:
# SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
# GOOGLE_PLACES_API_KEY=<your-google-places-api-key>

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY belum diset di environment atau .env"
    echo ""
    echo "Cara set:"
    echo "1. Buka https://supabase.com/dashboard/project/erfjhbrsttzkvggksdhx/settings/api"
    echo "2. Copy 'service_role secret' key"
    echo "3. Jalankan: export SUPABASE_SERVICE_ROLE_KEY='<paste-key-here>'"
    echo ""
    exit 1
fi

if [ -z "$GOOGLE_PLACES_API_KEY" ]; then
    echo "❌ Error: GOOGLE_PLACES_API_KEY belum diset di environment atau .env"
    echo ""
    echo "Cara set:"
    echo "1. Buka https://console.cloud.google.com/apis/credentials"
    echo "2. Buat API key untuk Google Places API"
    echo "3. Jalankan: export GOOGLE_PLACES_API_KEY='<paste-key-here>'"
    echo ""
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🚀 Running geocoding script..."
echo ""

npx tsx scripts/geocode_strategic_spots_google_places.ts
