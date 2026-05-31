export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Source = "youtube" | "book" | "wikipedia";
export type ProgressStatus = "WANT_TO_LEARN" | "IN_PROGRESS" | "DONE";

export interface UserProfile {
  id: string;
  email: string;
  aud?: string;
  role?: string;
}

export interface Resource {
  id?: string;
  title: string;
  source: Source;
  description: string;
  thumbnail?: string;
  link: string;
  difficulty: Difficulty;
  status?: ProgressStatus;
  folder_id?: string;
  created_at?: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  result_count: number;
  searched_at: string;
}
