"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import CornerElements from "@/components/CornerElements";
import { semesterApi } from "@/features/semester/api";
import type {
  SemesterPlanDetailApi,
  SemesterSessionApi,
} from "@/features/semester/types";

type Tab = "courses" | "schedule" | "sessions";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "text-muted-foreground border-border",
    COMPLETED: "text-green-500 border-green-500/30",
    MISSED: "text-destructive border-destructive/30",
  };
  return (
    <span
      className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${colors[status] ?? colors.PENDING}`}
    >
      {status}
    </span>
  );
}

export default function SemesterPlanDetailPage({
  params,
}: {
  params: Promise<{ semesterPlanId: string }>;
}) {
  const { semesterPlanId } = use(params);
  const [plan, setPlan] = useState<SemesterPlanDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("courses");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    semesterApi
      .getPlan(semesterPlanId)
      .then(({ plan }) => setPlan(plan))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load plan")
      )
      .finally(() => setLoading(false));
  }, [semesterPlanId]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const { sessions } = await semesterApi.generateSessions(semesterPlanId);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              sessions: sessions as SemesterSessionApi[],
            }
          : prev
      );
      setActiveTab("sessions");
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Failed to generate sessions"
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-sm text-muted-foreground font-mono">LOADING...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-sm text-destructive font-mono">
          {error ?? "Plan not found."}
        </p>
      </div>
    );
  }

  const start = new Date(plan.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const end = new Date(plan.endDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "courses", label: `COURSES (${plan.courses.length})` },
    { key: "schedule", label: `SCHEDULE (${plan.availability.length})` },
    { key: "sessions", label: `SESSIONS (${plan.sessions.length})` },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
      {/* Header */}
      <div className="relative border border-border p-4 bg-card/80 space-y-1">
        <CornerElements />
        <h1 className="text-xl font-bold font-mono text-foreground">
          {plan.name}
        </h1>
        <p className="text-xs text-muted-foreground font-mono">
          {start} → {end}
        </p>
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="font-mono"
        >
          {generating ? "GENERATING..." : "⚡ GENERATE STUDY PLAN"}
        </Button>
        {plan.sessions.length > 0 && !generating && (
          <span className="text-xs text-muted-foreground font-mono">
            Re-generating will replace existing sessions.
          </span>
        )}
      </div>
      {generateError && (
        <p className="text-xs text-destructive font-mono">{generateError}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-xs font-mono transition-colors ${
              activeTab === t.key
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Courses tab */}
      {activeTab === "courses" && (
        <div className="space-y-3">
          {plan.courses.length === 0 && (
            <p className="text-sm text-muted-foreground">No courses added.</p>
          )}
          {plan.courses.map((course) => (
            <div
              key={course.id}
              className="relative border border-border p-4 bg-card/80 space-y-2"
            >
              <CornerElements />
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{course.name}</p>
                <div className="flex gap-2 text-xs font-mono text-muted-foreground">
                  {course.creditHours != null && (
                    <span>{course.creditHours} cr</span>
                  )}
                  <span className="text-primary">P:{course.priority}/10</span>
                </div>
              </div>
              {course.exams.length > 0 && (
                <div className="space-y-1 pl-3 border-l border-border/50">
                  <p className="text-xs font-mono text-muted-foreground">
                    EXAMS
                  </p>
                  {course.exams.map((exam) => {
                    const examDate = new Date(
                      exam.scheduledAt
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    return (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground">{exam.title}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {examDate}
                          {exam.weightPercent != null &&
                            ` · ${exam.weightPercent}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule tab */}
      {activeTab === "schedule" && (
        <div className="space-y-2">
          {plan.availability.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No availability slots set.
            </p>
          )}
          {plan.availability.map((slot) => (
            <div
              key={slot.id}
              className="relative border border-border p-3 bg-card/80 flex items-center justify-between"
            >
              <CornerElements />
              <span className="font-mono text-sm text-foreground">
                {slot.dayOfWeek}
              </span>
              <span className="font-mono text-sm text-primary">
                {String(slot.startHour).padStart(2, "0")}:00 –{" "}
                {String(slot.endHour).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sessions tab */}
      {activeTab === "sessions" && (
        <div className="space-y-2">
          {plan.sessions.length === 0 && (
            <div className="relative border border-border p-6 text-center">
              <CornerElements />
              <p className="text-muted-foreground text-sm">
                No sessions yet. Click{" "}
                <span className="text-primary font-mono">
                  GENERATE STUDY PLAN
                </span>{" "}
                above to create your schedule.
              </p>
            </div>
          )}
          {plan.sessions.map((session) => {
            const date = new Date(session.scheduledAt).toLocaleDateString(
              "en-GB",
              {
                weekday: "short",
                day: "numeric",
                month: "short",
              }
            );
            const time = new Date(session.scheduledAt).toLocaleTimeString(
              "en-GB",
              { hour: "2-digit", minute: "2-digit" }
            );
            return (
              <div
                key={session.id}
                className="relative border border-border p-3 bg-card/80 flex items-center justify-between gap-3"
              >
                <CornerElements />
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {session.semesterCourse.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {date} at {time} · {session.durationMinutes} min
                  </p>
                </div>
                <StatusBadge status={session.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
