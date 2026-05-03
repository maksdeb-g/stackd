"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, FolderOpen, Trash2, ChevronRight, X, BookmarkCheck, Youtube, BookOpen, Globe, ExternalLink } from "lucide-react";
import { getFolders, createFolder, deleteFolder, getResourcesInFolder, deleteResource, updateProgress } from "@/lib/api";
import type { Folder, Resource, ProgressStatus } from "@/types";
import clsx from "clsx";

const FOLDER_COLORS = ["#f5d547", "#2dd4bf", "#ff6b6b", "#8b5cf6", "#34d399", "#fb923c", "#60a5fa", "#f472b6"];

const STATUS_OPTIONS: { value: ProgressStatus; label: string }[] = [
  { value: "WANT_TO_LEARN", label: "Want to Learn" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

const SOURCE_ICON = {
  youtube: Youtube,
  book: BookOpen,
  wikipedia: Globe,
};

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Folder | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      const f = await getFolders();
      setFolders(f);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  async function loadResources(folder: Folder) {
    setSelected(folder);
    setLoadingResources(true);
    try {
      const r = await getResourcesInFolder(folder.id);
      setResources(r);
    } catch { setResources([]); }
    setLoadingResources(false);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createFolder(newName.trim(), newColor);
      setNewName("");
      setShowCreate(false);
      loadFolders();
    } catch { /* */ }
    setCreating(false);
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Delete this folder and all its resources?")) return;
    await deleteFolder(id);
    if (selected?.id === id) setSelected(null);
    loadFolders();
  }

  async function handleDeleteResource(id: string) {
    await deleteResource(id!);
    setResources((r) => r.filter((x) => x.id !== id));
  }

  async function handleStatus(resourceId: string, status: ProgressStatus) {
    await updateProgress(resourceId, status);
    setResources((rs) => rs.map((r) => r.id === resourceId ? { ...r, status } : r));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">My Folders</h1>
          <p className="text-sm text-cream/40 mt-1">Organise your saved resources</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-xl bg-accent-yellow px-4 py-2.5 text-sm font-semibold text-ink hover:bg-accent-yellow/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Folder
        </button>
      </div>

      {/* Create folder panel */}
      {showCreate && (
        <div className="mb-8 rounded-2xl border border-ink-muted bg-ink-soft p-6 fade-up">
          <h2 className="font-display text-lg font-semibold mb-4 text-cream">Create Folder</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-cream/40 mb-1.5 block font-mono uppercase tracking-widest">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Machine Learning"
                className="w-full rounded-lg border border-ink-muted bg-ink px-4 py-2.5 text-sm text-cream placeholder-cream/30 outline-none focus:border-accent-yellow/50"
              />
            </div>
            <div>
              <label className="text-xs text-cream/40 mb-1.5 block font-mono uppercase tracking-widest">Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: newColor === c ? "white" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-ink-muted px-4 py-2.5 text-sm text-cream/50 hover:text-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="rounded-lg bg-accent-yellow px-4 py-2.5 text-sm font-semibold text-ink hover:bg-accent-yellow/90 disabled:opacity-40 transition-all"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && folders.length === 0 && (
        <div className="flex flex-col items-center py-24 text-cream/30">
          <FolderOpen className="mb-3 h-12 w-12" />
          <p className="font-display text-lg">No folders yet</p>
          <p className="text-sm mt-1">Create your first folder to start saving resources</p>
        </div>
      )}

      {/* Folder grid + detail panel side by side */}
      {folders.length > 0 && (
        <div className="flex gap-6">
          {/* Folder grid */}
          <div className={clsx("grid content-start gap-4 fade-up", selected ? "hidden sm:grid sm:w-64 grid-cols-1" : "flex-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
            {folders.map((f, i) => (
              <div
                key={f.id}
                onClick={() => loadResources(f)}
                style={{ animationDelay: `${i * 0.04}s` }}
                className={clsx(
                  "fade-up group relative cursor-pointer rounded-xl border p-5 transition-all hover:border-cream/20",
                  selected?.id === f.id
                    ? "border-cream/30 bg-ink-muted"
                    : "border-ink-muted bg-ink-soft hover:bg-ink-muted"
                )}
              >
                <div
                  className="mb-3 h-8 w-8 rounded-lg"
                  style={{ background: f.color }}
                />
                <p className="font-display font-semibold text-cream text-sm leading-snug truncate">{f.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <ChevronRight className="h-3.5 w-3.5 text-cream/30" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                    className="opacity-0 group-hover:opacity-100 text-cream/30 hover:text-accent-coral transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resource detail panel */}
          {selected && (
            <div className="flex-1 fade-up">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-md" style={{ background: selected.color }} />
                  <h2 className="font-display text-xl font-bold text-cream">{selected.name}</h2>
                  <span className="text-sm text-cream/30">({resources.length})</span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1.5 text-cream/40 hover:text-cream hover:bg-ink-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loadingResources && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-20 rounded-xl" />
                  ))}
                </div>
              )}

              {!loadingResources && resources.length === 0 && (
                <div className="flex flex-col items-center py-16 text-cream/30">
                  <BookmarkCheck className="mb-2 h-8 w-8" />
                  <p className="text-sm">No resources saved here yet</p>
                </div>
              )}

              <div className="space-y-3">
                {resources.map((r) => {
                  const SrcIcon = SOURCE_ICON[r.source as keyof typeof SOURCE_ICON] ?? Globe;
                  return (
                    <div key={r.id} className="flex items-start gap-4 rounded-xl border border-ink-muted bg-ink-soft p-4 hover:border-ink-muted/60 transition-all fade-up">
                      <SrcIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-cream/30" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-cream leading-snug line-clamp-1">{r.title}</p>
                        <p className="text-xs text-cream/40 mt-0.5 line-clamp-2">{r.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <select
                            value={r.status ?? "WANT_TO_LEARN"}
                            onChange={(e) => handleStatus(r.id!, e.target.value as ProgressStatus)}
                            className="rounded-lg border border-ink-muted bg-ink px-2 py-1 text-xs text-cream/60 outline-none focus:border-accent-yellow/40"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-cream/30 hover:text-cream transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button onClick={() => handleDeleteResource(r.id!)} className="text-cream/20 hover:text-accent-coral transition-colors ml-auto">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
