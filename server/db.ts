import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { TournamentState, Match } from "./core.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "..", "tournaments.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      winner TEXT,
      state_json TEXT NOT NULL
    );
  `);
}

// ── Save / Load ──

const CURRENT_ID = "current";

/** Persist the tournament state. */
export function saveTournament(state: TournamentState): void {
  const db = getDb();
  const json = JSON.stringify(state);
  db.prepare(
    `INSERT INTO tournaments (id, name, state_json) 
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, state_json = excluded.state_json, completed_at = NULL, winner = NULL`,
  ).run(CURRENT_ID, state.name, json);
}

/** Load the current tournament state, or null if none. */
export function loadTournament(): TournamentState | null {
  const db = getDb();
  const row = db
    .prepare("SELECT state_json FROM tournaments WHERE id = ?")
    .get(CURRENT_ID) as { state_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.state_json) as TournamentState;
  } catch {
    return null;
  }
}

/** Archive the completed tournament to history and clear current. */
export function archiveTournament(state: TournamentState): void {
  const db = getDb();
  const id = `${state.name}-${Date.now()}`;
  const json = JSON.stringify(state);
  db.prepare(
    `INSERT INTO tournaments (id, name, created_at, completed_at, winner, state_json)
     VALUES (?, ?, datetime('now'), datetime('now'), ?, ?)`,
  ).run(id, state.name, state.winner ?? null, json);
  // Clear current
  db.prepare("DELETE FROM tournaments WHERE id = ?").run(CURRENT_ID);
}

/** Get tournament history (completed tournaments). */
export function getHistory(): Array<{
  id: string;
  name: string;
  completedAt: string;
  winner: string;
}> {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, completed_at as completedAt, winner FROM tournaments WHERE id != ? AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 20",
    )
    .all(CURRENT_ID) as Array<{
    id: string;
    name: string;
    completedAt: string;
    winner: string;
  }>;
}
