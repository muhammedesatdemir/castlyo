-- Dual column city model and gender tightening for talent_profiles
-- This migration is idempotent and safe to run multiple times.

-- 1) Ensure enums exist and are correct
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'talent_gender') THEN
    CREATE TYPE talent_gender AS ENUM ('MALE','FEMALE');
  END IF;
END$$;

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

-- 2) Add dual city columns if missing
ALTER TABLE talent_profiles
  ADD COLUMN IF NOT EXISTS city_label text,
  ADD COLUMN IF NOT EXISTS city_code city_code;

-- 3) Tighten gender to MALE/FEMALE only using talent_gender enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'talent_profiles' AND column_name = 'gender'
  ) THEN
    BEGIN
      -- Drop default to avoid cast issues
      ALTER TABLE talent_profiles ALTER COLUMN gender DROP DEFAULT;
      -- Any non-MALE/FEMALE becomes NULL
      UPDATE talent_profiles SET gender = NULL WHERE gender::text NOT IN ('MALE','FEMALE');
      -- Cast column type to talent_gender if not already
      BEGIN
        ALTER TABLE talent_profiles
          ALTER COLUMN gender TYPE talent_gender USING gender::talent_gender;
      EXCEPTION WHEN others THEN
        -- ignore if already the correct type
        NULL;
      END;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END$$;

-- 4) Ensure birth_date is DATE (nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'talent_profiles' AND column_name = 'birth_date'
  ) THEN
    BEGIN
      ALTER TABLE talent_profiles
        ALTER COLUMN birth_date TYPE DATE USING NULLIF(birth_date::text,'')::DATE;
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END$$;

-- 5) Add useful indexes
CREATE INDEX IF NOT EXISTS idx_talent_profiles_updated_at ON talent_profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_city_code ON talent_profiles(city_code);

-- 6) Safe data backfill from legacy columns (if present)
DO $$
DECLARE
  col_exists boolean;
BEGIN
  -- a) If city_label is NULL and legacy city exists (text or enum), copy it into label as text
  col_exists := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'talent_profiles' AND column_name = 'city'
  );
  IF col_exists THEN
    UPDATE talent_profiles
      SET city_label = COALESCE(city_label, NULLIF(city::text, ''))
    WHERE city_label IS NULL;
  END IF;

  -- b) Try to map label to city_code using ASCII/upper Turkish normalization
  -- Only set when we can map confidently; otherwise keep NULL.
  UPDATE talent_profiles SET city_code =
    CASE
      -- direct code already in label
      WHEN upper(regexp_replace(coalesce(city_label,''), '[İıŞşÇçĞğÜüÖö]', ' ', 'g')) IN (
        'ADANA','ADIYAMAN','AFYONKARAHISAR','AGRI','AMASYA','ANKARA','ANTALYA','ARTVIN','AYDIN',
        'BALIKESIR','BILECIK','BINGOL','BITLIS','BOLU','BURDUR','BURSA',
        'CANAKKALE','CANKIRI','CORUM','DENIZLI','DIYARBAKIR','EDIRNE','ELAZIG','ERZINCAN','ERZURUM',
        'ESKISEHIR','GAZIANTEP','GIRESUN','GUMUSHANE','HAKKARI','HATAY','ISPARTA','MERSIN','ISTANBUL','IZMIR',
        'KARS','KASTAMONU','KAYSERI','KIRKLARELI','KIRSEHIR','KOCAELI','KONYA','KUTAHYA','MALATYA','MANISA',
        'KAHRAMANMARAS','MARDIN','MUGLA','MUS','NEVSEHIR','NIGDE','ORDU','RIZE','SAKARYA','SAMSUN','SIIRT','SINOP',
        'SIVAS','TEKIRDAG','TOKAT','TRABZON','TUNCELI','SANLIURFA','USAK','VAN','YOZGAT','ZONGULDAK',
        'AKSARAY','BAYBURT','KARAMAN','KIRIKKALE','BATMAN','SIRNAK','BARTIN','ARDAHAN','IGDIR','YALOVA',
        'KARABUK','KILIS','OSMANIYE','DUZCE'
      ) THEN upper(regexp_replace(city_label, '[İıŞşÇçĞğÜüÖö]', ' ', 'g'))::city_code
      ELSE NULL
    END
  WHERE city_code IS NULL AND city_label IS NOT NULL;

  -- c) Legacy gender OTHER -> NULL already handled above
END$$;

-- Note: legacy column "city" is intentionally left in place for backward compatibility.


