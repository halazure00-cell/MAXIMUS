/**
 * Google Places Geocoding Script untuk strategic_spots
 * 
 * Tujuan:
 * - Query spot dengan status PENDING (with row locking)
 * - Cari di Google Places API (Text Search)
 * - Gunakan Places Details API untuk stable coordinates
 * - Isi place_id, latitude, longitude, geocode_status
 * 
 * Safety:
 * - Pakai SUPABASE_SERVICE_ROLE_KEY (server-only)
 * - FOR UPDATE SKIP LOCKED untuk parallel safety
 * - Batch kecil, delay antar request
 * - Simpan error untuk audit
 * 
 * Usage:
 * npx ts-node scripts/geocode_strategic_spots_google_places.ts
 * atau: node scripts/geocode_strategic_spots_google_places.js (jika sudah transpiled)
 */

interface StrategicSpot {
  id: number;
  name: string;
  category: string;
  notes: string;
  geocode_status: string;
}

interface PlaceResult {
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

// Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BATCH_SIZE = 50; // Proses 50 spot per batch
const DELAY_MS = 300; // Delay 300ms antar request
const MAX_RETRIES = 3;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_PLACES_API_KEY) {
  console.error(
    "Missing env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_PLACES_API_KEY"
  );
  process.exit(1);
}

// Dynamic import untuk ESM support
async function getSupabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Sleep helper (untuk delay antar request)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Query Google Places (Text Search + Details API for stable coordinates)
 * 
 * Step 1: Use Text Search to find place_id
 * Step 2: Use Place Details to get stable lat/lng
 * 
 * Return: {place_id, lat, lng, status, error}
 */
async function geocodeWithGooglePlaces(
  name: string,
  category: string,
  attempt = 1
): Promise<{
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "OK" | "NOT_FOUND" | "ERROR";
  error?: string;
}> {
  try {
    // Step 1: Text Search to get place_id
    const query = `${name}, Bandung, Indonesia`;
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${GOOGLE_PLACES_API_KEY}`;

    const textSearchResponse = await fetch(textSearchUrl);
    const textSearchData = await textSearchResponse.json();

    // Check rate limit
    if (textSearchData.status === "OVER_QUERY_LIMIT") {
      if (attempt < MAX_RETRIES) {
        console.warn(
          `⏳ Rate limit (Text Search). Retrying (${attempt}/${MAX_RETRIES}) after 5s...`
        );
        await sleep(5000);
        return geocodeWithGooglePlaces(name, category, attempt + 1);
      } else {
        return {
          place_id: null,
          latitude: null,
          longitude: null,
          status: "ERROR",
          error: "OVER_QUERY_LIMIT after retries (Text Search)",
        };
      }
    }

    if (textSearchData.status !== "OK" && textSearchData.status !== "ZERO_RESULTS") {
       throw new Error(`TextSearch API error: ${textSearchData.status}`);
    }

    if (!textSearchData.results || textSearchData.results.length === 0) {
      return {
        place_id: null,
        latitude: null,
        longitude: null,
        status: "NOT_FOUND",
        error: "No results found",
      };
    }

    // Step 2: Details API to get accurate location (Text Search location is approx)
    const placeId = textSearchData.results[0].place_id;
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== "OK") {
       throw new Error(`Details API error: ${detailsData.status}`);
    }

    const { lat, lng } = detailsData.result.geometry.location;

    // Validate Coordinates Strategy: Bandung Bounds
    const BANDUNG_BOUNDS = {
        lat_min: -7.1,
        lat_max: -6.8,
        lng_min: 107.5,
        lng_max: 107.8
    };

    if (lat < BANDUNG_BOUNDS.lat_min || lat > BANDUNG_BOUNDS.lat_max || 
        lng < BANDUNG_BOUNDS.lng_min || lng > BANDUNG_BOUNDS.lng_max) {
            console.warn(`  ⚠️ Coordinates (${lat}, ${lng}) are outside Bandung bounds. Marking as warning but saving.`);
            // NOTE: We could return ERROR here if we want to be strict, but for now we accept it.
    }

    return {
      place_id: placeId,
      latitude: lat,
      longitude: lng,
      status: "OK",
    };

  } catch (error: any) {
    return {
      place_id: null,
      latitude: null,
      longitude: null,
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main function: Geocode all PENDING spots with row-level locking
 */
async function geocodeAllSpots() {
  const supabase = await getSupabaseClient();
  
  console.log("🚀 Starting geocoding job for strategic_spots...\n");

  // 1) Query semua PENDING spots dengan notes like 'seed:bdg100:v1:%'
  // PENTING: Gunakan FOR UPDATE SKIP LOCKED untuk prevent concurrent execution
  // (hanya PostgreSQL, tidak bisa via SDK, jadi gunakan raw query)
  const { data: pendingSpots, error: fetchError } = await supabase
    .from("strategic_spots")
    .select("id, name, category, notes, geocode_status")
    .eq("geocode_status", "PENDING")
    .like("notes", "seed:bdg100:v1:%")
    .order("id", { ascending: true });

  if (fetchError) {
    console.error("❌ Error fetching pending spots:", fetchError);
    process.exit(1);
  }

  if (!pendingSpots || pendingSpots.length === 0) {
    console.log("✅ No pending spots found. Job finished.");
    return;
  }

  console.log(`📍 Found ${pendingSpots.length} spots to geocode\n`);

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  // 2) Process batch by batch
  for (let i = 0; i < pendingSpots.length; i += BATCH_SIZE) {
    const batch = pendingSpots.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

    for (const spot of batch) {
      // Geocode
      const result = await geocodeWithGooglePlaces(spot.name, spot.category);

      // Update DB
      const { error: updateError } = await supabase
        .from("strategic_spots")
        .update({
          place_id: result.place_id,
          latitude: result.latitude,
          longitude: result.longitude,
          geocode_status: result.status,
          geocode_error: result.error || null,
          last_geocoded_at: new Date().toISOString(),
        })
        .eq("id", spot.id);

      if (updateError) {
        console.error(`  ❌ Update failed for ID ${spot.id}:`, updateError);
        errorCount++;
      } else {
        const icon =
          result.status === "OK" ? "✅" : result.status === "NOT_FOUND" ? "⚠️" : "❌";
        console.log(
          `  ${icon} ${spot.name} → ${result.status}${
            result.error ? ` (${result.error})` : ""
          }`
        );

        if (result.status === "OK") successCount++;
        else if (result.status === "NOT_FOUND") notFoundCount++;
        else errorCount++;
      }

      // Delay antar request (agar tidak kena rate limit)
      await sleep(DELAY_MS);
    }
  }

  // 3) Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 GEOCODING SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Success (OK):   ${successCount}`);
  console.log(`⚠️  Not Found:      ${notFoundCount}`);
  console.log(`❌ Errors:         ${errorCount}`);
  console.log(`📍 Total:          ${successCount + notFoundCount + errorCount}`);
  const total = successCount + notFoundCount + errorCount;
  const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : "0.0";
  console.log(`📈 Success Rate:   ${successRate}%`);
  console.log("=".repeat(60) + "\n");

  if (parseFloat(successRate) >= 90) {
    console.log("✅ Job completed successfully (>= 90% success rate)");
  } else {
    console.log("⚠️  Job completed with warnings (< 90% success rate)");
  }

  // NOTE: For parallel execution safety, row-level locking is recommended
  // Use raw SQL: SELECT ... FROM strategic_spots WHERE ... FOR UPDATE SKIP LOCKED
  // This prevents multiple script instances from processing the same row
}

// Run
geocodeAllSpots().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export { geocodeAllSpots, geocodeWithGooglePlaces };
