"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Youtube, BookOpen, Globe, AlertCircle } from "lucide-react";
import { searchResources, getFolders } from "@/lib/api";
import type { Resource, Folder, Source, Difficulty } from "@/types";
import ResourceCard from "@/components/ResourceCard";
import clsx from "clsx";

const SOURCES: { value: Source | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: SlidersHorizontal },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "book", label: "Books", icon: BookOpen },
  { value: "wikipedia", label: "Wikipedia", icon: Globe },
];

const DIFFICULTIES: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function ResultsContent() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "all">("all");

  const load = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    try {
      const [results, fols] = await Promise.all([searchResources(query), getFolders()]);
      setResources(results);
      setFolders(fols);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const filtered = resources.filter((r) => {
    const srcOk = sourceFilter === "all" || r.source === sourceFilter;
    const diffOk = diffFilter === "all" || r.difficulty === diffFilter;
    return srcOk && diffOk;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 fade-up">
        <div className="flex items-center gap-3 mb-1">
          <Search className="h-5 w-5 text-accent-yellow" />
          <h1 className="font-display text-2xl font-bold text-cream">
            Results for <span className="text-accent-yellow">"{query}"</span>
          </h1>
        </div>
        {!loading && (
          <p className="text-sm text-cream/40">
            {filtered.length} resource{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-6 fade-up delay-1">
        {/* Source filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-cream/30 uppercase tracking-widest">Source</span>
          {SOURCES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSourceFilter(value as Source | "all")}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                sourceFilter === value
                  ? "bg-accent-yellow text-ink"
                  : "border border-ink-muted text-cream/50 hover:text-cream hover:border-cream/20"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-cream/30 uppercase tracking-widest">Level</span>
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDiffFilter(value as Difficulty | "all")}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                diffFilter === value
                  ? "bg-accent-teal/20 text-accent-teal border border-accent-teal/30"
                  : "border border-ink-muted text-cream/50 hover:text-cream hover:border-cream/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-accent-coral/30 bg-accent-coral/10 p-4 text-accent-coral">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-ink-muted overflow-hidden">
              <div className="skeleton h-40 w-full" />
              <div className="p-4 space-y-3">
                <div className="skeleton h-3 w-16 rounded-full" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-cream/30">
          <Search className="mb-3 h-10 w-10" />
          <p className="font-display text-lg">No results match your filters</p>
          <p className="text-sm mt-1">Try removing some filters</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r, i) => (
            <ResourceCard
              key={`${r.link}-${i}`}
              resource={r}
              folders={folders}
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24 text-cream/30">Loading…</div>}>
      <ResultsContent />
    </Suspense>
  );
}
