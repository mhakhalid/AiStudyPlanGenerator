"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { plannerApi } from "../api";
import { ReflectionForm } from "./ReflectionForm";
import type { SessionApi } from "../types";

interface SessionRowProps {
  session: SessionApi;
  onStatusChange: (sessionId: string, status: SessionApi["status"]) => void;
}

const STATUS_STYLES: Record<SessionApi["status"], string> = {
  PENDING: "text-muted-foreground border-border",
  COMPLETED: "text-green-500 border-green-500/50",
  MISSED: "text-destructive border-destructive/50",
};

const STATUS_LABELS: Record<SessionApi["status"], string> = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  MISSED: "MISSED",
};

export function SessionRow({ session, onStatusChange }: SessionRowProps) {
  const [reflection, setReflection] = useState(session.reflection);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = new Date(session.scheduledAt);
  const dateLabel = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleStatusChange(newStatus: SessionApi["status"]) {
    if (newStatus === session.status || updatingStatus) return;
    setUpdatingStatus(true);
    setError(null);
    try {
      await plannerApi.updateSessionStatus(session.id, newStatus);
      onStatusChange(session.id, newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="border border-border rounded p-4 bg-background/50 space-y-3">
      {/* ── Top row: date / topic / duration ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-mono text-xs text-muted-foreground">{dateLabel}</span>
        <span className="font-mono text-xs text-muted-foreground">{timeLabel}</span>

        {session.topic && (
          <span className="text-sm font-semibold text-foreground">
            {session.topic.name}
          </span>
        )}

        <span className="font-mono text-xs text-muted-foreground ml-auto">
          {session.durationMinutes} min
        </span>
      </div>

      {/* ── Status buttons ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-mono mr-1">STATUS:</span>
        {(["PENDING", "COMPLETED", "MISSED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            disabled={updatingStatus}
            className={`px-2 py-0.5 text-xs font-mono border rounded transition-colors
              ${
                session.status === s
                  ? STATUS_STYLES[s] + " bg-primary/10"
                  : "text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }
              disabled:opacity-50`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-destructive font-mono">{error}</p>}

      {/* ── Reflection ── */}
      {reflection ? (
        <div className="border-t border-border pt-3 text-xs text-muted-foreground font-mono space-y-1">
          <span className="text-primary">REFLECTION</span>
          <div>
            Understanding:{" "}
            <span className="text-foreground">{reflection.understanding}/10</span>
          </div>
          {reflection.notes && (
            <div>
              Notes: <span className="text-foreground">{reflection.notes}</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {!showReflectionForm && (
            <button
              onClick={() => setShowReflectionForm(true)}
              className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              + Add Reflection
            </button>
          )}
          {showReflectionForm && (
            <ReflectionForm
              sessionId={session.id}
              onSaved={(saved) => {
                setReflection({
                  id: "",
                  sessionId: session.id,
                  understanding: saved.understanding,
                  notes: saved.notes,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setShowReflectionForm(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
