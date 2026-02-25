-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "SemesterPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemesterPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterCourse" (
    "id" TEXT NOT NULL,
    "semesterPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creditHours" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemesterCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterExam" (
    "id" TEXT NOT NULL,
    "semesterCourseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "weightPercent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemesterExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterAvailability" (
    "id" TEXT NOT NULL,
    "semesterPlanId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SemesterAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterSession" (
    "id" TEXT NOT NULL,
    "semesterPlanId" TEXT NOT NULL,
    "semesterCourseId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemesterSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SemesterPlan_userId_idx" ON "SemesterPlan"("userId");

-- CreateIndex
CREATE INDEX "SemesterCourse_semesterPlanId_idx" ON "SemesterCourse"("semesterPlanId");

-- CreateIndex
CREATE INDEX "SemesterExam_semesterCourseId_idx" ON "SemesterExam"("semesterCourseId");

-- CreateIndex
CREATE INDEX "SemesterAvailability_semesterPlanId_idx" ON "SemesterAvailability"("semesterPlanId");

-- CreateIndex
CREATE INDEX "SemesterSession_semesterPlanId_idx" ON "SemesterSession"("semesterPlanId");

-- CreateIndex
CREATE INDEX "SemesterSession_scheduledAt_idx" ON "SemesterSession"("scheduledAt");

-- AddForeignKey
ALTER TABLE "SemesterPlan" ADD CONSTRAINT "SemesterPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterCourse" ADD CONSTRAINT "SemesterCourse_semesterPlanId_fkey" FOREIGN KEY ("semesterPlanId") REFERENCES "SemesterPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterExam" ADD CONSTRAINT "SemesterExam_semesterCourseId_fkey" FOREIGN KEY ("semesterCourseId") REFERENCES "SemesterCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterAvailability" ADD CONSTRAINT "SemesterAvailability_semesterPlanId_fkey" FOREIGN KEY ("semesterPlanId") REFERENCES "SemesterPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterSession" ADD CONSTRAINT "SemesterSession_semesterPlanId_fkey" FOREIGN KEY ("semesterPlanId") REFERENCES "SemesterPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterSession" ADD CONSTRAINT "SemesterSession_semesterCourseId_fkey" FOREIGN KEY ("semesterCourseId") REFERENCES "SemesterCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
