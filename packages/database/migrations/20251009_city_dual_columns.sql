-- Dual column city model for talent_profiles
-- - Ensure enums exist
-- - Add city_label (text) and city_code (city_code) columns
-- - Make gender use talent_gender
-- - Add index on city_code
-- - Keep legacy city column untouched for now

-- Ensure talent_gender exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'talent_gender') THEN
    CREATE TYPE talent_gender AS ENUM ('MALE','FEMALE');
  END IF;
END$$;

-- Ensure city_code exists (81 provinces)
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

-- Add dual columns on talent_profiles
ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS city_label text,
  ADD COLUMN IF NOT EXISTS city_code city_code;

-- Migrate gender to talent_gender if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'talent_profiles' AND column_name = 'gender'
  ) THEN
    BEGIN
      ALTER TABLE talent_profiles
        ALTER COLUMN gender DROP DEFAULT;
      -- Any non-MALE/FEMALE becomes NULL
      UPDATE talent_profiles SET gender = NULL WHERE gender NOT IN ('MALE','FEMALE');
      ALTER TABLE talent_profiles
        ALTER COLUMN gender TYPE talent_gender USING gender::talent_gender;
    EXCEPTION WHEN others THEN
      -- ignore if already migrated
      NULL;
    END;
  END IF;
END$$;

-- Standardize metric/date columns if exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='talent_profiles' AND column_name='birth_date') THEN
    BEGIN
      ALTER TABLE talent_profiles
        ALTER COLUMN birth_date TYPE DATE USING birth_date::DATE;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END$$;

-- Index on city_code for filtering
CREATE INDEX IF NOT EXISTS idx_talent_profiles_city_code ON talent_profiles(city_code);

-- NOTE: Legacy column talent_profiles.city is kept for now (cleanup later)

