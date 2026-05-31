"use client";
import { useState } from "react";
import Image from "next/image";
import { ExternalLink, BookmarkPlus, Youtube, BookOpen, Globe, Sparkles } from "lucide-react";
import type { Resource, Folder } from "@/types";
import { saveResource } from "@/lib/api";
import clsx from "clsx";

const SOURCE_META = {
  youtube: { icon: Youtube, label: "YouTube", color: "text-accent-coral bg-accent-coral/10" },
  book: { icon: BookOpen, label: "Book", color: "text-accent-teal bg-accent-teal/10" },
  wikipedia: { icon: Globe, label: "Wikipedia", color: "text-accent-violet bg-accent-violet/10" },
};

const DIFFICULTY_COLOR = {
  beginner: "text-green-400 bg-green-400/10",
  intermediate: "text-accent-yellow bg-accent-yellow/10",
  advanced: "text-accent-coral bg-accent-coral/10",
};

interface Props {
  resource: Resource;
  folders: Folder[];
  isSaved?: boolean;
  onSaved?: () => void;
  style?: React.CSSProperties;
}

export default function ResourceCard({ resource, folders, isSaved = false, onSaved, style }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [error, setError] = useState("");

  const meta = SOURCE_META[resource.source];
  const Icon = meta.icon;

  async function handleSave(folderId: string) {
    setSaving(true);
    setError("");
    try {
      await saveResource({ ...resource, folder_id: folderId });
      setSaved(true);
      setShowFolderPicker(false);
      onSaved?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={style}
      className="fade-up group relative flex flex-col rounded-xl border border-ink-muted bg-ink-soft hover:border-ink-muted/80 transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail */}
      {resource.thumbnail ? (
        <div className="relative h-40 w-full overflow-hidden bg-ink-muted">
          <Image
            src={resource.thumbnail}
            alt={resource.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-soft/80 to-transparent" />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-ink-muted to-ink-soft">
          <Icon className="h-12 w-12 text-cream/20" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={clsx("tag", meta.color)}>
            <Icon className="mr-1 inline-block h-3 w-3" />
            {meta.label}
          </span>
          <span className={clsx("tag", DIFFICULTY_COLOR[resource.difficulty])}>
            {resource.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-semibold leading-snug text-cream line-clamp-2">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="flex-1 text-sm leading-relaxed text-cream/50 line-clamp-3">
          {resource.description}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink-muted py-2 text-xs font-medium text-cream/70 hover:bg-ink-muted/80 hover:text-cream transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>

          {/* Save to folder */}
          <div className="relative">
            <button
              onClick={() => setShowFolderPicker(!showFolderPicker)}
              disabled={saving || saved}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                saved
                  ? "bg-accent-teal/20 text-accent-teal"
                  : "bg-accent-yellow/10 text-accent-yellow hover:bg-accent-yellow/20"
              )}
            >
              {saved ? (
                <><Sparkles className="h-3.5 w-3.5" /> Saved</>
              ) : (
                <><BookmarkPlus className="h-3.5 w-3.5" /> Save</>
              )}
            </button>

            {/* Folder picker dropdown */}
            {showFolderPicker && (
              <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-ink-muted bg-ink-soft shadow-2xl z-20 overflow-hidden">
                {folders.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-cream/40">No folders yet. Create one first.</p>
                ) : (
                  folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleSave(f.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-ink-muted transition-colors"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: f.color }}
                      />
                      <span className="truncate text-cream/80">{f.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-accent-coral">{error}</p>}
      </div>
    </div>
  );
}
