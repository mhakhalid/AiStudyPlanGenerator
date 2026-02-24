"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { plannerApi } from "../api";

interface ReflectionFormProps {
  sessionId: string;
  onSaved: (reflection: { understanding: number; notes: string | null }) => void;
}

export function ReflectionForm({ sessionId, onSaved }: ReflectionFormProps) {
  const [understanding, setUnderstanding] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { reflection } = await plannerApi.createReflection(sessionId, {
        understanding,
        notes: notes.trim() || undefined,
      });
      onSaved({ understanding: reflection.understanding, notes: reflection.notes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reflection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-mono text-muted-foreground w-32 shrink-0">
          UNDERSTANDING
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={understanding}
          onChange={(e) => setUnderstanding(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="font-mono text-primary text-sm w-6 text-right">
          {understanding}
        </span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>

      <div className="flex items-start gap-3">
        <label className="text-xs font-mono text-muted-foreground w-32 shrink-0 pt-1">
          NOTES
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional study notes..."
          rows={2}
          className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
        />
      </div>

      {error && <p className="text-xs text-destructive font-mono">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={loading} className="font-mono text-xs">
          {loading ? "SAVING..." : "SAVE REFLECTION"}
        </Button>
      </div>
    </form>
  );
}
