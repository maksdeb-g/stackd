"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Clock, ChevronRight, Layers } from "lucide-react";
import { getSubtopics, getSearchHistory, getSuggestions } from "@/lib/api";
import type { SearchHistoryItem } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [subtopicError, setSubtopicError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const loadHistory = useCallback(async () => {
    try {
      const h = await getSearchHistory();
      setHistory(h.slice(0, 8));
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getSuggestions(query);
        setSuggestions(res);
        setShowSuggestions(res.length > 0);
        setSelectedIdx(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(q?: string) {
    const term = (q ?? query).trim();
    if (!term) return;
    setShowSuggestions(false);
    router.push(`/results?q=${encodeURIComponent(term)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && selectedIdx >= 0 && selectedIdx < suggestions.length) {
        handleSearch(suggestions[selectedIdx]);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIdx(-1);
      inputRef.current?.blur();
    }
  }

  async function handleSubtopics() {
    if (!query.trim()) return;
    setLoadingSubtopics(true);
    setSubtopicError("");
    setSubtopics([]);
    try {
      const res = await getSubtopics(query);
      setSubtopics(res.subtopics);
    } catch (e: unknown) {
      setSubtopicError(e instanceof Error ? e.message : "Failed to get subtopics");
    } finally {
      setLoadingSubtopics(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="mb-12 text-center fade-up">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-yellow shadow-lg shadow-accent-yellow/20">
            <Layers className="h-8 w-8 text-ink" />
          </div>
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight text-cream sm:text-6xl">
          Study<span className="text-accent-yellow">Buddy</span>
        </h1>
        <p className="mt-3 text-lg text-cream/50 font-light">
          One search. Every resource. YouTube · Books · Wikipedia.
        </p>
      </div>

      {/* Search box */}
      <div ref={containerRef} className="w-full max-w-2xl fade-up delay-1 relative">
        <div className="relative flex items-center rounded-2xl border border-ink-muted bg-ink-soft shadow-xl">
          <Search className="absolute left-4 h-5 w-5 text-cream/30" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to learn today?"
            className="flex-1 bg-transparent py-4 pl-12 pr-4 text-base text-cream placeholder-cream/30 outline-none font-body"
          />
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim()}
            className="m-2 flex items-center gap-2 rounded-xl bg-accent-yellow px-5 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-accent-yellow/90 disabled:opacity-40"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-ink-muted bg-ink shadow-2xl overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={s}
                onMouseDown={() => handleSearch(s)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === selectedIdx
                    ? "bg-accent-yellow/20 text-accent-yellow"
                    : "text-cream hover:bg-ink-muted"
                }`}
              >
                <Search className="h-3.5 w-3.5 flex-shrink-0 text-cream/50" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}

        {/* Subtopic button */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleSubtopics}
            disabled={!query.trim() || loadingSubtopics}
            className="flex items-center gap-2 rounded-xl border border-ink-muted bg-ink-soft px-5 py-2.5 text-sm text-cream/60 hover:border-accent-violet/50 hover:text-accent-violet transition-all disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {loadingSubtopics ? "Generating…" : "Get AI Subtopics"}
          </button>
        </div>
      </div>

      {/* Subtopics */}
      {subtopics.length > 0 && (
        <div className="mt-8 w-full max-w-2xl fade-up">
          <p className="mb-3 text-xs font-mono text-cream/30 uppercase tracking-widest">AI Suggested Subtopics</p>
          <div className="flex flex-wrap gap-2">
            {subtopics.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSearch(s)}
                className="rounded-full border border-accent-violet/30 bg-accent-violet/10 px-4 py-1.5 text-sm text-accent-violet hover:bg-accent-violet/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {subtopicError && <p className="mt-4 text-sm text-accent-coral fade-up">{subtopicError}</p>}

      {/* Search history */}
      {history.length > 0 && (
        <div className="mt-12 w-full max-w-2xl fade-up delay-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-3.5 w-3.5 text-cream/30" />
            <p className="text-xs font-mono text-cream/30 uppercase tracking-widest">Recent Searches</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => handleSearch(h.query)}
                className="group flex items-center justify-between rounded-lg border border-ink-muted bg-ink-soft px-3 py-2 text-left text-sm text-cream/60 hover:border-ink-muted/80 hover:text-cream transition-all"
              >
                <span className="truncate">{h.query}</span>
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
