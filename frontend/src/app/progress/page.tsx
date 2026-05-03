"use client";
import { useState, useEffect, useCallback } from "react";
import { BookmarkCheck, PlayCircle, CheckCircle2, ExternalLink, Trash2, Youtube, BookOpen, Globe, BarChart3 } from "lucide-react";
import { getAllProgress, updateProgress, deleteResource } from "@/lib/api";
import type { Resource, ProgressStatus } from "@/types";
import clsx from "clsx";

const COLUMNS: { status: ProgressStatus; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { status: "WANT_TO_LEARN", label: "Want to Learn", icon: BookmarkCheck, color: "text-accent-yellow", bg: "bg-accent-yellow/10 border-accent-yellow/20" },
  { status: "IN_PROGRESS",   label: "In Progress",   icon: PlayCircle,    color: "text-accent-teal",   bg: "bg-accent-teal/10 border-accent-teal/20" },
  { status: "DONE",          label: "Done",          icon: CheckCircle2,  color: "text-green-400",      bg: "bg-green-400/10 border-green-400/20" },
];

const SOURCE_ICON = { youtube: Youtube, book: BookOpen, wikipedia: Globe };

export default function ProgressPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await getAllProgress();
      setResources(r);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatus(resourceId: string, status: ProgressStatus) {
    await updateProgress(resourceId, status);
    setResources((rs) => rs.map((r) => r.id === resourceId ? { ...r, status } : r));
  }

  async function handleDelete(resourceId: string) {
    await deleteResource(resourceId);
    setResources((rs) => rs.filter((r) => r.id !== resourceId));
  }

  const byStatus = (status: ProgressStatus) => resources.filter((r) => r.status === status);
  const total = resources.length;
  const done = byStatus("DONE").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 fade-up">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-6 w-6 text-accent-yellow" />
          <h1 className="font-display text-3xl font-bold text-cream">Learning Progress</h1>
        </div>
        <p className="text-sm text-cream/40 mt-1">Track what you're learning across all folders</p>
      </div>

      {/* Stats bar */}
      {!loading && total > 0 && (
        <div className="mb-10 rounded-2xl border border-ink-muted bg-ink-soft p-6 fade-up delay-1">
          <div className="flex flex-wrap items-center gap-8 mb-5">
            <div>
              <p className="text-xs font-mono text-cream/30 uppercase tracking-widest">Total</p>
              <p className="font-display text-3xl font-bold text-cream">{total}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-cream/30 uppercase tracking-widest">Completed</p>
              <p className="font-display text-3xl font-bold text-green-400">{done}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-cream/30 uppercase tracking-widest">In Progress</p>
              <p className="font-display text-3xl font-bold text-accent-teal">{byStatus("IN_PROGRESS").length}</p>
            </div>
            <div className="flex-1 min-w-48">
              <div className="flex justify-between text-xs text-cream/40 mb-2">
                <span>Overall completion</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-ink-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-yellow transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.status} className="space-y-3">
              <div className="skeleton h-8 w-32 rounded-lg" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="flex flex-col items-center py-24 text-cream/30">
          <BarChart3 className="mb-3 h-12 w-12" />
          <p className="font-display text-lg">Nothing tracked yet</p>
          <p className="text-sm mt-1">Save resources to folders and track your progress here</p>
        </div>
      )}

      {/* Kanban columns */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 fade-up delay-2">
          {COLUMNS.map(({ status, label, icon: Icon, color, bg }) => {
            const items = byStatus(status);
            const next = COLUMNS.find((c) => c.status !== status);
            return (
              <div key={status}>
                {/* Column header */}
                <div className={clsx("mb-4 flex items-center gap-2 rounded-xl border px-4 py-3", bg)}>
                  <Icon className={clsx("h-4 w-4", color)} />
                  <h2 className={clsx("font-display text-sm font-semibold", color)}>{label}</h2>
                  <span className="ml-auto text-xs font-mono text-cream/40">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-24">
                  {items.length === 0 && (
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-ink-muted h-20 text-cream/20 text-sm">
                      Empty
                    </div>
                  )}
                  {items.map((r, i) => {
                    const SrcIcon = SOURCE_ICON[r.source as keyof typeof SOURCE_ICON] ?? Globe;
                    const nextStatuses = COLUMNS.filter((c) => c.status !== status);
                    return (
                      <div
                        key={r.id}
                        style={{ animationDelay: `${i * 0.04}s` }}
                        className="fade-up group rounded-xl border border-ink-muted bg-ink-soft p-4 hover:border-ink-muted/60 transition-all"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <SrcIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cream/30" />
                          <p className="font-medium text-sm text-cream line-clamp-2 leading-snug flex-1">{r.title}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {nextStatuses.map((ns) => (
                            <button
                              key={ns.status}
                              onClick={() => handleStatus(r.id!, ns.status)}
                              className={clsx(
                                "text-xs px-2.5 py-1 rounded-lg border transition-colors",
                                ns.bg, ns.color,
                                "opacity-0 group-hover:opacity-100"
                              )}
                            >
                              → {ns.label.split(" ").slice(-1)[0]}
                            </button>
                          ))}

                          <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-cream/30 hover:text-cream">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button onClick={() => handleDelete(r.id!)} className="text-cream/20 hover:text-accent-coral">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
