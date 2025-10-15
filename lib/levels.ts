export type Level = {
  level_id: number;
  level_title: string;
  level_prompt: string;
  level_response: string[]; // countries (<=3)
  tag: "Fiction" | "Non-Fiction";
};

import levelsData from "../data/levels.json";

export const ALL_LEVELS: Level[] = levelsData as Level[];

const PLAYED_KEY = "playedLevelIds";

export function getPlayed(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(PLAYED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function setPlayed(ids: number[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PLAYED_KEY, JSON.stringify(ids));
}

export function pickRandomUnplayed(): Level {
  const played = new Set(getPlayed());
  const pool = ALL_LEVELS.filter(l => !played.has(l.level_id));
  if (pool.length === 0) {
    // reset pool
    setPlayed([]);
    return ALL_LEVELS[Math.floor(Math.random() * ALL_LEVELS.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function markPlayed(id: number) {
  const played = new Set(getPlayed());
  played.add(id);
  setPlayed([...played]);
}
