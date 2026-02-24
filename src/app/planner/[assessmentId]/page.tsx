"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CornerElements from "@/components/CornerElements";
import { SessionRow } from "@/features/planner/components/SessionRow";
import { plannerApi } from "@/features/planner/api";
import type { AssessmentApi, TopicApi, SessionApi } from "@/features/planner/types";

// ── Add Topic inline form ─────────────────────────────────────────────────────
function AddTopicForm({
  assessmentId,
  onAdded,
}: {
  assessmentId: string;
  onAdded: (topic: TopicApi) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [mastery, setMastery] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { topic } = await plannerApi.createTopic(assessmentId, {
        name: name.trim(),
        difficulty,
        mastery,
      });
      onAdded(topic);
      setName("");
      setDifficulty(5);
      setMastery(5);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add topic");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
      >
        + Add Topic
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-mono text-muted-foreground w-24 shrink-0">
          NAME *
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Calculus"
          className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-mono text-muted-foreground w-24 shrink-0">
          DIFFICULTY
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="font-mono text-primary text-sm w-4">{difficulty}</span>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-mono text-muted-foreground w-24 shrink-0">
          MASTERY
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={mastery}
          onChange={(e) => setMastery(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="font-mono text-primary text-sm w-4">{mastery}</span>
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
          {loading ? "ADDING..." : "ADD"}
        </Button>
      </div>
    </form>
  );
}

// ── Assessment detail page ────────────────────────────────────────────────────
export default function AssessmentDetailPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();

  const [assessment, setAssessment] = useState<AssessmentApi | null>(null);
  const [topics, setTopics] = useState<TopicApi[]>([]);
  const [sessions, setSessions] = useState<SessionApi[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Load assessment + topics + sessions in parallel
  useEffect(() => {
    if (!assessmentId) return;
    Promise.all([
      plannerApi.getAssessment(assessmentId),
      plannerApi.getTopics(assessmentId),
      plannerApi.getSessions(assessmentId),
    ])
      .then(([{ assessment }, { topics }, { sessions }]) => {
        setAssessment(assessment);
        setTopics(topics);
        setSessions(sessions);
      })
      .catch((err) =>
        setPageError(err instanceof Error ? err.message : "Failed to load page")
      )
      .finally(() => setLoadingPage(false));
  }, [assessmentId]);

  const handleGeneratePlan = useCallback(async () => {
    setGenerating(true);
    setGenError(null);
    try {
      // After generation, refetch sessions (they now have topic + reflection included)
      await plannerApi.generatePlan(assessmentId);
      const { sessions: fresh } = await plannerApi.getSessions(assessmentId);
      setSessions(fresh);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Plan generation failed");
    } finally {
      setGenerating(false);
    }
  }, [assessmentId]);

  function handleStatusChange(sessionId: string, status: SessionApi["status"]) {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status } : s))
    );
  }

  if (loadingPage) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="font-mono text-muted-foreground text-sm">LOADING...</p>
      </div>
    );
  }

  if (pageError || !assessment) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="font-mono text-destructive text-sm">
          {pageError ?? "Assessment not found"}
        </p>
        <Link href="/planner" className="text-xs text-primary hover:underline font-mono mt-2 inline-block">
          ← Back to Planner
        </Link>
      </div>
    );
  }

  const due = new Date(assessment.dueAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasSessions = sessions.length > 0;
  const hasTopics = topics.length > 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      {/* Back link */}
      <Link
        href="/planner"
        className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
      >
        ← PLANNER
      </Link>

      {/* ── Assessment info ── */}
      <div className="relative border border-border p-6 bg-card/80 space-y-2">
        <CornerElements />
        <h1 className="text-xl font-bold font-mono text-foreground">{assessment.title}</h1>
        <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
          {assessment.courseName && <span>COURSE: {assessment.courseName}</span>}
          <span>DUE: {due}</span>
          {assessment.weightPercent && <span>WEIGHT: {assessment.weightPercent}%</span>}
        </div>
      </div>

      {/* ── Topics ── */}
      <div className="relative border border-border p-6 bg-card/80 space-y-4">
        <CornerElements />
        <h2 className="font-mono text-sm font-bold">
          <span className="text-primary">TOPICS</span>
          <span className="text-muted-foreground ml-2">({topics.length})</span>
        </h2>

        {topics.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No topics yet. Add topics so the AI can build a targeted plan.
          </p>
        ) : (
          <div className="space-y-2">
            {topics.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-sm border border-border rounded px-3 py-2 bg-background/50"
              >
                <span className="text-foreground font-medium">{t.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  diff {t.difficulty}/10 · mastery {t.mastery}/10
                </span>
              </div>
            ))}
          </div>
        )}

        <AddTopicForm
          assessmentId={assessmentId}
          onAdded={(topic) => setTopics((prev) => [...prev, topic])}
        />
      </div>

      {/* ── Generate Plan ── */}
      <div className="space-y-2">
        <Button
          onClick={handleGeneratePlan}
          disabled={generating || !hasTopics}
          className="font-mono w-full sm:w-auto"
        >
          {generating
            ? "GENERATING PLAN..."
            : hasSessions
            ? "REGENERATE PLAN"
            : "GENERATE PLAN"}
        </Button>

        {!hasTopics && (
          <p className="text-xs text-muted-foreground font-mono">
            Add at least one topic before generating a plan.
          </p>
        )}

        {hasSessions && !generating && (
          <p className="text-xs text-muted-foreground font-mono">
            ⚠ Regenerating will replace all existing sessions and their reflections.
          </p>
        )}

        {genError && (
          <p className="text-xs text-destructive font-mono">{genError}</p>
        )}
      </div>

      {/* ── Sessions ── */}
      {hasSessions && (
        <div className="space-y-4">
          <h2 className="font-mono text-sm font-bold">
            <span className="text-primary">STUDY SESSIONS</span>
            <span className="text-muted-foreground ml-2">({sessions.length})</span>
          </h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {!hasSessions && !generating && hasTopics && (
        <div className="relative border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No sessions yet. Click{" "}
            <span className="text-primary font-mono">GENERATE PLAN</span> to create your
            study schedule.
          </p>
        </div>
      )}
    </div>
  );
}
