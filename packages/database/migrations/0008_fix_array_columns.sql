-- Fix array columns to use proper PostgreSQL text[] arrays
-- This migration changes specialties, skills, and languages from TEXT to TEXT[]

-- First, we need to handle existing data by converting JSON strings to arrays
-- For specialties column
ALTER TABLE talent_profiles 
ALTER COLUMN specialties TYPE TEXT[] 
USING CASE 
  WHEN specialties IS NULL THEN NULL
  WHEN specialties = '' THEN ARRAY[]::TEXT[]
  WHEN specialties LIKE '[%]' THEN specialties::TEXT[]
  ELSE string_to_array(specialties, ',')::TEXT[]
END;

-- For skills column  
ALTER TABLE talent_profiles 
ALTER COLUMN skills TYPE TEXT[] 
USING CASE 
  WHEN skills IS NULL THEN NULL
  WHEN skills = '' THEN ARRAY[]::TEXT[]
  WHEN skills LIKE '[%]' THEN skills::TEXT[]
  ELSE string_to_array(skills, ',')::TEXT[]
END;

-- For languages column
ALTER TABLE talent_profiles 
ALTER COLUMN languages TYPE TEXT[] 
USING CASE 
  WHEN languages IS NULL THEN NULL
  WHEN languages = '' THEN ARRAY[]::TEXT[]
  WHEN languages LIKE '[%]' THEN languages::TEXT[]
  ELSE string_to_array(languages, ',')::TEXT[]
END;
