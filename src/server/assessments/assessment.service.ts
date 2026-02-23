import type { Assessment } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors/AppError";
import { userService, type UserService } from "@/server/users/user.service";
import {
  createAssessmentRepository,
  type AssessmentRepository,
  type CreateAssessmentParams,
} from "./assessment.repository";

export type CreateAssessmentData = Omit<CreateAssessmentParams, "userId">;

export interface AssessmentService {
  createAssessment(
    clerkId: string,
    email: string,
    data: CreateAssessmentData
  ): Promise<Assessment>;
  listAssessments(clerkId: string, email: string): Promise<Assessment[]>;
  getAssessment(
    clerkId: string,
    email: string,
    assessmentId: string
  ): Promise<Assessment>;
}

export function createAssessmentService(
  repo: AssessmentRepository,
  users: UserService
): AssessmentService {
  return {
    async createAssessment(clerkId, email, data) {
      const user = await users.ensureUserExists(clerkId, email);
      return repo.create({ userId: user.id, ...data });
    },

    async listAssessments(clerkId, email) {
      const user = await users.ensureUserExists(clerkId, email);
      return repo.findAllByUser(user.id);
    },

    async getAssessment(clerkId, email, assessmentId) {
      const user = await users.ensureUserExists(clerkId, email);
      const assessment = await repo.findByIdAndUser(assessmentId, user.id);
      if (!assessment) {
        throw new AppError("Assessment not found", 404, "NOT_FOUND");
      }
      return assessment;
    },
  };
}

// Default singleton wired to real Prisma client
const defaultRepo = createAssessmentRepository(prisma);
export const assessmentService = createAssessmentService(defaultRepo, userService);
