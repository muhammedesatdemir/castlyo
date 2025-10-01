-- Add skills and languages columns to talent_profiles table
ALTER TABLE talent_profiles 
ADD COLUMN skills TEXT,
ADD COLUMN languages TEXT;
