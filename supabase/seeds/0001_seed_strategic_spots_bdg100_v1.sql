-- filepath: supabase/seeds/0001_seed_strategic_spots_bdg100_v1.sql
-- Purpose: Seed 100 strategic spots di Bandung versi bdg100:v1
-- Safety: Idempotent method (delete + insert), bukan on conflict
-- Eksekusi: psql -h $HOST -U $USER -d $DB -f file.sql atau via Supabase dashboard

begin;

-- Step 1: Hapus seed lama (clean slate, idempotent)
delete from public.strategic_spots 
where notes like 'seed:bdg100:v1:%';

-- Step 2: Insert 100 baris seed (format notes: seed:bdg100:v1:001 s/d :100)
insert into public.strategic_spots
(name, category, notes, start_hour, end_hour, is_weekend_only, latitude, longitude, geocode_status)
values
-- ANDIR (4)
('Stasiun Bandung (Hall)', 'transport', 'seed:bdg100:v1:001', 9, 24, false, null, null, 'PENDING'),
('Pasar Baru Trade Center', 'market', 'seed:bdg100:v1:002', 9, 24, false, null, null, 'PENDING'),
('Pasar Ciroyom', 'market', 'seed:bdg100:v1:003', 9, 24, false, null, null, 'PENDING'),
('Jalan Kebon Kawung (Area)', 'corridor', 'seed:bdg100:v1:004', 9, 24, false, null, null, 'PENDING'),

-- ANTAPANI (4)
('Terusan Jakarta (Koridor Antapani)', 'corridor', 'seed:bdg100:v1:005', 9, 24, false, null, null, 'PENDING'),
('Pasar Antapani', 'market', 'seed:bdg100:v1:006', 9, 24, false, null, null, 'PENDING'),
('Borma Antapani', 'retail', 'seed:bdg100:v1:007', 9, 24, false, null, null, 'PENDING'),
('Kuliner Terusan Jakarta (Antapani)', 'culinary', 'seed:bdg100:v1:008', 9, 24, false, null, null, 'PENDING'),

-- ARCAMANIK (4)
('Arcamanik Sport Center', 'office', 'seed:bdg100:v1:009', 9, 24, false, null, null, 'PENDING'),
('Arcamanik Trade Center (ATC)', 'mall', 'seed:bdg100:v1:010', 9, 24, false, null, null, 'PENDING'),
('Komplek Arcamanik (Arcamanik Endah)', 'office', 'seed:bdg100:v1:011', 9, 24, false, null, null, 'PENDING'),
('Koridor A.H. Nasution (Arcamanik)', 'corridor', 'seed:bdg100:v1:012', 9, 24, false, null, null, 'PENDING'),

-- ASTANAANYAR (3)
('Sudirman Street Food Market', 'culinary', 'seed:bdg100:v1:013', 9, 24, false, null, null, 'PENDING'),
('Cibadak Culinary Night', 'culinary', 'seed:bdg100:v1:014', 9, 24, false, null, null, 'PENDING'),
('Pasar Astana Anyar', 'market', 'seed:bdg100:v1:015', 9, 24, false, null, null, 'PENDING'),

-- BABAKAN CIPARAY (3)
('Pasar Induk Caringin', 'market', 'seed:bdg100:v1:016', 9, 24, false, null, null, 'PENDING'),
('Babakan Ciparay (Pusat Area)', 'office', 'seed:bdg100:v1:017', 9, 24, false, null, null, 'PENDING'),
('Koridor Caringin (Akses Pasar Induk)', 'corridor', 'seed:bdg100:v1:018', 9, 24, false, null, null, 'PENDING'),

-- BANDUNG KIDUL (3)
('Pasar Kordon', 'market', 'seed:bdg100:v1:019', 9, 24, false, null, null, 'PENDING'),
('Koridor Soekarno Hatta (Kordon)', 'corridor', 'seed:bdg100:v1:020', 9, 24, false, null, null, 'PENDING'),
('Simpang Kordon (Node)', 'corridor', 'seed:bdg100:v1:021', 9, 24, false, null, null, 'PENDING'),

-- BANDUNG KULON (3)
('Festival Citylink', 'mall', 'seed:bdg100:v1:022', 9, 24, false, null, null, 'PENDING'),
('Pasir Koja (Area)', 'corridor', 'seed:bdg100:v1:023', 9, 24, false, null, null, 'PENDING'),
('Pasar Cigondewah', 'market', 'seed:bdg100:v1:024', 9, 24, false, null, null, 'PENDING'),

-- BANDUNG WETAN (3)
('Gedung Sate', 'office', 'seed:bdg100:v1:025', 9, 24, false, null, null, 'PENDING'),
('Bandung Indah Plaza (BIP)', 'mall', 'seed:bdg100:v1:026', 9, 24, false, null, null, 'PENDING'),
('Jalan RE Martadinata (Riau)', 'corridor', 'seed:bdg100:v1:027', 9, 24, false, null, null, 'PENDING'),

-- BATUNUNGGAL (3)
('Trans Studio Mall Bandung', 'mall', 'seed:bdg100:v1:028', 9, 24, false, null, null, 'PENDING'),
('Trans Studio Bandung', 'tourism', 'seed:bdg100:v1:029', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Gatot Subroto (Batununggal)', 'corridor', 'seed:bdg100:v1:030', 9, 24, false, null, null, 'PENDING'),

-- BOJONGLOA KALER (3)
('Koridor Jalan Kopo (Bojongloa Kaler)', 'corridor', 'seed:bdg100:v1:031', 9, 24, false, null, null, 'PENDING'),
('Pasar Kopo', 'market', 'seed:bdg100:v1:032', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Holis', 'corridor', 'seed:bdg100:v1:033', 9, 24, false, null, null, 'PENDING'),

-- BOJONGLOA KIDUL (3)
('Terminal Leuwipanjang', 'transport', 'seed:bdg100:v1:034', 9, 24, false, null, null, 'PENDING'),
('Cibaduyut (Sentra Sepatu)', 'market', 'seed:bdg100:v1:035', 9, 24, false, null, null, 'PENDING'),
('Taman Tegalega', 'tourism', 'seed:bdg100:v1:036', 9, 24, false, null, null, 'PENDING'),

-- BUAHBATU (4)
('Metro Indah Mall (MIM)', 'mall', 'seed:bdg100:v1:037', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Buah Batu', 'corridor', 'seed:bdg100:v1:038', 9, 24, false, null, null, 'PENDING'),
('Margacinta (Area)', 'office', 'seed:bdg100:v1:039', 9, 24, false, null, null, 'PENDING'),
('Griya Buah Batu (Area)', 'retail', 'seed:bdg100:v1:040', 9, 24, false, null, null, 'PENDING'),

-- CIBEUNYING KALER (3)
('Masjid Pusdai', 'tourism', 'seed:bdg100:v1:041', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Diponegoro (Bandung)', 'corridor', 'seed:bdg100:v1:042', 9, 24, false, null, null, 'PENDING'),
('Taman Musik Centrum', 'tourism', 'seed:bdg100:v1:043', 9, 24, false, null, null, 'PENDING'),

-- CIBEUNYING KIDUL (3)
('Saung Angklung Udjo', 'tourism', 'seed:bdg100:v1:044', 9, 24, false, null, null, 'PENDING'),
('Cicadas (Koridor A. Yani)', 'corridor', 'seed:bdg100:v1:045', 9, 24, false, null, null, 'PENDING'),
('RS Santo Yusup', 'hospital', 'seed:bdg100:v1:046', 9, 24, false, null, null, 'PENDING'),

-- CIBIRU (3)
('UIN Sunan Gunung Djati Bandung', 'campus', 'seed:bdg100:v1:047', 9, 24, false, null, null, 'PENDING'),
('Pasar Cibiru', 'market', 'seed:bdg100:v1:048', 9, 24, false, null, null, 'PENDING'),
('Terminal Cibiru', 'transport', 'seed:bdg100:v1:049', 9, 24, false, null, null, 'PENDING'),

-- CICENDO (4)
('Bandara Husein Sastranegara', 'transport', 'seed:bdg100:v1:050', 9, 24, false, null, null, 'PENDING'),
('Istana Plaza', 'mall', 'seed:bdg100:v1:051', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Pasirkaliki', 'corridor', 'seed:bdg100:v1:052', 9, 24, false, null, null, 'PENDING'),
('23 Paskal Shopping Center', 'mall', 'seed:bdg100:v1:053', 9, 24, false, null, null, 'PENDING'),

-- CIDADAP (3)
('Terminal Ledeng', 'transport', 'seed:bdg100:v1:054', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Setiabudi (Atas)', 'corridor', 'seed:bdg100:v1:055', 9, 24, false, null, null, 'PENDING'),
('Ciumbuleuit (Kuliner/Hotel)', 'culinary', 'seed:bdg100:v1:056', 9, 24, false, null, null, 'PENDING'),

-- CINAMBO (3)
('Cisaranten Kulon (Area)', 'office', 'seed:bdg100:v1:057', 9, 24, false, null, null, 'PENDING'),
('Cisaranten Wetan (Area)', 'office', 'seed:bdg100:v1:058', 9, 24, false, null, null, 'PENDING'),
('Cinambo (Pusat Area)', 'office', 'seed:bdg100:v1:059', 9, 24, false, null, null, 'PENDING'),

-- COBLONG (4)
('Institut Teknologi Bandung (ITB) Ganesha', 'campus', 'seed:bdg100:v1:060', 9, 24, false, null, null, 'PENDING'),
('Cihampelas Walk (Ciwalk)', 'mall', 'seed:bdg100:v1:061', 9, 24, false, null, null, 'PENDING'),
('Dipatiukur (Kampus/Kuliner)', 'culinary', 'seed:bdg100:v1:062', 9, 24, false, null, null, 'PENDING'),
('Simpang Dago / Dago Cikapayang', 'corridor', 'seed:bdg100:v1:063', 9, 24, false, null, null, 'PENDING'),

-- GEDEBAGE (3)
('Pasar Gedebage', 'market', 'seed:bdg100:v1:064', 9, 24, false, null, null, 'PENDING'),
('Stadion Gelora Bandung Lautan Api (GBLA)', 'event', 'seed:bdg100:v1:065', 9, 24, false, null, null, 'PENDING'),
('Summarecon Bandung (Gedebage)', 'mall', 'seed:bdg100:v1:066', 9, 24, false, null, null, 'PENDING'),

-- KIARACONDONG (4)
('Stasiun Kiaracondong', 'transport', 'seed:bdg100:v1:067', 9, 24, false, null, null, 'PENDING'),
('Terminal Cicaheum', 'transport', 'seed:bdg100:v1:068', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Jakarta', 'corridor', 'seed:bdg100:v1:069', 9, 24, false, null, null, 'PENDING'),
('Pasar Kiaracondong', 'market', 'seed:bdg100:v1:070', 9, 24, false, null, null, 'PENDING'),

-- LENGKONG (4)
('Lengkong Kecil (Kuliner)', 'culinary', 'seed:bdg100:v1:071', 9, 24, false, null, null, 'PENDING'),
('Jalan Burangrang (Kuliner)', 'culinary', 'seed:bdg100:v1:072', 9, 24, false, null, null, 'PENDING'),
('Palasari (Pusat Buku)', 'market', 'seed:bdg100:v1:073', 9, 24, false, null, null, 'PENDING'),
('Lapangan Lodaya', 'office', 'seed:bdg100:v1:074', 9, 24, false, null, null, 'PENDING'),

-- MANDALAJATI (3)
('Jatihandap (Area)', 'office', 'seed:bdg100:v1:075', 9, 24, false, null, null, 'PENDING'),
('Pasir Impun (Area)', 'office', 'seed:bdg100:v1:076', 9, 24, false, null, null, 'PENDING'),
('Koridor Cikadut', 'corridor', 'seed:bdg100:v1:077', 9, 24, false, null, null, 'PENDING'),

-- PANYILEUKAN (3)
('Bundaran Cibiru (Soekarno Hatta)', 'corridor', 'seed:bdg100:v1:078', 9, 24, false, null, null, 'PENDING'),
('Komplek Bumi Panyileukan', 'office', 'seed:bdg100:v1:079', 9, 24, false, null, null, 'PENDING'),
('Koridor Soekarno Hatta (Panyileukan)', 'corridor', 'seed:bdg100:v1:080', 9, 24, false, null, null, 'PENDING'),

-- RANCASARI (3)
('RS Al-Islam Bandung', 'hospital', 'seed:bdg100:v1:081', 9, 24, false, null, null, 'PENDING'),
('Pasar Ciwastra', 'market', 'seed:bdg100:v1:082', 9, 24, false, null, null, 'PENDING'),
('Derwati (Area)', 'office', 'seed:bdg100:v1:083', 9, 24, false, null, null, 'PENDING'),

-- REGOL (4)
('Alun-Alun Bandung', 'tourism', 'seed:bdg100:v1:084', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Mohammad Toha', 'corridor', 'seed:bdg100:v1:085', 9, 24, false, null, null, 'PENDING'),
('Jalan Pungkur (Kuliner)', 'culinary', 'seed:bdg100:v1:086', 9, 24, false, null, null, 'PENDING'),
('Jalan BKR (Area)', 'corridor', 'seed:bdg100:v1:087', 9, 24, false, null, null, 'PENDING'),

-- SUKAJADI (4)
('Paris Van Java (PVJ)', 'mall', 'seed:bdg100:v1:088', 9, 24, false, null, null, 'PENDING'),
('Koridor Jalan Sukajadi', 'corridor', 'seed:bdg100:v1:089', 9, 24, false, null, null, 'PENDING'),
('Gerbang Tol Pasteur', 'transport', 'seed:bdg100:v1:090', 9, 24, false, null, null, 'PENDING'),
('Setrasari (Area)', 'office', 'seed:bdg100:v1:091', 9, 24, false, null, null, 'PENDING'),

-- SUKASARI (3)
('Universitas Pendidikan Indonesia (UPI)', 'campus', 'seed:bdg100:v1:092', 9, 24, false, null, null, 'PENDING'),
('Gegerkalong (Kuliner)', 'culinary', 'seed:bdg100:v1:093', 9, 24, false, null, null, 'PENDING'),
('Sarijadi (Komplek)', 'office', 'seed:bdg100:v1:094', 9, 24, false, null, null, 'PENDING'),

-- SUMUR BANDUNG (3)
('Jalan Braga', 'tourism', 'seed:bdg100:v1:095', 9, 24, false, null, null, 'PENDING'),
('Gedung Merdeka (Asia Afrika)', 'tourism', 'seed:bdg100:v1:096', 9, 24, false, null, null, 'PENDING'),
('Pasar Kosambi', 'market', 'seed:bdg100:v1:097', 9, 24, false, null, null, 'PENDING'),

-- UJUNG BERUNG (3)
('Alun-Alun Ujung Berung', 'tourism', 'seed:bdg100:v1:098', 9, 24, false, null, null, 'PENDING'),
('Pasar Ujung Berung', 'market', 'seed:bdg100:v1:099', 9, 24, false, null, null, 'PENDING'),
('Terminal Ujung Berung', 'transport', 'seed:bdg100:v1:100', 9, 24, false, null, null, 'PENDING');

-- Commit transaction
commit;
