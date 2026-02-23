/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `Reflection` table. All the data in the column will be lost.
  - You are about to drop the column `sentiment` on the `Reflection` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `StudySession` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `StudySession` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `StudySession` table. All the data in the column will be lost.
  - The `status` column on the `StudySession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `userId` on the `Topic` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionId]` on the table `Reflection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dueAt` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `understanding` to the `Reflection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Reflection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessmentId` to the `StudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMinutes` to the `StudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assessmentId` to the `Topic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Topic` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED');

-- DropForeignKey
ALTER TABLE "StudySession" DROP CONSTRAINT "StudySession_userId_fkey";

-- DropForeignKey
ALTER TABLE "Topic" DROP CONSTRAINT "Topic_userId_fkey";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "dueDate",
DROP COLUMN "weight",
ADD COLUMN     "courseName" TEXT,
ADD COLUMN     "dueAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weightPercent" INTEGER;

-- AlterTable
ALTER TABLE "Reflection" DROP COLUMN "completed",
DROP COLUMN "sentiment",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "understanding" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StudySession" DROP COLUMN "duration",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "assessmentId" TEXT NOT NULL,
ADD COLUMN     "durationMinutes" INTEGER NOT NULL,
ADD COLUMN     "topicId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Topic" DROP COLUMN "userId",
ADD COLUMN     "assessmentId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "difficulty" SET DEFAULT 5,
ALTER COLUMN "mastery" SET DEFAULT 5;

-- CreateIndex
CREATE INDEX "Assessment_userId_idx" ON "Assessment"("userId");

-- CreateIndex
CREATE INDEX "Assessment_dueAt_idx" ON "Assessment"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reflection_sessionId_key" ON "Reflection"("sessionId");

-- CreateIndex
CREATE INDEX "StudySession_assessmentId_idx" ON "StudySession"("assessmentId");

-- CreateIndex
CREATE INDEX "StudySession_scheduledAt_idx" ON "StudySession"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
