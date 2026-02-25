import { z } from "zod";

export const generatedSemesterSessionSchema = z.object({
  semesterCourseId: z.string().uuid("semesterCourseId must be a valid UUID"),
  date: z
    .string()
    .datetime({ message: "date must be a valid ISO 8601 datetime" }),
  durationMinutes: z
    .number()
    .int()
    .min(15, "durationMinutes must be at least 15")
    .max(480, "durationMinutes must be at most 480 (8 hours)"),
  notes: z.string().optional(),
});

export const aiSemesterResponseSchema = z.object({
  sessions: z
    .array(generatedSemesterSessionSchema)
    .min(1, "AI must return at least one session"),
});

export type GeneratedSemesterSession = z.infer<
  typeof generatedSemesterSessionSchema
>;
export type AiSemesterResponse = z.infer<typeof aiSemesterResponseSchema>;
