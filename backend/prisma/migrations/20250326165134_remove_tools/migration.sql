/*
  Warnings:

  - You are about to drop the column `mode` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `toolId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `customTools` on the `Therapist` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `Therapist` table. All the data in the column will be lost.
  - You are about to drop the column `servicePrices` on the `Therapist` table. All the data in the column will be lost.
  - The `customNiches` column on the `Therapist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `niches` column on the `Therapist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AIInsight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SessionReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SessionTranscript` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TherapistTool` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tool` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingMaterial` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `date` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `freeSessionDuration` on table `Therapist` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AIInsight" DROP CONSTRAINT "AIInsight_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_toolId_fkey";

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "SessionReport" DROP CONSTRAINT "SessionReport_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "SessionTranscript" DROP CONSTRAINT "SessionTranscript_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "TherapistTool" DROP CONSTRAINT "TherapistTool_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "TherapistTool" DROP CONSTRAINT "TherapistTool_toolId_fkey";

-- DropForeignKey
ALTER TABLE "TrainingMaterial" DROP CONSTRAINT "TrainingMaterial_userId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "mode",
DROP COLUMN "notes",
DROP COLUMN "time",
DROP COLUMN "toolId",
ADD COLUMN     "meetingUrl" TEXT,
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Therapist" DROP COLUMN "customTools",
DROP COLUMN "profilePicture",
DROP COLUMN "servicePrices",
ADD COLUMN     "complement" TEXT,
ALTER COLUMN "sessionDuration" DROP NOT NULL,
ALTER COLUMN "sessionDuration" DROP DEFAULT,
DROP COLUMN "customNiches",
ADD COLUMN     "customNiches" TEXT[],
DROP COLUMN "niches",
ADD COLUMN     "niches" TEXT[],
ALTER COLUMN "freeSessionDuration" SET NOT NULL,
ALTER COLUMN "freeSessionDuration" SET DEFAULT 30;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'CLIENT';

-- DropTable
DROP TABLE "AIInsight";

-- DropTable
DROP TABLE "Availability";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "SessionReport";

-- DropTable
DROP TABLE "SessionTranscript";

-- DropTable
DROP TABLE "TherapistTool";

-- DropTable
DROP TABLE "Tool";

-- DropTable
DROP TABLE "TrainingMaterial";

-- DropEnum
DROP TYPE "AppointmentStatus";

-- DropEnum
DROP TYPE "SessionStatus";

-- DropEnum
DROP TYPE "UserRole";

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
