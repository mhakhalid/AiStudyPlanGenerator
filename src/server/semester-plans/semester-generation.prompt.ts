import type { SemesterPlanWithRelations } from "./semester-plan.repository";

/**
 * Builds the LLM prompt for semester-plan generation.
 * Embeds exact course UUIDs so the model can reference them directly.
 * The model is instructed to return ONLY a JSON object — no prose, no markdown.
 */
export function buildSemesterPrompt(plan: SemesterPlanWithRelations): string {
  const today = new Date().toISOString().split("T")[0];
  const start = plan.startDate.toISOString().split("T")[0];
  const end = plan.endDate.toISOString().split("T")[0];

  const coursesList = plan.courses
    .map((c) => {
      const examLines =
        c.exams.length > 0
          ? c.exams
              .map(
                (e) =>
                  `      * "${e.title}" on ${e.scheduledAt.toISOString().split("T")[0]}${e.weightPercent != null ? ` (${e.weightPercent}% weight)` : ""}`
              )
              .join("\n")
          : "      * No exams";
      return `  - id: "${c.id}", name: "${c.name}", creditHours: ${c.creditHours ?? "N/A"}, priority: ${c.priority}/10\n    Exams:\n${examLines}`;
    })
    .join("\n");

  const availabilityList = plan.availability
    .map(
      (a) =>
        `  - ${a.dayOfWeek}: ${String(a.startHour).padStart(2, "0")}:00–${String(a.endHour).padStart(2, "0")}:00`
    )
    .join("\n");

  return `You are a semester study-planning assistant. Generate an optimal semester-wide study schedule as a JSON object.

SEMESTER PLAN: ${plan.name}
  Start date  : ${start}
  End date    : ${end}
  Today       : ${today}

COURSES
${coursesList}

WEEKLY AVAILABILITY (study windows)
${availabilityList}

PLANNING RULES
1. Return ONLY a valid JSON object — no markdown, no code fences, no explanation.
2. Schedule sessions only within the semester (${start} to ${end}), strictly during the listed availability windows.
3. Each session must reference a semesterCourseId exactly as listed above.
4. durationMinutes must be an integer between 15 and 480.
5. Distribute sessions across the full semester — do not cluster all sessions at the start or end.
6. Weight study time toward courses with higher priority and courses that have exams coming up soon.
7. Ensure there are more sessions in the weeks immediately before each exam.
8. Aim for at least 2 sessions per course per week during peak exam periods.

REQUIRED OUTPUT FORMAT
{
  "sessions": [
    {
      "semesterCourseId": "<exact UUID from COURSES above>",
      "date": "<ISO 8601 UTC datetime, e.g. 2025-09-15T09:00:00.000Z>",
      "durationMinutes": <integer 15–480>,
      "notes": "<optional short study tip>"
    }
  ]
}`;
}
