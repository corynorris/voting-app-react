import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { TournamentState } from "./core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "..", "tournaments.json");

interface TournamentRow {
  id: string;
  name: string;
  createdAt: string;
  completedAt: string | null;
  winner: string | null;
  stateJson: string;
}

interface DbData {
  tournaments: TournamentRow[];
}

function readDb(): DbData {
  if (!existsSync(DB_PATH)) {
    return { tournaments: [] };
  }
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8")) as DbData;
  } catch {
    return { tournaments: [] };
  }
}

function writeDb(data: DbData): void {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ── Save / Load ──

const CURRENT_ID = "current";

/** Persist the tournament state. */
export function saveTournament(state: TournamentState): void {
  const data = readDb();
  const idx = data.tournaments.findIndex((t) => t.id === CURRENT_ID);
  const row: TournamentRow = {
    id: CURRENT_ID,
    name: state.name,
    createdAt: new Date().toISOString(),
    completedAt: null,
    winner: null,
    stateJson: JSON.stringify(state),
  };
  if (idx >= 0) {
    data.tournaments[idx] = row;
  } else {
    data.tournaments.push(row);
  }
  writeDb(data);
}

/** Load the current tournament state, or null if none. */
export function loadTournament(): TournamentState | null {
  const data = readDb();
  const row = data.tournaments.find((t) => t.id === CURRENT_ID);
  if (!row) return null;
  try {
    return JSON.parse(row.stateJson) as TournamentState;
  } catch {
    return null;
  }
}

/** Archive the completed tournament to history and clear current. */
export function archiveTournament(state: TournamentState): void {
  const data = readDb();
  const id = `${state.name}-${Date.now()}`;
  data.tournaments.push({
    id,
    name: state.name,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    winner: state.winner ?? null,
    stateJson: JSON.stringify(state),
  });
  // Clear current
  data.tournaments = data.tournaments.filter((t) => t.id !== CURRENT_ID);
  writeDb(data);
}

/** Get tournament history (completed tournaments). */
export function getHistory(): Array<{
  id: string;
  name: string;
  completedAt: string;
  winner: string;
}> {
  const data = readDb();
  return data.tournaments
    .filter((t) => t.id !== CURRENT_ID && t.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
    .slice(0, 20)
    .map((t) => ({
      id: t.id,
      name: t.name,
      completedAt: t.completedAt!,
      winner: t.winner ?? "",
    }));
}
