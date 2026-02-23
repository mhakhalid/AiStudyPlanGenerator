import type { PrismaClient, StudySession, SessionStatus, Prisma } from "@prisma/client";

export type SessionWithAssessmentOwner = Prisma.StudySessionGetPayload<{
  include: { assessment: { select: { userId: true } } };
}>;

export interface CreateSessionParams {
  assessmentId: string;
  topicId?: string;
  scheduledAt: Date;
  durationMinutes: number;
}

export interface SessionRepository {
  create(params: CreateSessionParams): Promise<StudySession>;
  findByIdWithAssessment(id: string): Promise<SessionWithAssessmentOwner | null>;
  updateStatus(id: string, status: SessionStatus): Promise<StudySession>;
  // Atomically insert all sessions; rolls back if any insert fails
  createMany(params: CreateSessionParams[]): Promise<StudySession[]>;
}

export function createSessionRepository(db: PrismaClient): SessionRepository {
  return {
    create({ assessmentId, topicId, scheduledAt, durationMinutes }) {
      return db.studySession.create({
        data: { assessmentId, topicId, scheduledAt, durationMinutes },
      });
    },

    findByIdWithAssessment(id) {
      return db.studySession.findUnique({
        where: { id },
        include: { assessment: { select: { userId: true } } },
      });
    },

    updateStatus(id, status) {
      return db.studySession.update({ where: { id }, data: { status } });
    },

    createMany(params) {
      return db.$transaction(
        params.map(({ assessmentId, topicId, scheduledAt, durationMinutes }) =>
          db.studySession.create({
            data: { assessmentId, topicId, scheduledAt, durationMinutes },
          })
        )
      );
    },
  };
}
