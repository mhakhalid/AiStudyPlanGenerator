import type {
  PrismaClient,
  SemesterPlan,
  SemesterSession,
  Prisma,
} from "@prisma/client";

export type SemesterPlanWithRelations = Prisma.SemesterPlanGetPayload<{
  include: {
    courses: { include: { exams: true } };
    availability: true;
    sessions: { include: { semesterCourse: true } };
  };
}>;

export interface CreateSemesterPlanParams {
  userId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  courses: {
    name: string;
    creditHours?: number;
    priority?: number;
    exams?: {
      title: string;
      scheduledAt: Date;
      weightPercent?: number;
    }[];
  }[];
  availability: {
    dayOfWeek: import("@prisma/client").DayOfWeek;
    startHour: number;
    endHour: number;
  }[];
}

export interface CreateSessionData {
  semesterPlanId: string;
  semesterCourseId: string;
  scheduledAt: Date;
  durationMinutes: number;
}

export interface SemesterPlanRepository {
  create(params: CreateSemesterPlanParams): Promise<SemesterPlan>;
  findAllByUser(userId: string): Promise<SemesterPlan[]>;
  findByIdAndUser(
    id: string,
    userId: string
  ): Promise<SemesterPlanWithRelations | null>;
  replaceSessionsForPlan(
    planId: string,
    sessions: CreateSessionData[]
  ): Promise<SemesterSession[]>;
}

export function createSemesterPlanRepository(
  db: PrismaClient
): SemesterPlanRepository {
  return {
    async create(params) {
      const { courses, availability, ...planData } = params;
      return db.semesterPlan.create({
        data: {
          ...planData,
          courses: {
            create: courses.map(({ exams, ...courseData }) => ({
              ...courseData,
              priority: courseData.priority ?? 5,
              exams: exams
                ? { create: exams }
                : undefined,
            })),
          },
          availability: {
            create: availability,
          },
        },
      });
    },

    findAllByUser(userId) {
      return db.semesterPlan.findMany({
        where: { userId },
        orderBy: { startDate: "asc" },
      });
    },

    findByIdAndUser(id, userId) {
      return db.semesterPlan.findFirst({
        where: { id, userId },
        include: {
          courses: { include: { exams: true } },
          availability: true,
          sessions: { include: { semesterCourse: true } },
        },
      });
    },

    async replaceSessionsForPlan(planId, sessions) {
      return db.$transaction(async (tx) => {
        await tx.semesterSession.deleteMany({ where: { semesterPlanId: planId } });
        await tx.semesterSession.createMany({ data: sessions });
        return tx.semesterSession.findMany({
          where: { semesterPlanId: planId },
          orderBy: { scheduledAt: "asc" },
        });
      });
    },
  };
}
