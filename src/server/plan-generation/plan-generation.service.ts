import type { StudySession } from "@prisma/client";
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
} from "@/server/sessions/session.repository";
import type { AiProvider } from "@/server/ai/ai.provider";
import { getGeminiProvider } from "@/server/ai/gemini.provider";
import { buildPlanPrompt } from "./plan-generation.prompt";
import { aiPlanResponseSchema } from "./plan-generation.schema";

export interface PlanGenerationService {
  /**
   * Generates a study plan for the given assessment via the AI provider
   * and atomically persists the resulting sessions.
   *
   * Throws:
   *  - NOT_FOUND (404)            – assessment does not exist / not owned by user
   *  - NO_TOPICS (422)            – assessment has no topics to plan around
   *  - AI_REQUEST_FAILED (502)    – AI provider network/API error
   *  - AI_INVALID_RESPONSE (502)  – AI returned malformed JSON
   *  - AI_VALIDATION_FAILED (502) – AI JSON failed Zod schema
   *  - AI_INVALID_TOPIC (502)     – AI referenced a topicId not in this assessment
   */
  generatePlan(
    clerkId: string,
    email: string,
    assessmentId: string
  ): Promise<StudySession[]>;
}

export function createPlanGenerationService(
  assessmentRepo: AssessmentRepository,
  sessionRepo: SessionRepository,
  users: UserService,
  ai: AiProvider
): PlanGenerationService {
  return {
    async generatePlan(clerkId, email, assessmentId) {
      // 1. Resolve DB user (upsert via Clerk identity)
      const user = await users.ensureUserExists(clerkId, email);

      // 2. Load assessment + topics, enforcing ownership in the same query
      const assessment = await assessmentRepo.findByIdAndUserWithTopics(
        assessmentId,
        user.id
      );
      if (!assessment) {
        throw new AppError("Assessment not found", 404, "NOT_FOUND");
      }
      if (assessment.topics.length === 0) {
        throw new AppError(
          "Assessment has no topics. Add at least one topic before generating a plan.",
          422,
          "NO_TOPICS"
        );
      }

      // 3. Build prompt and call AI provider
      const prompt = buildPlanPrompt(assessment);
      let rawText: string;
      try {
        rawText = await ai.complete(prompt);
      } catch (err) {
        // Re-throw typed AppErrors (e.g. AI_MISCONFIGURED) unchanged
        if (err instanceof AppError) throw err;
        throw new AppError(
          "AI provider request failed",
          502,
          "AI_REQUEST_FAILED"
        );
      }

      // 4. Parse JSON — the model is instructed to return pure JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new AppError(
          "AI returned malformed JSON",
          502,
          "AI_INVALID_RESPONSE"
        );
      }

      // 5. Validate the parsed value against the expected schema
      const validation = aiPlanResponseSchema.safeParse(parsed);
      if (!validation.success) {
        throw new AppError(
          `AI response failed schema validation: ${validation.error.issues[0].message}`,
          502,
          "AI_VALIDATION_FAILED"
        );
      }

      // 6. Guard against the AI hallucinating topicIds that don't belong to this assessment
      const validTopicIds = new Set(assessment.topics.map((t) => t.id));
      for (const session of validation.data.sessions) {
        if (!validTopicIds.has(session.topicId)) {
          throw new AppError(
            `AI referenced an unknown topicId: ${session.topicId}`,
            502,
            "AI_INVALID_TOPIC"
          );
        }
      }

      // 7. Persist sessions atomically — all or nothing
      // Note: focusLevel and notes from the AI response are validated above but
      // not stored here (StudySession schema has no columns for them yet).
      // Phase 4B can add those columns with a migration.
      const sessions = await sessionRepo.createMany(
        validation.data.sessions.map((s) => ({
          assessmentId,
          topicId: s.topicId,
          scheduledAt: new Date(s.date),
          durationMinutes: s.durationMinutes,
        }))
      );

      return sessions;
    },
  };
}

// ---------------------------------------------------------------------------
// Module-level singleton — lazily wires the real Gemini provider so a missing
// GEMINI_API_KEY does not crash the process at import time (surfaces at request
// time instead, as a typed 500 AppError).
// ---------------------------------------------------------------------------
const _assessmentRepo = createAssessmentRepository(prisma);
const _sessionRepo = createSessionRepository(prisma);

let _service: PlanGenerationService | null = null;

export function getPlanGenerationService(): PlanGenerationService {
  if (!_service) {
    _service = createPlanGenerationService(
      _assessmentRepo,
      _sessionRepo,
      userService,
      getGeminiProvider()
    );
  }
  return _service;
}
