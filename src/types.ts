// ── Tournament Bracket Types (mirrors server/core.ts) ──

export interface Match {
  entryA: string;
  entryB: string | null; // null = bye
  scoreA: number;
  scoreB: number;
  decided: boolean;
  winner?: string;
}

export interface TournamentState {
  name: string;
  entries: string[];
  rounds: Match[][];
  currentRound: number;
  currentMatch: number;
  winner?: string;
  timerSeconds: number;
  matchStartedAt: number;
}
