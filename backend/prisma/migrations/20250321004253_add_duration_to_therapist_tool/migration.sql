/*
  Warnings:

  - The primary key for the `TherapistTool` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `TherapistTool` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `TherapistTool` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `TherapistTool` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TherapistTool` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TherapistTool" DROP CONSTRAINT "TherapistTool_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "TherapistTool" DROP CONSTRAINT "TherapistTool_toolId_fkey";

-- DropIndex
DROP INDEX "TherapistTool_therapistId_toolId_key";

-- AlterTable
ALTER TABLE "TherapistTool" DROP CONSTRAINT "TherapistTool_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ALTER COLUMN "price" SET DEFAULT 0,
ADD CONSTRAINT "TherapistTool_pkey" PRIMARY KEY ("therapistId", "toolId");

-- AddForeignKey
ALTER TABLE "TherapistTool" ADD CONSTRAINT "TherapistTool_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "Therapist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapistTool" ADD CONSTRAINT "TherapistTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
