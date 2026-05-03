import type { Resource, Folder, SearchHistoryItem } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Search ───────────────────────────────────────────────────────────────────
export const searchResources = (query: string) =>
  apiFetch<Resource[]>(`/search?query=${encodeURIComponent(query)}`);

// ─── Subtopics ────────────────────────────────────────────────────────────────
export const getSubtopics = (topic: string) =>
  apiFetch<{ subtopics: string[] }>("/subtopics", {
    method: "POST",
    body: JSON.stringify({ topic }),
  });

// ─── Folders ─────────────────────────────────────────────────────────────────
export const getFolders = () => apiFetch<Folder[]>("/folders");

export const createFolder = (name: string, color: string) =>
  apiFetch<Folder>("/folders", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });

export const deleteFolder = (id: string) =>
  apiFetch<void>(`/folders/${id}`, { method: "DELETE" });

// ─── Resources ────────────────────────────────────────────────────────────────
export const saveResource = (data: Omit<Resource, "id" | "status" | "created_at"> & { folder_id: string }) =>
  apiFetch<Resource>("/resources/save", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getResourcesInFolder = (folderId: string) =>
  apiFetch<Resource[]>(`/resources/folder/${folderId}`);

export const updateProgress = (resourceId: string, status: string) =>
  apiFetch<Resource>(`/resources/progress/${resourceId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteResource = (resourceId: string) =>
  apiFetch<void>(`/resources/${resourceId}`, { method: "DELETE" });

export const getAllProgress = () => apiFetch<Resource[]>("/resources/progress/all");

// ─── History ─────────────────────────────────────────────────────────────────
export const getSearchHistory = () => apiFetch<SearchHistoryItem[]>("/history");
