-- Add location fields to vendors table
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "state" TEXT DEFAULT 'Madhya Pradesh';
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "locality" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "pincode" TEXT;

-- Create indexes for location fields
CREATE INDEX IF NOT EXISTS "vendors_city_idx" ON "vendors"("city");
CREATE INDEX IF NOT EXISTS "vendors_city_state_idx" ON "vendors"("city", "state");

-- Set default city for existing vendors
UPDATE "vendors" SET "city" = 'Guna' WHERE "city" IS NULL;

-- Make city NOT NULL after setting default
ALTER TABLE "vendors" ALTER COLUMN "city" SET NOT NULL;
