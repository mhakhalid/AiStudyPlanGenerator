import type { Reflection } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors/AppError";
import { userService, type UserService } from "@/server/users/user.service";
import {
  createSessionRepository,
  type SessionRepository,
} from "@/server/sessions/session.repository";
import {
  createReflectionRepository,
  type ReflectionRepository,
  type CreateReflectionParams,
} from "./reflection.repository";

export type CreateReflectionData = Omit<CreateReflectionParams, "sessionId">;

export interface ReflectionService {
  createReflection(
    clerkId: string,
    email: string,
    sessionId: string,
    data: CreateReflectionData
  ): Promise<Reflection>;
}

export function createReflectionService(
  reflectionRepo: ReflectionRepository,
  sessionRepo: SessionRepository,
  users: UserService
): ReflectionService {
  return {
    async createReflection(clerkId, email, sessionId, data) {
      const user = await users.ensureUserExists(clerkId, email);
      const session = await sessionRepo.findByIdWithAssessment(sessionId);
      if (!session) {
        throw new AppError("Session not found", 404, "NOT_FOUND");
      }
      if (session.assessment.userId !== user.id) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
      }
      const existing = await reflectionRepo.findBySession(sessionId);
      if (existing) {
        throw new AppError(
          "Reflection already exists for this session",
          409,
          "CONFLICT"
        );
      }
      return reflectionRepo.create({ sessionId, ...data });
    },
  };
}

// Default singleton
const defaultReflectionRepo = createReflectionRepository(prisma);
const defaultSessionRepo = createSessionRepository(prisma);
export const reflectionService = createReflectionService(
  defaultReflectionRepo,
  defaultSessionRepo,
  userService
);
