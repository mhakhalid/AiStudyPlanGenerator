export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type SessionStatus = "PENDING" | "COMPLETED" | "MISSED";

export interface SemesterPlanApi {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SemesterExamApi {
  id: string;
  semesterCourseId: string;
  title: string;
  scheduledAt: string;
  weightPercent: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SemesterCourseApi {
  id: string;
  semesterPlanId: string;
  name: string;
  creditHours: number | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
  exams: SemesterExamApi[];
}

export interface SemesterAvailabilityApi {
  id: string;
  semesterPlanId: string;
  dayOfWeek: DayOfWeek;
  startHour: number;
  endHour: number;
  createdAt: string;
}

export interface SemesterSessionApi {
  id: string;
  semesterPlanId: string;
  semesterCourseId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  semesterCourse: {
    id: string;
    name: string;
  };
}

export interface SemesterPlanDetailApi extends SemesterPlanApi {
  courses: SemesterCourseApi[];
  availability: SemesterAvailabilityApi[];
  sessions: SemesterSessionApi[];
}

// ── Form input types ──────────────────────────────────────────────────────────

export interface CreateExamInput {
  title: string;
  scheduledAt: string;
  weightPercent?: number;
}

export interface CreateCourseInput {
  name: string;
  creditHours?: number;
  priority?: number;
  exams?: CreateExamInput[];
}

export interface CreateAvailabilityInput {
  dayOfWeek: DayOfWeek;
  startHour: number;
  endHour: number;
}

export interface CreateSemesterPlanInput {
  name: string;
  startDate: string;
  endDate: string;
  courses: CreateCourseInput[];
  availability: CreateAvailabilityInput[];
}
