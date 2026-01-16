/**
 * Geocoding Script untuk strategic_spots menggunakan OpenStreetMap (Nominatim)
 * GRATIS - Tanpa API Key
 * 
 * Tujuan:
 * - Query spot dengan status PENDING
 * - Cari di Nominatim (OpenStreetMap)
 * - Isi latitude, longitude, dan osm_id (ke kolom place_id)
 * 
 * Rules Nominatim:
 * - Max 1 request per detik (Strict!)
 * - Wajib User-Agent header
 * 
 * Usage:
 * npx tsx scripts/geocode_strategic_spots_nominatim.ts
 */

import { createClient } from "@supabase/supabase-js";

// Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 10; // Batch kecil karena rate limit ketat
const DELAY_MS = 1500; // 1.5 detik per request (Safe zone untuk Nominatim)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Query Nominatim API
 */
async function geocodeWithNominatim(
  name: string
): Promise<{
    osm_id: string | null;
    lat: number | null;
    lon: number | null;
    status: "OK" | "NOT_FOUND" | "ERROR";
    error?: string;
    display_name?: string;
}> {
  try {
    // Bersihkan nama dari karakter aneh
    const cleanName = name.replace(/[()]/g, '').trim(); 
    // Query khusus area Bandung
    const query = `${cleanName}, Bandung, Indonesia`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'MaximusApp/1.0 (me@halazure.com)' // Wajib untuk Nominatim
        }
    });

    if (!response.ok) {
        throw new Error(`Nominatim Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
        return {
            osm_id: null,
            lat: null,
            lon: null,
            status: "NOT_FOUND",
            error: "No results from OSM"
        };
    }

    const result = data[0];
    
    // Validate bounds (Bandung Area)
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Bandung approx bounds
    if (lat > -6.7 || lat < -7.1 || onepsilon(lon, 107.5) < 0) {
        // Warning log but accept for now
        // console.warn(`   ⚠️ Coordinate might be outside Bandung: ${lat}, ${lon}`);
    }

    return {
        osm_id: String(result.osm_id),
        lat: lat,
        lon: lon,
        status: "OK",
        display_name: result.display_name
    };

  } catch (error: any) {
    return {
        osm_id: null,
        lat: null,
        lon: null,
        status: "ERROR",
        error: error.message
    };
  }
}

// Helper simple number comparison
function onepsilon(a: number, b: number) { return a - b; }

async function geocodeAllSpots() {
  console.log("🚀 Starting geocoding job using OpenStreetMap (Nominatim)...\n");
  console.log("ℹ️  Policy: 1 request/1.5s (Slow but Free)\n");

  // 1. Get Pending Spots
  const { data: pendingSpots, error: fetchError } = await supabase
    .from("strategic_spots")
    .select("id, name, category, notes")
    // Ambil yang PENDING atau yang statusnya ERROR/NOT_FOUND dari percobaan sebelumnya
    .or('geocode_status.eq.PENDING,geocode_status.eq.ERROR,geocode_status.eq.NOT_FOUND') 
    .like("notes", "seed:bdg100:v1:%")
    .order("id", { ascending: true })
    .limit(100); // Limit total run per session

  if (fetchError) {
    console.error("❌ Error fetching spots:", fetchError);
    process.exit(1);
  }

  if (!pendingSpots?.length) {
    console.log("✅ No pending spots found.");
    return;
  }

  console.log(`📍 Found ${pendingSpots.length} spots to process.`);
  
  let success = 0;
  let fail = 0;

  for (const spot of pendingSpots) {
      // Log progress
      process.stdout.write(`🔍 Searching: ${spot.name}... `);

      const result = await geocodeWithNominatim(spot.name);
      
      let updateData: any = {
          geocode_status: result.status,
          geocode_error: result.error || null,
          last_geocoded_at: new Date().toISOString()
      };

      if (result.status === "OK") {
          updateData.latitude = result.lat;
          updateData.longitude = result.lon;
          updateData.place_id = result.osm_id; // Reuse column place_id for OSM ID
          updateData.geocode_query = result.display_name; // Store full OSM name
          console.log(`✅ OK`);
          success++;
      } else {
          console.log(`❌ ${result.status} (${result.error})`);
          fail++;
      }

      await supabase.from("strategic_spots").update(updateData).eq("id", spot.id);

      // Strict Delay for Nominatim Policy
      await sleep(DELAY_MS);
  }

  console.log("\nFINISHED!");
  console.log(`Success: ${success}, Failed: ${fail}`);
}

geocodeAllSpots();
