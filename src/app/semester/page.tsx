"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CornerElements from "@/components/CornerElements";
import { semesterApi } from "@/features/semester/api";
import type {
  SemesterPlanApi,
  CreateCourseInput,
  CreateAvailabilityInput,
  DayOfWeek,
} from "@/features/semester/types";

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

// ── Create Semester Plan Form ─────────────────────────────────────────────────

function CreateSemesterPlanForm({
  onCreated,
}: {
  onCreated: (plan: SemesterPlanApi) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courses, setCourses] = useState<CreateCourseInput[]>([
    { name: "", priority: 5, exams: [] },
  ]);
  const [availability, setAvailability] = useState<CreateAvailabilityInput[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addCourse() {
    setCourses((prev) => [...prev, { name: "", priority: 5, exams: [] }]);
  }

  function removeCourse(i: number) {
    setCourses((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateCourse(i: number, field: keyof CreateCourseInput, value: unknown) {
    setCourses((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );
  }

  function addExam(courseIdx: number) {
    setCourses((prev) =>
      prev.map((c, idx) =>
        idx === courseIdx
          ? { ...c, exams: [...(c.exams ?? []), { title: "", scheduledAt: "" }] }
          : c
      )
    );
  }

  function removeExam(courseIdx: number, examIdx: number) {
    setCourses((prev) =>
      prev.map((c, idx) =>
        idx === courseIdx
          ? { ...c, exams: (c.exams ?? []).filter((_, ei) => ei !== examIdx) }
          : c
      )
    );
  }

  function updateExam(
    courseIdx: number,
    examIdx: number,
    field: string,
    value: unknown
  ) {
    setCourses((prev) =>
      prev.map((c, idx) =>
        idx === courseIdx
          ? {
              ...c,
              exams: (c.exams ?? []).map((e, ei) =>
                ei === examIdx ? { ...e, [field]: value } : e
              ),
            }
          : c
      )
    );
  }

  function toggleDay(day: DayOfWeek) {
    setAvailability((prev) => {
      const existing = prev.find((a) => a.dayOfWeek === day);
      if (existing) return prev.filter((a) => a.dayOfWeek !== day);
      return [...prev, { dayOfWeek: day, startHour: 9, endHour: 17 }];
    });
  }

  function updateAvailHours(
    day: DayOfWeek,
    field: "startHour" | "endHour",
    value: number
  ) {
    setAvailability((prev) =>
      prev.map((a) => (a.dayOfWeek === day ? { ...a, [field]: value } : a))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const validCourses = courses.filter((c) => c.name.trim());
      if (validCourses.length === 0) {
        setError("At least one course with a name is required.");
        return;
      }
      if (availability.length === 0) {
        setError("Select at least one availability day.");
        return;
      }
      const { plan } = await semesterApi.createPlan({
        name: name.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        courses: validCourses.map((c) => ({
          ...c,
          exams: (c.exams ?? []).filter(
            (e) => e.title.trim() && e.scheduledAt
          ),
        })),
        availability,
      });
      onCreated(plan);
      setOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setCourses([{ name: "", priority: 5, exams: [] }]);
      setAvailability([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create semester plan"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="font-mono">
        + NEW SEMESTER PLAN
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative border border-border p-4 space-y-5 bg-card/80"
    >
      <CornerElements />
      <h3 className="font-mono text-sm text-primary">NEW SEMESTER PLAN</h3>

      {/* Plan basics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1 sm:col-span-3">
          <label className="text-xs font-mono text-muted-foreground">
            PLAN NAME *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fall 2025"
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">
            START DATE *
          </label>
          <input
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">
            END DATE *
          </label>
          <input
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Courses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            COURSES *
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addCourse}
            className="font-mono text-xs h-6 px-2"
          >
            + ADD COURSE
          </Button>
        </div>
        {courses.map((course, ci) => (
          <div
            key={ci}
            className="border border-border/50 p-3 space-y-2 bg-background/40"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-mono text-muted-foreground">
                  COURSE NAME *
                </label>
                <input
                  value={course.name}
                  onChange={(e) => updateCourse(ci, "name", e.target.value)}
                  placeholder="e.g. Calculus II"
                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-mono text-muted-foreground">
                  PRIORITY (1–10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={course.priority ?? 5}
                  onChange={(e) =>
                    updateCourse(ci, "priority", Number(e.target.value))
                  }
                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Exams */}
            <div className="space-y-1 pl-2 border-l border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground/70">
                  EXAMS
                </span>
                <button
                  type="button"
                  onClick={() => addExam(ci)}
                  className="text-xs text-primary hover:underline font-mono"
                >
                  + exam
                </button>
              </div>
              {(course.exams ?? []).map((exam, ei) => (
                <div key={ei} className="grid grid-cols-2 gap-2 items-end">
                  <input
                    value={exam.title}
                    onChange={(e) =>
                      updateExam(ci, ei, "title", e.target.value)
                    }
                    placeholder="Exam title"
                    className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-1 items-center">
                    <input
                      type="date"
                      value={exam.scheduledAt}
                      onChange={(e) =>
                        updateExam(ci, ei, "scheduledAt", e.target.value)
                      }
                      className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => removeExam(ci, ei)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {courses.length > 1 && (
              <button
                type="button"
                onClick={() => removeCourse(ci)}
                className="text-xs text-muted-foreground hover:text-destructive font-mono"
              >
                REMOVE COURSE
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <span className="text-xs font-mono text-muted-foreground">
          WEEKLY AVAILABILITY *
        </span>
        <div className="space-y-2">
          {ALL_DAYS.map((day) => {
            const slot = availability.find((a) => a.dayOfWeek === day);
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-28 text-xs font-mono px-2 py-1 border rounded transition-colors ${
                    slot
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
                {slot && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={slot.startHour}
                      onChange={(e) =>
                        updateAvailHours(day, "startHour", Number(e.target.value))
                      }
                      className="w-12 bg-background border border-border rounded px-1 py-0.5 text-center text-foreground focus:outline-none focus:border-primary"
                    />
                    <span>:00 –</span>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={slot.endHour}
                      onChange={(e) =>
                        updateAvailHours(day, "endHour", Number(e.target.value))
                      }
                      className="w-12 bg-background border border-border rounded px-1 py-0.5 text-center text-foreground focus:outline-none focus:border-primary"
                    />
                    <span>:00</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs text-destructive font-mono">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
          className="font-mono text-xs"
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={loading}
          className="font-mono text-xs"
        >
          {loading ? "CREATING..." : "CREATE"}
        </Button>
      </div>
    </form>
  );
}

// ── Main semester list page ───────────────────────────────────────────────────

export default function SemesterPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SemesterPlanApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    semesterApi
      .listPlans()
      .then(({ plans }) => setPlans(plans))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load semester plans"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(plan: SemesterPlanApi) {
    router.push(`/semester/${plan.id}`);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">
            <span className="text-primary">Semester</span>{" "}
            <span className="text-foreground">Planner</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-generated study schedules across an entire semester.
          </p>
        </div>
      </div>

      <CreateSemesterPlanForm onCreated={handleCreated} />

      {loading && (
        <p className="text-sm text-muted-foreground font-mono">LOADING...</p>
      )}
      {error && <p className="text-sm text-destructive font-mono">{error}</p>}

      {!loading && !error && plans.length === 0 && (
        <div className="relative border border-border p-6 text-center">
          <CornerElements />
          <p className="text-muted-foreground text-sm">
            No semester plans yet. Create one above to get started.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {plans.map((p) => {
          const start = new Date(p.startDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const end = new Date(p.endDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <div
              key={p.id}
              className="relative border border-border p-4 bg-card/80 flex items-center justify-between gap-4"
            >
              <CornerElements />
              <div className="space-y-0.5 min-w-0">
                <p className="font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {start} → {end}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="font-mono text-xs shrink-0"
              >
                <Link href={`/semester/${p.id}`}>OPEN →</Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
