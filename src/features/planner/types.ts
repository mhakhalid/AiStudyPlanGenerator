// ── Shared domain types returned by the planner API ──────────────────────────
// Dates arrive as ISO strings over JSON; we keep them as strings here.

export interface AssessmentApi {
  id: string;
  title: string;
  courseName: string | null;
  dueAt: string;
  weightPercent: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicApi {
  id: string;
  assessmentId: string;
  name: string;
  difficulty: number;
  mastery: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionApi {
  id: string;
  sessionId: string;
  understanding: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus = "PENDING" | "COMPLETED" | "MISSED";

export interface SessionApi {
  id: string;
  assessmentId: string;
  topicId: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  topic: { name: string } | null;
  reflection: ReflectionApi | null;
  createdAt: string;
  updatedAt: string;
}
