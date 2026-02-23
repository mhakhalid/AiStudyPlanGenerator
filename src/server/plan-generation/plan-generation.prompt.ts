import type { AssessmentWithTopics } from "@/server/assessments/assessment.repository";

/**
 * Builds the LLM prompt for study-plan generation.
 *
 * Embeds exact topic UUIDs so the model can reference them directly.
 * The model is instructed to return ONLY a JSON object — no prose, no markdown.
 */
export function buildPlanPrompt(assessment: AssessmentWithTopics): string {
  const today = new Date().toISOString().split("T")[0];
  const due = assessment.dueAt.toISOString().split("T")[0];

  const topicsList = assessment.topics
    .map(
      (t) =>
        `  - id: "${t.id}", name: "${t.name}", difficulty: ${t.difficulty}/10, mastery: ${t.mastery}/10`
    )
    .join("\n");

  return `You are a study-planning assistant. Generate an optimal study plan as a JSON object.

ASSESSMENT
  Title       : ${assessment.title}
  Course      : ${assessment.courseName ?? "N/A"}
  Due date    : ${due}
  Weight      : ${assessment.weightPercent != null ? `${assessment.weightPercent}%` : "N/A"}

TOPICS
${topicsList}

TODAY: ${today}

PLANNING RULES
1. Return ONLY a valid JSON object — no markdown, no code fences, no explanation.
2. Schedule sessions strictly between today (${today}) and the due date (${due}), exclusive.
3. Each session must reference a topicId exactly as listed above.
4. durationMinutes must be an integer between 15 and 480.
5. focusLevel (integer 1–10): use higher values for high-difficulty or low-mastery topics.
6. Spread sessions evenly across the available days.
7. Topics with mastery < 5 should receive proportionally more sessions than topics with mastery >= 7.
8. Aim for at least one session per topic.

REQUIRED OUTPUT FORMAT
{
  "sessions": [
    {
      "topicId": "<exact UUID from TOPICS above>",
      "date": "<ISO 8601 UTC datetime, e.g. 2024-11-01T09:00:00.000Z>",
      "durationMinutes": <integer 15–480>,
      "focusLevel": <integer 1–10>,
      "notes": "<optional short study tip>"
    }
  ]
}`;
}
