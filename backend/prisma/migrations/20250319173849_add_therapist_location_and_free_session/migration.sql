-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "freeSessions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Therapist" ADD COLUMN     "address" TEXT,
ADD COLUMN     "attendanceMode" TEXT NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "city" TEXT,
ADD COLUMN     "freeSessionDuration" INTEGER,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "offersFreeSession" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;
