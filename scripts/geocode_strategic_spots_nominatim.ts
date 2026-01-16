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

// Kamus Manual untuk lokasi yang susah ditemukan
const ALIAS_MAP: Record<string, string> = {
  "Stasiun Bandung (Hall)": "Stasiun Bandung",
  "Pasar Baru Trade Center": "Pasar Baru Bandung",
  "Terusan Jakarta (Koridor Antapani)": "Jalan Terusan Jakarta Antapani",
  "Arcamanik Sport Center": "Sport Jabar Arcamanik",
  "Arcamanik Trade Center (ATC)": "Griya Arcamanik",
  "Komplek Arcamanik (Arcamanik Endah)": "Arcamanik Endah",
  "Sudirman Street Food Market": "Sudirman Street Day and Night Market",
  "Babakan Ciparay (Pusat Area)": "Kecamatan Babakan Ciparay",
  "Koridor Soekarno Hatta (Kordon)": "Jalan Soekarno Hatta Bandung",
  "Simpang Kordon (Node)": "Pasar Kordon",
  "Pasir Koja (Area)": "Jalan Pasir Koja",
  "Koridor Jalan Gatot Subroto (Batununggal)": "Jalan Gatot Subroto Bandung",
  "Koridor Jalan Kopo (Bojongloa Kaler)": "Jalan Kopo Bandung",
  "Koridor Jalan Holis": "Jalan Holis Bandung",
  "Metro Indah Mall (MIM)": "Metro Indah Mall",
  "Koridor Jalan Buah Batu": "Jalan Buah Batu",
  "Margacinta (Area)": "Jalan Margacinta",
  "Griya Buah Batu (Area)": "Griya Buah Batu",
  "Koridor Jalan Diponegoro (Bandung)": "Jalan Diponegoro Bandung",
  "Cicadas (Koridor A. Yani)": "Jalan Ahmad Yani Cicadas",
  "UIN Sunan Gunung Djati Bandung": "UIN Sunan Gunung Djati",
  "Pasar Cibiru": "Pasar Sehat Cibiru",
  "Terminal Cibiru": "Terminal Cibiru Bandung",
  "Koridor Jalan Pasirkaliki": "Jalan Pasir Kaliki",
  "Koridor Jalan Setiabudi (Atas)": "Jalan Dr. Setiabudi",
  "Ciumbuleuit (Kuliner/Hotel)": "Jalan Ciumbuleuit",
  "Cisaranten Kulon (Area)": "Kelurahan Cisaranten Kulon",
  "Cisaranten Wetan (Area)": "Kelurahan Cisaranten Wetan",
  "Cinambo (Pusat Area)": "Kecamatan Cinambo",
  "Institut Teknologi Bandung (ITB) Ganesha": "Institut Teknologi Bandung",
  "Dipatiukur (Kampus/Kuliner)": "Jalan Dipati Ukur",
  "Simpang Dago / Dago Cikapayang": "Taman Cikapayang Dago",
  "Stadion Gelora Bandung Lautan Api (GBLA)": "Stadion GBLA",
  "Koridor Jalan Jakarta": "Jalan Jakarta Bandung",
  "Lengkong Kecil (Kuliner)": "Jalan Lengkong Kecil",
  "Jalan Burangrang (Kuliner)": "Jalan Burangrang",
  "Palasari (Pusat Buku)": "Pasar Buku Palasari",
  "Jatihandap (Area)": "Kelurahan Jatihandap",
  "Pasir Impun (Area)": "Jalan Pasir Impun",
  "Koridor Cikadut": "Jalan Cikadut",
  "Bundaran Cibiru (Soekarno Hatta)": "Bundaran Cibiru",
  "Komplek Bumi Panyileukan": "Bumi Panyileukan",
  "Koridor Soekarno Hatta (Panyileukan)": "Panyileukan",
  "Pasar Ciwastra": "Pasar Tradisional Ciwastra",
  "Derwati (Area)": "Kelurahan Derwati",
  "Koridor Jalan Mohammad Toha": "Jalan Mohammad Toha",
  "Jalan Pungkur (Kuliner)": "Jalan Pungkur",
  "Jalan BKR (Area)": "Jalan BKR",
  "Paris Van Java (PVJ)": "Paris Van Java",
  "Koridor Jalan Sukajadi": "Jalan Sukajadi",
  "Gerbang Tol Pasteur": "Gerbang Tol Pasteur 2",
  "Setrasari (Area)": "Setrasari Mall",
  "Universitas Pendidikan Indonesia (UPI)": "UPI Bandung",
  "Gegerkalong (Kuliner)": "Jalan Gegerkalong Hilir",
  "Sarijadi (Komplek)": "Kelurahan Sarijadi",
  "Alun-Alun Ujung Berung": "Alun Alun Ujung Berung",
  "Pasar Ujung Berung": "Pasar Ujungberung"
};

/**
 * Query Nominatim API with Smart Fallback
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
  // 1. Cek Alias Manual dulu
  let queryName = ALIAS_MAP[name] || name;
  
  // 2. Strategi Pembersihan Bertahap
  const searchQueries = [
      queryName, // 1. Coba nama asli/alias
      queryName.replace(/\(.*\)/g, '').trim(), // 2. Hapus dalam kurung: "Pasar (Baru)" -> "Pasar"
      queryName.replace(/Koridor|Jalan|Area|Komplek|Simpang/gi, '').replace(/\(.*\)/g, '').trim() // 3. Hapus kata pengganggu
  ];

  // Hapus duplikat query
  const uniqueQueries = [...new Set(searchQueries)].filter(q => q.length > 3);

  for (const q of uniqueQueries) {
      const result = await attemptSearch(q);
      if (result.status === "OK") {
          return result;
      }
      // Delay sedikit antar retry internal
      await sleep(1000);
  }

  return {
      osm_id: null,
      lat: null,
      lon: null,
      status: "NOT_FOUND",
      error: "All attempts failed"
  };
}

async function attemptSearch(cleanName: string) {
  try {
    const query = `${cleanName}, Bandung`; // Hapus 'Indonesia' biar lebih longgar, tambah Bandung aja
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    // ... rest of function ...

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
            error: "No results"
        };
    }

    const result = data[0];
    
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
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
  console.log("🚀 Starting Smart Geocoding (Nominatim)...\n");
  console.log("ℹ️  Using Alias Map + Clean Fallback\n");

  // 1. Get Pending Spots
  const { data: pendingSpots, error: fetchError } = await supabase
    .from("strategic_spots")
    .select("id, name, category, notes")
    // Retry juga yang NOT_FOUND sebelumnya
    .or('geocode_status.eq.PENDING,geocode_status.eq.NOT_FOUND') 
    .like("notes", "seed:bdg100:v1:%")
    .order("id", { ascending: true });

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
