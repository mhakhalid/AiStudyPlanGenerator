import type { PrismaClient, Assessment, Prisma } from "@prisma/client";

export type AssessmentWithTopics = Prisma.AssessmentGetPayload<{
  include: { topics: true };
}>;

export interface CreateAssessmentParams {
  userId: string;
  title: string;
  courseName?: string;
  dueAt: Date;
  weightPercent?: number;
  notes?: string;
}

export interface AssessmentRepository {
  create(params: CreateAssessmentParams): Promise<Assessment>;
  findAllByUser(userId: string): Promise<Assessment[]>;
  findByIdAndUser(id: string, userId: string): Promise<Assessment | null>;
  findByIdAndUserWithTopics(
    id: string,
    userId: string
  ): Promise<AssessmentWithTopics | null>;
}

export function createAssessmentRepository(db: PrismaClient): AssessmentRepository {
  return {
    create(params) {
      return db.assessment.create({ data: params });
    },
    findAllByUser(userId) {
      return db.assessment.findMany({
        where: { userId },
        orderBy: { dueAt: "asc" },
      });
    },
    // findFirst so we can filter by both id AND userId in one query (ownership check)
    findByIdAndUser(id, userId) {
      return db.assessment.findFirst({ where: { id, userId } });
    },
    findByIdAndUserWithTopics(id, userId) {
      return db.assessment.findFirst({
        where: { id, userId },
        include: { topics: true },
      });
    },
  };
}
