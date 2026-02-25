import type {
  SemesterPlanApi,
  SemesterPlanDetailApi,
  SemesterSessionApi,
  CreateSemesterPlanInput,
} from "./types";

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

export const semesterApi = {
  listPlans(): Promise<{ plans: SemesterPlanApi[] }> {
    return apiFetch("/api/semester-plans");
  },

  createPlan(
    data: CreateSemesterPlanInput
  ): Promise<{ plan: SemesterPlanApi }> {
    return apiFetch("/api/semester-plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPlan(id: string): Promise<{ plan: SemesterPlanDetailApi }> {
    return apiFetch(`/api/semester-plans/${id}`);
  },

  generateSessions(
    id: string
  ): Promise<{ sessions: SemesterSessionApi[] }> {
    return apiFetch(`/api/semester-plans/${id}/generate`, {
      method: "POST",
    });
  },
};
