import { z } from "zod";

/**
 * Schema for a single session item returned by the AI.
 *
 * NOTE: `focusLevel` and `notes` are validated here but not persisted in the
 * current schema (StudySession has no columns for them). They are kept in the
 * contract so Phase 4C can add those columns without breaking the AI interface.
 */
export const generatedSessionSchema = z.object({
  topicId: z.string().uuid("topicId must be a valid UUID"),
  date: z.string().datetime({ message: "date must be a valid ISO 8601 datetime" }),
  durationMinutes: z
    .number()
    .int()
    .min(15, "durationMinutes must be at least 15")
    .max(480, "durationMinutes must be at most 480 (8 hours)"),
  focusLevel: z
    .number()
    .int()
    .min(1, "focusLevel must be between 1 and 10")
    .max(10, "focusLevel must be between 1 and 10"),
  notes: z.string().optional(),
});

export const aiPlanResponseSchema = z.object({
  sessions: z
    .array(generatedSessionSchema)
    .min(1, "AI must return at least one session"),
});

export type GeneratedSession = z.infer<typeof generatedSessionSchema>;
export type AiPlanResponse = z.infer<typeof aiPlanResponseSchema>;
