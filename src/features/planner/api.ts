import type {
  AssessmentApi,
  TopicApi,
  SessionApi,
  ReflectionApi,
} from "./types";

// ── Minimal typed fetch wrapper ───────────────────────────────────────────────

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Assessments ───────────────────────────────────────────────────────────────

export const plannerApi = {
  // Assessments
  getAssessments(): Promise<{ assessments: AssessmentApi[] }> {
    return apiFetch("/api/assessments");
  },

  createAssessment(data: {
    title: string;
    courseName?: string;
    dueAt: string;
    weightPercent?: number;
  }): Promise<{ assessment: AssessmentApi }> {
    return apiFetch("/api/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAssessment(id: string): Promise<{ assessment: AssessmentApi }> {
    return apiFetch(`/api/assessments/${id}`);
  },

  // Topics
  getTopics(assessmentId: string): Promise<{ topics: TopicApi[] }> {
    return apiFetch(`/api/assessments/${assessmentId}/topics`);
  },

  createTopic(
    assessmentId: string,
    data: { name: string; difficulty?: number; mastery?: number }
  ): Promise<{ topic: TopicApi }> {
    return apiFetch(`/api/assessments/${assessmentId}/topics`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Sessions
  getSessions(assessmentId: string): Promise<{ sessions: SessionApi[] }> {
    return apiFetch(`/api/assessments/${assessmentId}/sessions`);
  },

  generatePlan(assessmentId: string): Promise<{ sessions: SessionApi[] }> {
    return apiFetch(`/api/assessments/${assessmentId}/generate-plan`, {
      method: "POST",
    });
  },

  updateSessionStatus(
    sessionId: string,
    status: "PENDING" | "COMPLETED" | "MISSED"
  ): Promise<{ session: SessionApi }> {
    return apiFetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Reflections
  createReflection(
    sessionId: string,
    data: { understanding: number; notes?: string }
  ): Promise<{ reflection: ReflectionApi }> {
    return apiFetch(`/api/sessions/${sessionId}/reflection`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
