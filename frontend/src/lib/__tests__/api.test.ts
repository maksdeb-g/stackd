/**
 * Tests for src/lib/api.ts
 *
 * All tests use a jest.fn() spy on globalThis.fetch so no real HTTP calls are made.
 */

// Provide a minimal stub for process.env used by the module
process.env.NEXT_PUBLIC_API_URL = "http://api.test";

import {
  searchResources,
  getSubtopics,
  getFolders,
  createFolder,
  deleteFolder,
  saveResource,
  getResourcesInFolder,
  updateProgress,
  deleteResource,
  getAllProgress,
  getSearchHistory,
} from "../api";
import type { Resource, Folder, SearchHistoryItem } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFetchOk(body: unknown, status = 200): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: true,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

function makeFetchError(status: number, detail: string): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ detail }),
  } as unknown as Response);
}

function makeFetch204(): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 204,
    json: () => Promise.resolve({}),
  } as unknown as Response);
}

const sampleResource: Resource = {
  title: "Learn Python",
  source: "youtube",
  description: "A great tutorial",
  link: "https://youtube.com/watch?v=abc",
  difficulty: "beginner",
};

const sampleFolder: Folder = {
  id: "f1",
  name: "Science",
  color: "#6366f1",
  created_at: "2024-01-01T00:00:00",
};

// ─── searchResources ──────────────────────────────────────────────────────────

describe("searchResources", () => {
  it("calls GET /search with encoded query", async () => {
    const mockFetch = makeFetchOk([sampleResource]);
    globalThis.fetch = mockFetch;

    const result = await searchResources("python basics");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/search?query=python%20basics",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } })
    );
    expect(result).toEqual([sampleResource]);
  });

  it("throws when server returns an error", async () => {
    globalThis.fetch = makeFetchError(400, "Query cannot be empty");

    await expect(searchResources("")).rejects.toThrow("Query cannot be empty");
  });
});

// ─── getSubtopics ─────────────────────────────────────────────────────────────

describe("getSubtopics", () => {
  it("calls POST /subtopics with JSON body", async () => {
    const payload = { subtopics: ["Variables", "Functions"] };
    const mockFetch = makeFetchOk(payload);
    globalThis.fetch = mockFetch;

    const result = await getSubtopics("Python");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/subtopics",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ topic: "Python" }),
      })
    );
    expect(result).toEqual(payload);
  });

  it("throws on AI service error", async () => {
    globalThis.fetch = makeFetchError(500, "AI service error: timeout");

    await expect(getSubtopics("Python")).rejects.toThrow("AI service error: timeout");
  });
});

// ─── getFolders ───────────────────────────────────────────────────────────────

describe("getFolders", () => {
  it("calls GET /folders and returns folder list", async () => {
    const mockFetch = makeFetchOk([sampleFolder]);
    globalThis.fetch = mockFetch;

    const result = await getFolders();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/folders",
      expect.any(Object)
    );
    expect(result).toEqual([sampleFolder]);
  });

  it("returns empty array when no folders exist", async () => {
    globalThis.fetch = makeFetchOk([]);

    const result = await getFolders();

    expect(result).toEqual([]);
  });
});

// ─── createFolder ─────────────────────────────────────────────────────────────

describe("createFolder", () => {
  it("calls POST /folders with name and color", async () => {
    const mockFetch = makeFetchOk(sampleFolder);
    globalThis.fetch = mockFetch;

    const result = await createFolder("Science", "#6366f1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/folders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Science", color: "#6366f1" }),
      })
    );
    expect(result).toEqual(sampleFolder);
  });
});

// ─── deleteFolder ─────────────────────────────────────────────────────────────

describe("deleteFolder", () => {
  it("calls DELETE /folders/:id", async () => {
    const mockFetch = makeFetch204();
    globalThis.fetch = mockFetch;

    await deleteFolder("f1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/folders/f1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── saveResource ─────────────────────────────────────────────────────────────

describe("saveResource", () => {
  it("calls POST /resources/save with resource data", async () => {
    const saved = { ...sampleResource, id: "r1" };
    const mockFetch = makeFetchOk(saved);
    globalThis.fetch = mockFetch;

    const payload = { ...sampleResource, folder_id: "f1" };
    const result = await saveResource(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/resources/save",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(saved);
  });

  it("throws when folder not found", async () => {
    globalThis.fetch = makeFetchError(404, "Folder not found");

    await expect(saveResource({ ...sampleResource, folder_id: "bad" })).rejects.toThrow(
      "Folder not found"
    );
  });
});

// ─── getResourcesInFolder ─────────────────────────────────────────────────────

describe("getResourcesInFolder", () => {
  it("calls GET /resources/folder/:id", async () => {
    const mockFetch = makeFetchOk([sampleResource]);
    globalThis.fetch = mockFetch;

    const result = await getResourcesInFolder("f1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/resources/folder/f1",
      expect.any(Object)
    );
    expect(result).toEqual([sampleResource]);
  });
});

// ─── updateProgress ───────────────────────────────────────────────────────────

describe("updateProgress", () => {
  it("calls PATCH /resources/progress/:id with status", async () => {
    const updated = { ...sampleResource, id: "r1", status: "IN_PROGRESS" };
    const mockFetch = makeFetchOk(updated);
    globalThis.fetch = mockFetch;

    const result = await updateProgress("r1", "IN_PROGRESS");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/resources/progress/r1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      })
    );
    expect(result).toEqual(updated);
  });

  it("throws when resource is not found", async () => {
    globalThis.fetch = makeFetchError(404, "Resource not found");

    await expect(updateProgress("bad-id", "DONE")).rejects.toThrow("Resource not found");
  });
});

// ─── deleteResource ───────────────────────────────────────────────────────────

describe("deleteResource", () => {
  it("calls DELETE /resources/:id", async () => {
    const mockFetch = makeFetch204();
    globalThis.fetch = mockFetch;

    await deleteResource("r1");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/resources/r1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── getAllProgress ───────────────────────────────────────────────────────────

describe("getAllProgress", () => {
  it("calls GET /resources/progress/all", async () => {
    const resources = [{ ...sampleResource, status: "DONE" }] as Resource[];
    const mockFetch = makeFetchOk(resources);
    globalThis.fetch = mockFetch;

    const result = await getAllProgress();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/resources/progress/all",
      expect.any(Object)
    );
    expect(result).toEqual(resources);
  });
});

// ─── getSearchHistory ─────────────────────────────────────────────────────────

describe("getSearchHistory", () => {
  it("calls GET /history and returns items", async () => {
    const items: SearchHistoryItem[] = [
      { id: "h1", query: "python", result_count: 10, searched_at: "2024-01-01T00:00:00" },
    ];
    const mockFetch = makeFetchOk(items);
    globalThis.fetch = mockFetch;

    const result = await getSearchHistory();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/history",
      expect.any(Object)
    );
    expect(result).toEqual(items);
  });

  it("returns empty array when history is empty", async () => {
    globalThis.fetch = makeFetchOk([]);

    const result = await getSearchHistory();

    expect(result).toEqual([]);
  });
});

// ─── apiFetch error handling ──────────────────────────────────────────────────

describe("apiFetch error handling", () => {
  it("uses HTTP status in error message when no detail field", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({}), // no 'detail' key
    } as unknown as Response);

    await expect(getFolders()).rejects.toThrow("HTTP 503");
  });

  it("returns undefined for 204 No Content", async () => {
    globalThis.fetch = makeFetch204();

    const result = await deleteFolder("f1");

    expect(result).toBeUndefined();
  });
});
