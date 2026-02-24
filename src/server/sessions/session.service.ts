import type { StudySession, SessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors/AppError";
import { userService, type UserService } from "@/server/users/user.service";
import {
  createAssessmentRepository,
  type AssessmentRepository,
} from "@/server/assessments/assessment.repository";
import {
  createSessionRepository,
  type SessionRepository,
  type CreateSessionParams,
  type SessionWithDetails,
} from "./session.repository";

export type CreateSessionData = Omit<CreateSessionParams, "assessmentId">;

export interface SessionService {
  createSession(
    clerkId: string,
    email: string,
    assessmentId: string,
    data: CreateSessionData
  ): Promise<StudySession>;
  updateStatus(
    clerkId: string,
    email: string,
    sessionId: string,
    status: SessionStatus
  ): Promise<StudySession>;
  listSessionsForAssessment(
    clerkId: string,
    email: string,
    assessmentId: string
  ): Promise<SessionWithDetails[]>;
}

export function createSessionService(
  sessionRepo: SessionRepository,
  assessmentRepo: AssessmentRepository,
  users: UserService
): SessionService {
  return {
    async createSession(clerkId, email, assessmentId, data) {
      const user = await users.ensureUserExists(clerkId, email);
      const assessment = await assessmentRepo.findByIdAndUser(assessmentId, user.id);
      if (!assessment) {
        throw new AppError("Assessment not found", 404, "NOT_FOUND");
      }
      return sessionRepo.create({ assessmentId, ...data });
    },

    async updateStatus(clerkId, email, sessionId, status) {
      const user = await users.ensureUserExists(clerkId, email);
      const session = await sessionRepo.findByIdWithAssessment(sessionId);
      if (!session) {
        throw new AppError("Session not found", 404, "NOT_FOUND");
      }
      if (session.assessment.userId !== user.id) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }
      return sessionRepo.updateStatus(sessionId, status);
    },

    async listSessionsForAssessment(clerkId, email, assessmentId) {
      const user = await users.ensureUserExists(clerkId, email);
      const assessment = await assessmentRepo.findByIdAndUser(assessmentId, user.id);
      if (!assessment) {
        throw new AppError("Assessment not found", 404, "NOT_FOUND");
      }
      return sessionRepo.findAllByAssessmentWithDetails(assessmentId);
    },
  };
}

// Default singleton
const defaultSessionRepo = createSessionRepository(prisma);
const defaultAssessmentRepo = createAssessmentRepository(prisma);
export const sessionService = createSessionService(
  defaultSessionRepo,
  defaultAssessmentRepo,
  userService
);
