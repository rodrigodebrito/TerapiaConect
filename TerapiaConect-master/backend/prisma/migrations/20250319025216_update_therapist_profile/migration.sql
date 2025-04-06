/*
  Warnings:

  - You are about to drop the column `bio` on the `Therapist` table. All the data in the column will be lost.
  - You are about to drop the column `sessionPrice` on the `Therapist` table. All the data in the column will be lost.
  - You are about to drop the column `specialties` on the `Therapist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Therapist" DROP COLUMN "bio",
DROP COLUMN "sessionPrice",
DROP COLUMN "specialties",
ADD COLUMN     "baseSessionPrice" DOUBLE PRECISION,
ADD COLUMN     "customNiches" JSONB,
ADD COLUMN     "customTools" JSONB,
ADD COLUMN     "differential" TEXT,
ADD COLUMN     "niches" JSONB,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "servicePrices" JSONB,
ADD COLUMN     "shortBio" TEXT,
ADD COLUMN     "targetAudience" TEXT,
ADD COLUMN     "tools" JSONB;
