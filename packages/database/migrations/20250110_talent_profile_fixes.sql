-- Migration: Fix talent profiles for production
-- 1) Create talent_gender enum (MALE/FEMALE only)
-- 2) Create city_code enum (81 Turkish provinces)
-- 3) Update talent_profiles table structure

-- 1) talent_gender: MALE/FEMALE (OTHER removed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'talent_gender') THEN
    CREATE TYPE talent_gender AS ENUM ('MALE','FEMALE');
  END IF;
END$$;

-- 2) city_code: 81 il (ASCII, UPPER, Türkçe karakterler sadeleştirilmiş)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'city_code') THEN
    CREATE TYPE city_code AS ENUM (
      'ADANA','ADIYAMAN','AFYONKARAHISAR','AGRI','AMASYA','ANKARA','ANTALYA','ARTVIN','AYDIN',
      'BALIKESIR','BILECIK','BINGOL','BITLIS','BOLU','BURDUR','BURSA',
      'CANAKKALE','CANKIRI','CORUM','DENIZLI','DIYARBAKIR','EDIRNE','ELAZIG','ERZINCAN','ERZURUM',
      'ESKISEHIR','GAZIANTEP','GIRESUN','GUMUSHANE','HAKKARI','HATAY','ISPARTA','MERSIN','ISTANBUL','IZMIR',
      'KARS','KASTAMONU','KAYSERI','KIRKLARELI','KIRSEHIR','KOCAELI','KONYA','KUTAHYA','MALATYA','MANISA',
      'KAHRAMANMARAS','MARDIN','MUGLA','MUS','NEVSEHIR','NIGDE','ORDU','RIZE','SAKARYA','SAMSUN','SIIRT','SINOP',
      'SIVAS','TEKIRDAG','TOKAT','TRABZON','TUNCELI','SANLIURFA','USAK','VAN','YOZGAT','ZONGULDAK',
      'AKSARAY','BAYBURT','KARAMAN','KIRIKKALE','BATMAN','SIRNAK','BARTIN','ARDAHAN','IGDIR','YALOVA',
      'KARABUK','KILIS','OSMANIYE','DUZCE'
    );
  END IF;
END$$;

-- 3) Update talent_profiles table
-- First, handle existing data - convert OTHER gender to NULL
UPDATE talent_profiles
SET gender = NULL
WHERE gender = 'OTHER';

-- Add new columns with proper types
ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS talent_gender talent_gender,
  ADD COLUMN IF NOT EXISTS city_code city_code;

-- Migrate existing data
UPDATE talent_profiles
SET talent_gender = gender::talent_gender
WHERE gender IN ('MALE', 'FEMALE');

-- Update city to city_code (normalize existing city names)
UPDATE talent_profiles
SET city_code = CASE
  WHEN UPPER(TRIM(city)) = 'İSTANBUL' OR UPPER(TRIM(city)) = 'ISTANBUL' THEN 'ISTANBUL'::city_code
  WHEN UPPER(TRIM(city)) = 'İZMİR' OR UPPER(TRIM(city)) = 'IZMIR' THEN 'IZMIR'::city_code
  WHEN UPPER(TRIM(city)) = 'ANKARA' THEN 'ANKARA'::city_code
  WHEN UPPER(TRIM(city)) = 'BURSA' THEN 'BURSA'::city_code
  WHEN UPPER(TRIM(city)) = 'ANTALYA' THEN 'ANTALYA'::city_code
  WHEN UPPER(TRIM(city)) = 'ADANA' THEN 'ADANA'::city_code
  WHEN UPPER(TRIM(city)) = 'KONYA' THEN 'KONYA'::city_code
  WHEN UPPER(TRIM(city)) = 'GAZIANTEP' THEN 'GAZIANTEP'::city_code
  WHEN UPPER(TRIM(city)) = 'MERSIN' THEN 'MERSIN'::city_code
  WHEN UPPER(TRIM(city)) = 'DİYARBAKIR' OR UPPER(TRIM(city)) = 'DIYARBAKIR' THEN 'DIYARBAKIR'::city_code
  WHEN UPPER(TRIM(city)) = 'KAYSERI' THEN 'KAYSERI'::city_code
  WHEN UPPER(TRIM(city)) = 'ESKISEHIR' THEN 'ESKISEHIR'::city_code
  WHEN UPPER(TRIM(city)) = 'URFA' OR UPPER(TRIM(city)) = 'ŞANLIURFA' OR UPPER(TRIM(city)) = 'SANLIURFA' THEN 'SANLIURFA'::city_code
  WHEN UPPER(TRIM(city)) = 'MALATYA' THEN 'MALATYA'::city_code
  WHEN UPPER(TRIM(city)) = 'ERZURUM' THEN 'ERZURUM'::city_code
  WHEN UPPER(TRIM(city)) = 'VAN' THEN 'VAN'::city_code
  WHEN UPPER(TRIM(city)) = 'BATMAN' THEN 'BATMAN'::city_code
  WHEN UPPER(TRIM(city)) = 'ELAZIG' THEN 'ELAZIG'::city_code
  WHEN UPPER(TRIM(city)) = 'İZMİT' OR UPPER(TRIM(city)) = 'KOCAELI' THEN 'KOCAELI'::city_code
  WHEN UPPER(TRIM(city)) = 'MANISA' THEN 'MANISA'::city_code
  WHEN UPPER(TRIM(city)) = 'SIVAS' THEN 'SIVAS'::city_code
  WHEN UPPER(TRIM(city)) = 'GEBZE' OR UPPER(TRIM(city)) = 'KOCAELI' THEN 'KOCAELI'::city_code
  WHEN UPPER(TRIM(city)) = 'BALIKESIR' THEN 'BALIKESIR'::city_code
  WHEN UPPER(TRIM(city)) = 'KAHRAHMANMARAS' OR UPPER(TRIM(city)) = 'KAHRAMANMARAS' THEN 'KAHRAMANMARAS'::city_code
  WHEN UPPER(TRIM(city)) = 'VAN' THEN 'VAN'::city_code
  WHEN UPPER(TRIM(city)) = 'DENIZLI' THEN 'DENIZLI'::city_code
  WHEN UPPER(TRIM(city)) = 'SAMSUN' THEN 'SAMSUN'::city_code
  WHEN UPPER(TRIM(city)) = 'KAYSERI' THEN 'KAYSERI'::city_code
  WHEN UPPER(TRIM(city)) = 'MUGLA' THEN 'MUGLA'::city_code
  WHEN UPPER(TRIM(city)) = 'TEKIRDAG' THEN 'TEKIRDAG'::city_code
  WHEN UPPER(TRIM(city)) = 'TRABZON' THEN 'TRABZON'::city_code
  WHEN UPPER(TRIM(city)) = 'ORDU' THEN 'ORDU'::city_code
  WHEN UPPER(TRIM(city)) = 'AFYONKARAHISAR' THEN 'AFYONKARAHISAR'::city_code
  WHEN UPPER(TRIM(city)) = 'ISPARTA' THEN 'ISPARTA'::city_code
  WHEN UPPER(TRIM(city)) = 'EDIRNE' THEN 'EDIRNE'::city_code
  WHEN UPPER(TRIM(city)) = 'MARDIN' THEN 'MARDIN'::city_code
  WHEN UPPER(TRIM(city)) = 'UŞAK' OR UPPER(TRIM(city)) = 'USAK' THEN 'USAK'::city_code
  WHEN UPPER(TRIM(city)) = 'DÜZCE' OR UPPER(TRIM(city)) = 'DUZCE' THEN 'DUZCE'::city_code
  WHEN UPPER(TRIM(city)) = 'AKSARAY' THEN 'AKSARAY'::city_code
  WHEN UPPER(TRIM(city)) = 'KILIS' THEN 'KILIS'::city_code
  WHEN UPPER(TRIM(city)) = 'OSMANIYE' THEN 'OSMANIYE'::city_code
  WHEN UPPER(TRIM(city)) = 'ÇANKIRI' OR UPPER(TRIM(city)) = 'CANKIRI' THEN 'CANKIRI'::city_code
  WHEN UPPER(TRIM(city)) = 'KARABUK' THEN 'KARABUK'::city_code
  WHEN UPPER(TRIM(city)) = 'BARTIN' THEN 'BARTIN'::city_code
  WHEN UPPER(TRIM(city)) = 'ARDAHAN' THEN 'ARDAHAN'::city_code
  WHEN UPPER(TRIM(city)) = 'IĞDIR' OR UPPER(TRIM(city)) = 'IGDIR' THEN 'IGDIR'::city_code
  WHEN UPPER(TRIM(city)) = 'YALOVA' THEN 'YALOVA'::city_code
  WHEN UPPER(TRIM(city)) = 'KARAMAN' THEN 'KARAMAN'::city_code
  WHEN UPPER(TRIM(city)) = 'KIRIKKALE' THEN 'KIRIKKALE'::city_code
  WHEN UPPER(TRIM(city)) = 'SIRNAK' THEN 'SIRNAK'::city_code
  WHEN UPPER(TRIM(city)) = 'BAYBURT' THEN 'BAYBURT'::city_code
  WHEN UPPER(TRIM(city)) = 'ZONGULDAK' THEN 'ZONGULDAK'::city_code
  WHEN UPPER(TRIM(city)) = 'YOZGAT' THEN 'YOZGAT'::city_code
  WHEN UPPER(TRIM(city)) = 'TUNCELI' THEN 'TUNCELI'::city_code
  WHEN UPPER(TRIM(city)) = 'TOKAT' THEN 'TOKAT'::city_code
  WHEN UPPER(TRIM(city)) = 'SINOP' THEN 'SINOP'::city_code
  WHEN UPPER(TRIM(city)) = 'SIIRT' THEN 'SIIRT'::city_code
  WHEN UPPER(TRIM(city)) = 'SAKARYA' THEN 'SAKARYA'::city_code
  WHEN UPPER(TRIM(city)) = 'RIZE' THEN 'RIZE'::city_code
  WHEN UPPER(TRIM(city)) = 'NIGDE' THEN 'NIGDE'::city_code
  WHEN UPPER(TRIM(city)) = 'NEVSEHIR' THEN 'NEVSEHIR'::city_code
  WHEN UPPER(TRIM(city)) = 'MUS' THEN 'MUS'::city_code
  WHEN UPPER(TRIM(city)) = 'KUTAHYA' THEN 'KUTAHYA'::city_code
  WHEN UPPER(TRIM(city)) = 'KASTAMONU' THEN 'KASTAMONU'::city_code
  WHEN UPPER(TRIM(city)) = 'KARS' THEN 'KARS'::city_code
  WHEN UPPER(TRIM(city)) = 'KIRSEHIR' THEN 'KIRSEHIR'::city_code
  WHEN UPPER(TRIM(city)) = 'KIRKLARELI' THEN 'KIRKLARELI'::city_code
  WHEN UPPER(TRIM(city)) = 'HATAY' THEN 'HATAY'::city_code
  WHEN UPPER(TRIM(city)) = 'HAKKARI' THEN 'HAKKARI'::city_code
  WHEN UPPER(TRIM(city)) = 'GUMUSHANE' THEN 'GUMUSHANE'::city_code
  WHEN UPPER(TRIM(city)) = 'GIRESUN' THEN 'GIRESUN'::city_code
  WHEN UPPER(TRIM(city)) = 'GIRESUN' THEN 'GIRESUN'::city_code
  WHEN UPPER(TRIM(city)) = 'ERZINCAN' THEN 'ERZINCAN'::city_code
  WHEN UPPER(TRIM(city)) = 'ELAZIG' THEN 'ELAZIG'::city_code
  WHEN UPPER(TRIM(city)) = 'ÇORUM' OR UPPER(TRIM(city)) = 'CORUM' THEN 'CORUM'::city_code
  WHEN UPPER(TRIM(city)) = 'ÇANAKKALE' OR UPPER(TRIM(city)) = 'CANAKKALE' THEN 'CANAKKALE'::city_code
  WHEN UPPER(TRIM(city)) = 'BURDUR' THEN 'BURDUR'::city_code
  WHEN UPPER(TRIM(city)) = 'BOLU' THEN 'BOLU'::city_code
  WHEN UPPER(TRIM(city)) = 'BITLIS' THEN 'BITLIS'::city_code
  WHEN UPPER(TRIM(city)) = 'BINGOL' THEN 'BINGOL'::city_code
  WHEN UPPER(TRIM(city)) = 'BILECIK' THEN 'BILECIK'::city_code
  WHEN UPPER(TRIM(city)) = 'BALIKESIR' THEN 'BALIKESIR'::city_code
  WHEN UPPER(TRIM(city)) = 'AYDIN' THEN 'AYDIN'::city_code
  WHEN UPPER(TRIM(city)) = 'ARTVIN' THEN 'ARTVIN'::city_code
  WHEN UPPER(TRIM(city)) = 'AMASYA' THEN 'AMASYA'::city_code
  WHEN UPPER(TRIM(city)) = 'AĞRI' OR UPPER(TRIM(city)) = 'AGRI' THEN 'AGRI'::city_code
  WHEN UPPER(TRIM(city)) = 'AFYONKARAHISAR' THEN 'AFYONKARAHISAR'::city_code
  WHEN UPPER(TRIM(city)) = 'ADIYAMAN' THEN 'ADIYAMAN'::city_code
  WHEN UPPER(TRIM(city)) = 'ADANA' THEN 'ADANA'::city_code
  ELSE NULL
END
WHERE city IS NOT NULL;

-- Drop old columns and rename new ones
ALTER TABLE talent_profiles
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS city;

ALTER TABLE talent_profiles
  RENAME COLUMN talent_gender TO gender;

ALTER TABLE talent_profiles
  RENAME COLUMN city_code TO city;

-- Add constraints
ALTER TABLE talent_profiles
  ALTER COLUMN gender TYPE talent_gender USING gender::talent_gender;

ALTER TABLE talent_profiles
  ALTER COLUMN city TYPE city_code USING city::city_code;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_talent_profiles_city ON talent_profiles(city);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_gender ON talent_profiles(gender);

-- Update birth_date column to use proper date type
ALTER TABLE talent_profiles
  ALTER COLUMN birth_date TYPE DATE USING birth_date::DATE;

-- Add height_cm and weight_kg columns if they don't exist
ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg INTEGER;

-- Migrate existing height/weight data
UPDATE talent_profiles
SET height_cm = height
WHERE height IS NOT NULL AND height_cm IS NULL;

UPDATE talent_profiles
SET weight_kg = weight
WHERE weight IS NOT NULL AND weight_kg IS NULL;

-- Drop old height/weight columns
ALTER TABLE talent_profiles
  DROP COLUMN IF EXISTS height,
  DROP COLUMN IF EXISTS weight;
