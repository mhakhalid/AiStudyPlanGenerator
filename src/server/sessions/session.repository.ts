import type { PrismaClient, StudySession, SessionStatus, Prisma } from "@prisma/client";

export type SessionWithAssessmentOwner = Prisma.StudySessionGetPayload<{
  include: { assessment: { select: { userId: true } } };
}>;

export type SessionWithDetails = Prisma.StudySessionGetPayload<{
  include: {
    topic: { select: { name: true } };
    reflection: true;
  };
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
  findAllByAssessmentWithDetails(assessmentId: string): Promise<SessionWithDetails[]>;
  /**
   * Atomically replaces all sessions for an assessment.
   * Deletes existing reflections and sessions first (FK safety), then inserts the
   * new sessions. All-or-nothing — rolls back if any step fails.
   */
  replaceForAssessment(
    assessmentId: string,
    params: CreateSessionParams[]
  ): Promise<StudySession[]>;
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

    findAllByAssessmentWithDetails(assessmentId) {
      return db.studySession.findMany({
        where: { assessmentId },
        include: {
          topic: { select: { name: true } },
          reflection: true,
        },
        orderBy: { scheduledAt: "asc" },
      });
    },

    replaceForAssessment(assessmentId, params) {
      return db.$transaction(async (tx) => {
        // 1. Identify existing sessions so we can cascade-delete their reflections
        const existing = await tx.studySession.findMany({
          where: { assessmentId },
          select: { id: true },
        });
        const ids = existing.map((s) => s.id);

        // 2. Delete reflections first (FK constraint prevents deleting sessions first)
        if (ids.length > 0) {
          await tx.reflection.deleteMany({ where: { sessionId: { in: ids } } });
        }

        // 3. Delete the sessions themselves
        await tx.studySession.deleteMany({ where: { assessmentId } });

        // 4. Create the new sessions
        return Promise.all(
          params.map(({ assessmentId: aid, topicId, scheduledAt, durationMinutes }) =>
            tx.studySession.create({
              data: { assessmentId: aid, topicId, scheduledAt, durationMinutes },
            })
          )
        );
      });
    },
  };
}
