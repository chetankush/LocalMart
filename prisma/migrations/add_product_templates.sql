-- Add ProductTemplate table
CREATE TABLE IF NOT EXISTS "product_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedImage" TEXT,
    "suggestedPrice" DECIMAL(10,2),
    "suggestedWeight" DECIMAL(10,2),
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "product_templates_categoryId_idx" ON "product_templates"("categoryId");
CREATE INDEX IF NOT EXISTS "product_templates_isPopular_idx" ON "product_templates"("isPopular");
