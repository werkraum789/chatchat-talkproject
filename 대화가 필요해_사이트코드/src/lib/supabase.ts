import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-0cd82ee9`;
export const SERVER_HEADERS = {
  Authorization: `Bearer ${publicAnonKey}`,
  "Content-Type": "application/json",
};

export type User = {
  id: string;
  nickname: string;
  email: string;
  created_at: string;
};

export type Mission = {
  id: string;
  week: 1 | 2 | 3;
  title: string;
  description: string;
  instagram_url: string | null;
};

export type Entry = {
  id: string;
  user_id: string;
  week: 1 | 2 | 3;
  content: string;
  mood: string;
  image_url: string | null;
  visibility: "private" | "admin" | "public";
  is_anonymous: boolean;
  is_hidden: boolean;
  created_at: string;
  users?: { nickname: string };
};

export type Comment = {
  id: string;
  entry_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  users?: { nickname: string };
};

export type Reaction = {
  id: string;
  entry_id: string;
  user_id: string;
  type: "like" | "heart" | "clap";
};

export type MissionCompletion = {
  id: string;
  user_id: string;
  week: 1 | 2 | 3;
  comment: string | null;
  completed_at: string;
};

export type WeeklyActivity = {
  id: string;
  user_id: string;
  week: 1 | 2 | 3;
  activities: WeeklyActivities;
  updated_at: string;
};

export type Visibility = "private" | "admin" | "public";

export type ActivityDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ActivityRecord = {
  content: string;
  visibility: Visibility;
  mood: string;
  entryId?: string;
};

export type WeeklyActivities = Record<ActivityDay, ActivityRecord>;

export const ACTIVITY_DAY_OPTIONS: {
  key: ActivityDay;
  label: string;
  color: string;
}[] = [
  { key: "monday", label: "월", color: "bg-primary-light text-primary" },
  { key: "tuesday", label: "화", color: "bg-peach-light text-peach-dark" },
  { key: "wednesday", label: "수", color: "bg-mint-light text-mint-dark" },
  { key: "thursday", label: "목", color: "bg-lavender-light text-lavender-dark" },
  { key: "friday", label: "금", color: "bg-muted text-subtext" },
  { key: "saturday", label: "토", color: "bg-lavender-light text-lavender-dark" },
  { key: "sunday", label: "일", color: "bg-primary-light text-primary" },
];

export function createEmptyActivities(): WeeklyActivities {
  return Object.fromEntries(
    ACTIVITY_DAY_OPTIONS.map(({ key }) => [
      key,
      { content: "", visibility: "private", mood: "" },
    ]),
  ) as WeeklyActivities;
}

export function normalizeActivities(value: unknown): WeeklyActivities {
  const empty = createEmptyActivities();
  if (!value || typeof value !== "object") return empty;

  for (const { key } of ACTIVITY_DAY_OPTIONS) {
    const activity = (value as Record<string, unknown>)[key];
    if (typeof activity === "string") {
      empty[key].content = activity;
    } else if (activity && typeof activity === "object") {
      const record = activity as Record<string, unknown>;
      empty[key] = {
        content: typeof record.content === "string" ? record.content : "",
        visibility: ["private", "admin", "public"].includes(String(record.visibility))
          ? record.visibility as Visibility
          : "private",
        mood: typeof record.mood === "string" ? record.mood : "",
        entryId: typeof record.entryId === "string" ? record.entryId : undefined,
      };
    }
  }
  return empty;
}

export type Feedback = {
  id: string;
  user_id: string | null;
  category: "mission" | "process" | "other";
  content: string;
  is_anonymous: boolean;
  created_at: string;
};

export type Announcement = {
  id: string;
  content: string;
  is_active: boolean;
  created_at: string;
};

export type SurveyResponse = {
  id: string;
  user_id: string | null;
  week: 1 | 2 | 3;
  q1_score: number | null;
  q2_score: number | null;
  q3_score: number | null;
  q_text: string | null;
  is_anonymous: boolean;
  created_at: string;
};

export const WEEK_COLORS = {
  1: { bg: "bg-mint", text: "text-mint-dark", hex: "#B5EAD7", light: "#E8F8F2", badge: "🌱" },
  2: { bg: "bg-lavender", text: "text-lavender-dark", hex: "#C7CEEA", light: "#EDEEF8", badge: "🌿" },
  3: { bg: "bg-peach", text: "text-peach-dark", hex: "#FFDAC1", light: "#FFF3EC", badge: "🌳" },
} as const;

export const MOODS = ["😊", "😐", "😢", "🔥", "💪", "🤔", "😴", "🥳"] as const;
export const ANIMAL_NICKNAMES = ["고양이", "강아지", "토끼", "곰", "여우", "판다", "코알라", "햄스터", "펭귄", "사자", "호랑이", "늑대"];

export function getAnonymousNickname(userId: string): string {
  const idx = userId.charCodeAt(0) % ANIMAL_NICKNAMES.length;
  return `익명의 ${ANIMAL_NICKNAMES[idx]}`;
}
