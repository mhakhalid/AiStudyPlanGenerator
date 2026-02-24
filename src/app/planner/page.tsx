"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CornerElements from "@/components/CornerElements";
import { plannerApi } from "@/features/planner/api";
import type { AssessmentApi } from "@/features/planner/types";

// ── Create Assessment inline form ─────────────────────────────────────────────
function CreateAssessmentForm({ onCreated }: { onCreated: (a: AssessmentApi) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [weightPercent, setWeightPercent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { assessment } = await plannerApi.createAssessment({
        title: title.trim(),
        courseName: courseName.trim() || undefined,
        dueAt: new Date(dueAt).toISOString(),
        weightPercent: weightPercent ? Number(weightPercent) : undefined,
      });
      onCreated(assessment);
      setTitle("");
      setCourseName("");
      setDueAt("");
      setWeightPercent("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="font-mono">
        + NEW ASSESSMENT
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative border border-border p-4 space-y-3 bg-card/80"
    >
      <CornerElements />
      <h3 className="font-mono text-sm text-primary">NEW ASSESSMENT</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">TITLE *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Final Exam"
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">COURSE</label>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">DUE DATE *</label>
          <input
            required
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-mono text-muted-foreground">WEIGHT %</label>
          <input
            type="number"
            min={1}
            max={100}
            value={weightPercent}
            onChange={(e) => setWeightPercent(e.target.value)}
            placeholder="e.g. 40"
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
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
        <Button type="submit" size="sm" disabled={loading} className="font-mono text-xs">
          {loading ? "CREATING..." : "CREATE"}
        </Button>
      </div>
    </form>
  );
}

// ── Main planner list page ────────────────────────────────────────────────────
export default function PlannerPage() {
  const [assessments, setAssessments] = useState<AssessmentApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    plannerApi
      .getAssessments()
      .then(({ assessments }) => setAssessments(assessments))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load assessments")
      )
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(assessment: AssessmentApi) {
    setAssessments((prev) => [...prev, assessment]);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">
            <span className="text-primary">Study</span>{" "}
            <span className="text-foreground">Planner</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your assessments and AI-generated study plans.
          </p>
        </div>
      </div>

      {/* Create form */}
      <CreateAssessmentForm onCreated={handleCreated} />

      {/* List */}
      {loading && (
        <p className="text-sm text-muted-foreground font-mono">LOADING...</p>
      )}
      {error && <p className="text-sm text-destructive font-mono">{error}</p>}

      {!loading && !error && assessments.length === 0 && (
        <div className="relative border border-border p-6 text-center">
          <CornerElements />
          <p className="text-muted-foreground text-sm">
            No assessments yet. Create one above to get started.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {assessments.map((a) => {
          const due = new Date(a.dueAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <div
              key={a.id}
              className="relative border border-border p-4 bg-card/80 flex items-center justify-between gap-4"
            >
              <CornerElements />
              <div className="space-y-0.5 min-w-0">
                <p className="font-semibold text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {a.courseName && `${a.courseName} · `}Due {due}
                  {a.weightPercent && ` · ${a.weightPercent}%`}
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="font-mono text-xs shrink-0">
                <Link href={`/planner/${a.id}`}>OPEN →</Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
