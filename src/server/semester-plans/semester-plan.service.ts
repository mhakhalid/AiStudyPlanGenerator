import type { SemesterPlan, SemesterSession } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors/AppError";
import { userService, type UserService } from "@/server/users/user.service";
import type { AiProvider } from "@/server/ai/ai.provider";
import { getGeminiProvider } from "@/server/ai/gemini.provider";
import {
  createSemesterPlanRepository,
  type SemesterPlanRepository,
  type SemesterPlanWithRelations,
  type CreateSemesterPlanParams,
} from "./semester-plan.repository";
import { buildSemesterPrompt } from "./semester-generation.prompt";
import { aiSemesterResponseSchema } from "./semester-generation.schema";

export type CreatePlanData = Omit<CreateSemesterPlanParams, "userId">;

export interface SemesterPlanService {
  createPlan(
    clerkId: string,
    email: string,
    data: CreatePlanData
  ): Promise<SemesterPlan>;
  listPlans(clerkId: string, email: string): Promise<SemesterPlan[]>;
  getPlan(
    clerkId: string,
    email: string,
    planId: string
  ): Promise<SemesterPlanWithRelations>;
  generateSessions(
    clerkId: string,
    email: string,
    planId: string
  ): Promise<SemesterSession[]>;
}

export function createSemesterPlanService(
  repo: SemesterPlanRepository,
  users: UserService,
  ai: AiProvider
): SemesterPlanService {
  return {
    async createPlan(clerkId, email, data) {
      const user = await users.ensureUserExists(clerkId, email);
      return repo.create({ userId: user.id, ...data });
    },

    async listPlans(clerkId, email) {
      const user = await users.ensureUserExists(clerkId, email);
      return repo.findAllByUser(user.id);
    },

    async getPlan(clerkId, email, planId) {
      const user = await users.ensureUserExists(clerkId, email);
      const plan = await repo.findByIdAndUser(planId, user.id);
      if (!plan) {
        throw new AppError("Semester plan not found", 404, "NOT_FOUND");
      }
      return plan;
    },

    async generateSessions(clerkId, email, planId) {
      // 1. Resolve user
      const user = await users.ensureUserExists(clerkId, email);

      // 2. Load plan with all relations (ownership enforced)
      const plan = await repo.findByIdAndUser(planId, user.id);
      if (!plan) {
        throw new AppError("Semester plan not found", 404, "NOT_FOUND");
      }

      // 3. Guards
      if (plan.courses.length === 0) {
        throw new AppError(
          "Semester plan has no courses. Add at least one course before generating.",
          422,
          "NO_COURSES"
        );
      }
      if (plan.availability.length === 0) {
        throw new AppError(
          "Semester plan has no availability slots. Set your weekly schedule before generating.",
          422,
          "NO_AVAILABILITY"
        );
      }

      // 4. Build prompt and call AI
      const prompt = buildSemesterPrompt(plan);
      let rawText: string;
      try {
        rawText = await ai.complete(prompt);
      } catch (err) {
        if (err instanceof AppError) throw err;
        console.error("[AI Error - semester-plan]", err);
        throw new AppError("AI provider request failed", 502, "AI_REQUEST_FAILED");
      }

      // 5. Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new AppError("AI returned malformed JSON", 502, "AI_INVALID_RESPONSE");
      }

      // 6. Validate schema
      const validation = aiSemesterResponseSchema.safeParse(parsed);
      if (!validation.success) {
        throw new AppError(
          `AI response failed schema validation: ${validation.error.issues[0].message}`,
          502,
          "AI_VALIDATION_FAILED"
        );
      }

      // 7. Guard against hallucinated course IDs
      const validCourseIds = new Set(plan.courses.map((c) => c.id));
      for (const session of validation.data.sessions) {
        if (!validCourseIds.has(session.semesterCourseId)) {
          throw new AppError(
            `AI referenced an unknown semesterCourseId: ${session.semesterCourseId}`,
            502,
            "AI_INVALID_COURSE"
          );
        }
      }

      // 8. Idempotent persist
      return repo.replaceSessionsForPlan(
        planId,
        validation.data.sessions.map((s) => ({
          semesterPlanId: planId,
          semesterCourseId: s.semesterCourseId,
          scheduledAt: new Date(s.date),
          durationMinutes: s.durationMinutes,
        }))
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Module-level singleton — lazily wires the real Gemini provider so a missing
// GEMINI_API_KEY does not crash the process at import time.
// ---------------------------------------------------------------------------
const _repo = createSemesterPlanRepository(prisma);

let _service: SemesterPlanService | null = null;

export function getSemesterPlanService(): SemesterPlanService {
  if (!_service) {
    _service = createSemesterPlanService(_repo, userService, getGeminiProvider());
  }
  return _service;
}
