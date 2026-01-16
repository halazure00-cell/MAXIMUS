begin;

insert into public.strategic_spots
(name, category, notes, start_hour, end_hour, is_weekend_only, latitude, longitude,
 kecamatan, modes, corridor_tags, halal_risk, geocode_query, wd_weights, we_weights, active_day_types)
values

-- ANDIR (4)
('Stasiun Bandung (Hall)', 'transport', 'seed:bdg100:v1:001', 9, 24, false, null, null, 'Andir', array['BIKE','PARCEL'], array[]::text[], 'low', 'Stasiun Bandung (Hall), Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Baru Trade Center', 'market', 'seed:bdg100:v1:002', 9, 24, false, null, null, 'Andir', array['BIKE','PARCEL','FOOD'], array[]::text[], 'low', 'Pasar Baru Trade Center, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Ciroyom', 'market', 'seed:bdg100:v1:003', 9, 24, false, null, null, 'Andir', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Ciroyom, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Jalan Kebon Kawung (Area)', 'corridor', 'seed:bdg100:v1:004', 9, 24, false, null, null, 'Andir', array['BIKE','PARCEL'], array['TRANSPORT_CORE'], 'low', 'Jalan Kebon Kawung, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- ANTAPANI (4)
('Terusan Jakarta (Koridor Antapani)', 'corridor', 'seed:bdg100:v1:005', 9, 24, false, null, null, 'Antapani', array['BIKE','FOOD'], array['TERUSAN_JAKARTA'], 'low', 'Terusan Jakarta, Antapani, Kota Bandung', '{"WD1":3,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Antapani', 'market', 'seed:bdg100:v1:006', 9, 24, false, null, null, 'Antapani', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Antapani, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Borma Antapani', 'retail', 'seed:bdg100:v1:007', 9, 24, false, null, null, 'Antapani', array['BIKE','FOOD','PARCEL'], array[]::text[], 'low', 'Borma Antapani, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Kuliner Terusan Jakarta (Antapani)', 'culinary', 'seed:bdg100:v1:008', 9, 24, false, null, null, 'Antapani', array['FOOD','BIKE'], array['TERUSAN_JAKARTA'], 'low', 'Kuliner Terusan Jakarta Antapani, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":2,"WD5":5,"WD6":4}', '{"WE1":2,"WE2":3,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- ARCAMANIK (4)
('Arcamanik Sport Center', 'office', 'seed:bdg100:v1:009', 9, 24, false, null, null, 'Arcamanik', array['BIKE'], array[]::text[], 'low', 'Arcamanik Sport Center, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":3,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Arcamanik Trade Center (ATC)', 'mall', 'seed:bdg100:v1:010', 9, 24, false, null, null, 'Arcamanik', array['BIKE','FOOD'], array[]::text[], 'low', 'Arcamanik Trade Center (ATC), Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Komplek Arcamanik (Arcamanik Endah)', 'office', 'seed:bdg100:v1:011', 9, 24, false, null, null, 'Arcamanik', array['BIKE','FOOD'], array[]::text[], 'low', 'Arcamanik Endah, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor A.H. Nasution (Arcamanik)', 'corridor', 'seed:bdg100:v1:012', 9, 24, false, null, null, 'Arcamanik', array['BIKE','PARCEL'], array['AH_NASUTION'], 'low', 'Jalan A.H. Nasution, Arcamanik, Kota Bandung', '{"WD1":3,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- ASTANAANYAR (3)
('Sudirman Street Food Market', 'culinary', 'seed:bdg100:v1:013', 9, 24, false, null, null, 'Astanaanyar', array['FOOD','BIKE'], array['SUDIRMAN'], 'medium', 'Sudirman Street Food Market, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":2,"WD5":5,"WD6":4}', '{"WE1":2,"WE2":3,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Cibadak Culinary Night', 'culinary', 'seed:bdg100:v1:014', 9, 24, false, null, null, 'Astanaanyar', array['FOOD','BIKE'], array['CIBADAK'], 'low', 'Cibadak Culinary Night, Kota Bandung', '{"WD1":0,"WD2":1,"WD3":1,"WD4":2,"WD5":5,"WD6":5}', '{"WE1":1,"WE2":2,"WE3":3,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Astana Anyar', 'market', 'seed:bdg100:v1:015', 9, 24, false, null, null, 'Astanaanyar', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Astana Anyar, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BABAKAN CIPARAY (3)
('Pasar Induk Caringin', 'market', 'seed:bdg100:v1:016', 9, 24, false, null, null, 'Babakan Ciparay', array['PARCEL','FOOD'], array[]::text[], 'low', 'Pasar Induk Caringin, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Babakan Ciparay (Pusat Area)', 'office', 'seed:bdg100:v1:017', 9, 24, false, null, null, 'Babakan Ciparay', array['BIKE','FOOD'], array[]::text[], 'low', 'Babakan Ciparay, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Caringin (Akses Pasar Induk)', 'corridor', 'seed:bdg100:v1:018', 9, 24, false, null, null, 'Babakan Ciparay', array['BIKE','PARCEL'], array['CARGINING'], 'low', 'Caringin, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BANDUNG KIDUL (3)
('Pasar Kordon', 'market', 'seed:bdg100:v1:019', 9, 24, false, null, null, 'Bandung Kidul', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Kordon, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Soekarno Hatta (Kordon)', 'corridor', 'seed:bdg100:v1:020', 9, 24, false, null, null, 'Bandung Kidul', array['BIKE','PARCEL'], array['SOEKARNO_HATTA'], 'low', 'Jalan Soekarno Hatta (Kordon), Kota Bandung', '{"WD1":3,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Simpang Kordon (Node)', 'corridor', 'seed:bdg100:v1:021', 9, 24, false, null, null, 'Bandung Kidul', array['BIKE','FOOD','PARCEL'], array['SOEKARNO_HATTA'], 'low', 'Simpang Kordon, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BANDUNG KULON (3)
('Festival Citylink', 'mall', 'seed:bdg100:v1:022', 9, 24, false, null, null, 'Bandung Kulon', array['BIKE','FOOD'], array[]::text[], 'low', 'Festival Citylink, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasir Koja (Area)', 'corridor', 'seed:bdg100:v1:023', 9, 24, false, null, null, 'Bandung Kulon', array['BIKE','PARCEL'], array['PASIR_KOJA'], 'low', 'Pasir Koja, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Cigondewah', 'market', 'seed:bdg100:v1:024', 9, 24, false, null, null, 'Bandung Kulon', array['PARCEL','FOOD'], array[]::text[], 'low', 'Pasar Cigondewah, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BANDUNG WETAN (3)
('Gedung Sate', 'office', 'seed:bdg100:v1:025', 9, 24, false, null, null, 'Bandung Wetan', array['BIKE'], array[]::text[], 'low', 'Gedung Sate, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Bandung Indah Plaza (BIP)', 'mall', 'seed:bdg100:v1:026', 9, 24, false, null, null, 'Bandung Wetan', array['BIKE','FOOD'], array[]::text[], 'low', 'Bandung Indah Plaza (BIP), Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Jalan RE Martadinata (Riau)', 'corridor', 'seed:bdg100:v1:027', 9, 24, false, null, null, 'Bandung Wetan', array['BIKE','PARCEL','FOOD'], array['RIAU'], 'low', 'Jalan RE Martadinata (Riau), Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BATUNUNGGAL (3)
('Trans Studio Mall Bandung', 'mall', 'seed:bdg100:v1:028', 9, 24, false, null, null, 'Batununggal', array['BIKE','FOOD'], array[]::text[], 'low', 'Trans Studio Mall Bandung, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Trans Studio Bandung', 'tourism', 'seed:bdg100:v1:029', 9, 24, false, null, null, 'Batununggal', array['BIKE'], array[]::text[], 'low', 'Trans Studio Bandung, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":2,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Gatot Subroto (Batununggal)', 'corridor', 'seed:bdg100:v1:030', 9, 24, false, null, null, 'Batununggal', array['BIKE','PARCEL','FOOD'], array['GATOT_SUBROTO'], 'low', 'Jalan Gatot Subroto, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BOJONGLOA KALER (3)
('Koridor Jalan Kopo (Bojongloa Kaler)', 'corridor', 'seed:bdg100:v1:031', 9, 24, false, null, null, 'Bojongloa Kaler', array['BIKE','PARCEL','FOOD'], array['KOPO'], 'low', 'Jalan Kopo, Kota Bandung', '{"WD1":3,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Kopo', 'market', 'seed:bdg100:v1:032', 9, 24, false, null, null, 'Bojongloa Kaler', array['FOOD','PARCEL'], array['KOPO'], 'low', 'Pasar Kopo, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Holis', 'corridor', 'seed:bdg100:v1:033', 9, 24, false, null, null, 'Bojongloa Kaler', array['BIKE','PARCEL'], array['HOLIS'], 'low', 'Jalan Holis, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BOJONGLOA KIDUL (3)
('Terminal Leuwipanjang', 'transport', 'seed:bdg100:v1:034', 9, 24, false, null, null, 'Bojongloa Kidul', array['BIKE','PARCEL'], array[]::text[], 'low', 'Terminal Leuwipanjang, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":2,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Cibaduyut (Sentra Sepatu)', 'market', 'seed:bdg100:v1:035', 9, 24, false, null, null, 'Bojongloa Kidul', array['BIKE','PARCEL'], array[]::text[], 'low', 'Cibaduyut, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Taman Tegalega', 'tourism', 'seed:bdg100:v1:036', 9, 24, false, null, null, 'Bojongloa Kidul', array['BIKE'], array[]::text[], 'low', 'Taman Tegalega, Kota Bandung', '{"WD1":1,"WD2":1,"WD3":1,"WD4":2,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":2,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- BUAHBATU (4)
('Metro Indah Mall (MIM)', 'mall', 'seed:bdg100:v1:037', 9, 24, false, null, null, 'Buahbatu', array['BIKE','FOOD'], array['SOEKARNO_HATTA'], 'low', 'Metro Indah Mall, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Buah Batu', 'corridor', 'seed:bdg100:v1:038', 9, 24, false, null, null, 'Buahbatu', array['BIKE','FOOD','PARCEL'], array['BUAH_BATU'], 'low', 'Jalan Buah Batu, Kota Bandung', '{"WD1":3,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Margacinta (Area)', 'office', 'seed:bdg100:v1:039', 9, 24, false, null, null, 'Buahbatu', array['FOOD','BIKE'], array[]::text[], 'low', 'Margacinta, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Griya Buah Batu (Area)', 'retail', 'seed:bdg100:v1:040', 9, 24, false, null, null, 'Buahbatu', array['BIKE','FOOD','PARCEL'], array['BUAH_BATU'], 'low', 'Griya Buah Batu, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- CIBEUNYING KALER (3)
('Masjid Pusdai', 'tourism', 'seed:bdg100:v1:041', 9, 24, false, null, null, 'Cibeunying Kaler', array['BIKE'], array[]::text[], 'low', 'Masjid Pusdai, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":2,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Diponegoro (Bandung)', 'corridor', 'seed:bdg100:v1:042', 9, 24, false, null, null, 'Cibeunying Kaler', array['BIKE','PARCEL'], array['DIPONEGORO'], 'low', 'Jalan Diponegoro, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Taman Musik Centrum', 'tourism', 'seed:bdg100:v1:043', 9, 24, false, null, null, 'Cibeunying Kaler', array['BIKE'], array[]::text[], 'low', 'Taman Musik Centrum, Kota Bandung', '{"WD1":1,"WD2":1,"WD3":1,"WD4":2,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":2,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- CIBEUNYING KIDUL (3)
('Saung Angklung Udjo', 'tourism', 'seed:bdg100:v1:044', 9, 24, false, null, null, 'Cibeunying Kidul', array['BIKE'], array[]::text[], 'low', 'Saung Angklung Udjo, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":2,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Cicadas (Koridor A. Yani)', 'corridor', 'seed:bdg100:v1:045', 9, 24, false, null, null, 'Cibeunying Kidul', array['BIKE','FOOD','PARCEL'], array['A_YANI'], 'low', 'Cicadas, Jalan Ahmad Yani, Kota Bandung', '{"WD1":3,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('RS Santo Yusup', 'hospital', 'seed:bdg100:v1:046', 9, 24, false, null, null, 'Cibeunying Kidul', array['BIKE'], array[]::text[], 'low', 'RS Santo Yusup, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- CIBIRU (3)
('UIN Sunan Gunung Djati Bandung', 'campus', 'seed:bdg100:v1:047', 9, 24, false, null, null, 'Cibiru', array['BIKE'], array['AH_NASUTION'], 'low', 'UIN Sunan Gunung Djati Bandung, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":1,"WE2":2,"WE3":2,"WE4":1}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Cibiru', 'market', 'seed:bdg100:v1:048', 9, 24, false, null, null, 'Cibiru', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Cibiru, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Terminal Cibiru', 'transport', 'seed:bdg100:v1:049', 9, 24, false, null, null, 'Cibiru', array['BIKE','PARCEL'], array[]::text[], 'low', 'Terminal Cibiru, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":2,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- CICENDO (4)
('Bandara Husein Sastranegara', 'transport', 'seed:bdg100:v1:050', 9, 24, false, null, null, 'Cicendo', array['BIKE','PARCEL'], array[]::text[], 'low', 'Bandara Husein Sastranegara, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Istana Plaza', 'mall', 'seed:bdg100:v1:051', 9, 24, false, null, null, 'Cicendo', array['BIKE','FOOD'], array['PASIRKALIKI'], 'low', 'Istana Plaza, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Pasirkaliki', 'corridor', 'seed:bdg100:v1:052', 9, 24, false, null, null, 'Cicendo', array['BIKE','PARCEL','FOOD'], array['PASIRKALIKI'], 'low', 'Jalan Pasirkaliki, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('23 Paskal Shopping Center', 'mall', 'seed:bdg100:v1:053', 9, 24, false, null, null, 'Cicendo', array['BIKE','FOOD'], array[]::text[], 'low', '23 Paskal Shopping Center, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- CIDADAP (3)
('Terminal Ledeng', 'transport', 'seed:bdg100:v1:054', 9, 24, false, null, null, 'Cidadap', array['BIKE','PARCEL'], array['SETIABUDI'], 'low', 'Terminal Ledeng, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Setiabudi (Atas)', 'corridor', 'seed:bdg100:v1:055', 9, 24, false, null, null, 'Cidadap', array['BIKE','FOOD','PARCEL'], array['SETIABUDI'], 'low', 'Jalan Setiabudi, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Ciumbuleuit (Kuliner/Hotel)', 'culinary', 'seed:bdg100:v1:056', 9, 24, false, null, null, 'Cidadap', array['FOOD','BIKE'], array['CIUMBULEUIT'], 'low', 'Ciumbuleuit, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":2,"WD5":5,"WD6":4}', '{"WE1":2,"WE2":3,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- CINAMBO (3)
('Cisaranten Kulon (Area)', 'office', 'seed:bdg100:v1:057', 9, 24, false, null, null, 'Cinambo', array['FOOD','BIKE'], array[]::text[], 'low', 'Cisaranten Kulon, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Cisaranten Wetan (Area)', 'office', 'seed:bdg100:v1:058', 9, 24, false, null, null, 'Cinambo', array['FOOD','BIKE'], array[]::text[], 'low', 'Cisaranten Wetan, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Cinambo (Pusat Area)', 'office', 'seed:bdg100:v1:059', 9, 24, false, null, null, 'Cinambo', array['BIKE','FOOD'], array[]::text[], 'low', 'Cinambo, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- COBLONG (4)
('Institut Teknologi Bandung (ITB) Ganesha', 'campus', 'seed:bdg100:v1:060', 9, 24, false, null, null, 'Coblong', array['BIKE'], array[]::text[], 'low', 'Institut Teknologi Bandung (ITB), Ganesha, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":1,"WE2":2,"WE3":2,"WE4":1}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Cihampelas Walk (Ciwalk)', 'mall', 'seed:bdg100:v1:061', 9, 24, false, null, null, 'Coblong', array['BIKE','FOOD'], array['CIHAMPELAS'], 'low', 'Cihampelas Walk (Ciwalk), Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Dipatiukur (Kampus/Kuliner)', 'culinary', 'seed:bdg100:v1:062', 9, 24, false, null, null, 'Coblong', array['BIKE','FOOD'], array['DIPATIUKUR'], 'low', 'Dipatiukur, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":5,"WD6":5}', '{"WE1":2,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Simpang Dago / Dago Cikapayang', 'corridor', 'seed:bdg100:v1:063', 9, 24, false, null, null, 'Coblong', array['BIKE','FOOD','PARCEL'], array['DAGO'], 'low', 'Dago Cikapayang, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- GEDEBAGE (3)
('Pasar Gedebage', 'market', 'seed:bdg100:v1:064', 9, 24, false, null, null, 'Gedebage', array['FOOD','PARCEL'], array['SOEKARNO_HATTA'], 'low', 'Pasar Gedebage, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Stadion Gelora Bandung Lautan Api (GBLA)', 'event', 'seed:bdg100:v1:065', 9, 24, false, null, null, 'Gedebage', array['BIKE'], array['SOEKARNO_HATTA'], 'low', 'Stadion Gelora Bandung Lautan Api (GBLA), Kota Bandung', '{"WD1":0,"WD2":1,"WD3":1,"WD4":2,"WD5":3,"WD6":2}', '{"WE1":1,"WE2":2,"WE3":3,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Summarecon Bandung (Gedebage)', 'mall', 'seed:bdg100:v1:066', 9, 24, false, null, null, 'Gedebage', array['BIKE','FOOD'], array['SOEKARNO_HATTA'], 'low', 'Summarecon Bandung, Gedebage, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- KIARACONDONG (4)
('Stasiun Kiaracondong', 'transport', 'seed:bdg100:v1:067', 9, 24, false, null, null, 'Kiaracondong', array['BIKE','PARCEL'], array[]::text[], 'low', 'Stasiun Kiaracondong, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Terminal Cicaheum', 'transport', 'seed:bdg100:v1:068', 9, 24, false, null, null, 'Kiaracondong', array['BIKE','PARCEL'], array[]::text[], 'low', 'Terminal Cicaheum, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Jakarta', 'corridor', 'seed:bdg100:v1:069', 9, 24, false, null, null, 'Kiaracondong', array['BIKE','FOOD','PARCEL'], array['JALAN_JAKARTA'], 'low', 'Jalan Jakarta, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Kiaracondong', 'market', 'seed:bdg100:v1:070', 9, 24, false, null, null, 'Kiaracondong', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Kiaracondong, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- LENGKONG (4)
('Lengkong Kecil (Kuliner)', 'culinary', 'seed:bdg100:v1:071', 9, 24, false, null, null, 'Lengkong', array['FOOD','BIKE'], array['LENGKONG_KECIL'], 'low', 'Lengkong Kecil, Kota Bandung', '{"WD1":0,"WD2":1,"WD3":1,"WD4":2,"WD5":5,"WD6":5}', '{"WE1":1,"WE2":2,"WE3":3,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Jalan Burangrang (Kuliner)', 'culinary', 'seed:bdg100:v1:072', 9, 24, false, null, null, 'Lengkong', array['FOOD','BIKE'], array['BURANGRANG'], 'low', 'Jalan Burangrang, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":2,"WD5":5,"WD6":4}', '{"WE1":2,"WE2":3,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Palasari (Pusat Buku)', 'market', 'seed:bdg100:v1:073', 9, 24, false, null, null, 'Lengkong', array['PARCEL','BIKE'], array[]::text[], 'low', 'Pasar Buku Palasari, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Lapangan Lodaya', 'office', 'seed:bdg100:v1:074', 9, 24, false, null, null, 'Lengkong', array['BIKE'], array[]::text[], 'low', 'Lapangan Lodaya, Kota Bandung', '{"WD1":1,"WD2":1,"WD3":1,"WD4":2,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":2,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- MANDALAJATI (3)
('Jatihandap (Area)', 'office', 'seed:bdg100:v1:075', 9, 24, false, null, null, 'Mandalajati', array['FOOD','BIKE'], array[]::text[], 'low', 'Jatihandap, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasir Impun (Area)', 'office', 'seed:bdg100:v1:076', 9, 24, false, null, null, 'Mandalajati', array['FOOD','BIKE'], array[]::text[], 'low', 'Pasir Impun, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Cikadut', 'corridor', 'seed:bdg100:v1:077', 9, 24, false, null, null, 'Mandalajati', array['BIKE','PARCEL'], array['CIKADUT'], 'low', 'Jalan Cikadut, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- PANYILEUKAN (3)
('Bundaran Cibiru (Soekarno Hatta)', 'corridor', 'seed:bdg100:v1:078', 9, 24, false, null, null, 'Panyileukan', array['BIKE','PARCEL'], array['SOEKARNO_HATTA'], 'low', 'Bundaran Cibiru Soekarno Hatta, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":3,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Komplek Bumi Panyileukan', 'office', 'seed:bdg100:v1:079', 9, 24, false, null, null, 'Panyileukan', array['FOOD','BIKE'], array[]::text[], 'low', 'Bumi Panyileukan, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Soekarno Hatta (Panyileukan)', 'corridor', 'seed:bdg100:v1:080', 9, 24, false, null, null, 'Panyileukan', array['BIKE','PARCEL'], array['SOEKARNO_HATTA'], 'low', 'Jalan Soekarno Hatta (Panyileukan), Kota Bandung', '{"WD1":3,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- RANCASARI (3)
('RS Al-Islam Bandung', 'hospital', 'seed:bdg100:v1:081', 9, 24, false, null, null, 'Rancasari', array['BIKE'], array['SOEKARNO_HATTA'], 'low', 'RS Al-Islam Bandung, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Ciwastra', 'market', 'seed:bdg100:v1:082', 9, 24, false, null, null, 'Rancasari', array['FOOD','PARCEL'], array['CIWASTRA'], 'low', 'Pasar Ciwastra, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Derwati (Area)', 'office', 'seed:bdg100:v1:083', 9, 24, false, null, null, 'Rancasari', array['FOOD','BIKE'], array[]::text[], 'low', 'Derwati, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- REGOL (4)
('Alun-Alun Bandung', 'tourism', 'seed:bdg100:v1:084', 9, 24, false, null, null, 'Regol', array['BIKE'], array[]::text[], 'low', 'Alun-Alun Bandung, Kota Bandung', '{"WD1":2,"WD2":2,"WD3":2,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":3,"WE3":4,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Mohammad Toha', 'corridor', 'seed:bdg100:v1:085', 9, 24, false, null, null, 'Regol', array['BIKE','PARCEL'], array['MOH_TOHA'], 'low', 'Jalan Mohammad Toha, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":3,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Jalan Pungkur (Kuliner)', 'culinary', 'seed:bdg100:v1:086', 9, 24, false, null, null, 'Regol', array['FOOD','BIKE'], array['PUNGKUR'], 'low', 'Jalan Pungkur, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":2,"WD5":5,"WD6":4}', '{"WE1":2,"WE2":3,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Jalan BKR (Area)', 'corridor', 'seed:bdg100:v1:087', 9, 24, false, null, null, 'Regol', array['BIKE','PARCEL','FOOD'], array['BKR'], 'low', 'Jalan BKR, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- SUKAJADI (4)
('Paris Van Java (PVJ)', 'mall', 'seed:bdg100:v1:088', 9, 24, false, null, null, 'Sukajadi', array['BIKE','FOOD'], array['SUKAJADI'], 'low', 'Paris Van Java Mall, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Koridor Jalan Sukajadi', 'corridor', 'seed:bdg100:v1:089', 9, 24, false, null, null, 'Sukajadi', array['BIKE','FOOD','PARCEL'], array['SUKAJADI'], 'low', 'Jalan Sukajadi, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Gerbang Tol Pasteur', 'transport', 'seed:bdg100:v1:090', 9, 24, false, null, null, 'Sukajadi', array['BIKE','PARCEL'], array['PASTEUR'], 'low', 'Gerbang Tol Pasteur, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":3,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":3,"WE2":3,"WE3":4,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Setrasari (Area)', 'office', 'seed:bdg100:v1:091', 9, 24, false, null, null, 'Sukajadi', array['FOOD','BIKE'], array['SUKAJADI'], 'low', 'Setrasari, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":3}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- SUKASARI (3)
('Universitas Pendidikan Indonesia (UPI)', 'campus', 'seed:bdg100:v1:092', 9, 24, false, null, null, 'Sukasari', array['BIKE'], array['SETIABUDI'], 'low', 'Universitas Pendidikan Indonesia (UPI), Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":1,"WE2":2,"WE3":2,"WE4":1}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Gegerkalong (Kuliner)', 'culinary', 'seed:bdg100:v1:093', 9, 24, false, null, null, 'Sukasari', array['FOOD','BIKE'], array['GEGERKALONG'], 'low', 'Gegerkalong, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":2,"WD5":5,"WD6":4}', '{"WE1":2,"WE2":3,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Sarijadi (Komplek)', 'office', 'seed:bdg100:v1:094', 9, 24, false, null, null, 'Sukasari', array['FOOD','BIKE'], array[]::text[], 'low', 'Sarijadi, Kota Bandung', '{"WD1":2,"WD2":4,"WD3":3,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- SUMUR BANDUNG (3)
('Jalan Braga', 'tourism', 'seed:bdg100:v1:095', 9, 24, false, null, null, 'Sumur Bandung', array['BIKE','FOOD'], array['BRAGA'], 'low', 'Jalan Braga, Kota Bandung', '{"WD1":2,"WD2":3,"WD3":2,"WD4":3,"WD5":5,"WD6":5}', '{"WE1":3,"WE2":4,"WE3":4,"WE4":5}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Gedung Merdeka (Asia Afrika)', 'tourism', 'seed:bdg100:v1:096', 9, 24, false, null, null, 'Sumur Bandung', array['BIKE'], array['ASIA_AFRIKA'], 'low', 'Gedung Merdeka, Jalan Asia Afrika, Kota Bandung', '{"WD1":2,"WD2":2,"WD3":2,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":3,"WE2":3,"WE3":4,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Kosambi', 'market', 'seed:bdg100:v1:097', 9, 24, false, null, null, 'Sumur Bandung', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Kosambi, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),

-- UJUNG BERUNG (3)
('Alun-Alun Ujung Berung', 'tourism', 'seed:bdg100:v1:098', 9, 24, false, null, null, 'Ujung Berung', array['BIKE','FOOD'], array[]::text[], 'low', 'Alun Alun Ujung Berung, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":3,"WD5":4,"WD6":3}', '{"WE1":2,"WE2":3,"WE3":4,"WE4":4}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Pasar Ujung Berung', 'market', 'seed:bdg100:v1:099', 9, 24, false, null, null, 'Ujung Berung', array['FOOD','PARCEL'], array[]::text[], 'low', 'Pasar Ujung Berung, Kota Bandung', '{"WD1":1,"WD2":3,"WD3":2,"WD4":3,"WD5":2,"WD6":1}', '{"WE1":2,"WE2":3,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']),
('Terminal Ujung Berung', 'transport', 'seed:bdg100:v1:100', 9, 24, false, null, null, 'Ujung Berung', array['BIKE','PARCEL'], array[]::text[], 'low', 'Terminal Ujung Berung, Kota Bandung', '{"WD1":1,"WD2":2,"WD3":2,"WD4":4,"WD5":3,"WD6":2}', '{"WE1":2,"WE2":2,"WE3":3,"WE4":2}', array['WEEKDAY','WEEKEND','HOLIDAY']);

commit;
