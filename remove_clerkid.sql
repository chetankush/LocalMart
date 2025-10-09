-- Migration to remove clerkId column from users table
-- Run this in Supabase SQL Editor

-- Drop the clerkId column
ALTER TABLE users DROP COLUMN IF EXISTS "clerkId";

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
