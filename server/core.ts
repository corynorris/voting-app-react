// ── Tournament Bracket Types ──

export interface Match {
  entryA: string; // always set
  entryB: string | null; // null = bye → auto-win for entryA
  scoreA: number;
  scoreB: number;
  decided: boolean;
  winner?: string; // set when decided
}

export interface TournamentState {
  name: string;
  entries: string[]; // original entry list
  rounds: Match[][]; // rounds[0] = first round, rounds[last] = final
  currentRound: number; // 0-based index into rounds
  currentMatch: number; // 0-based index into current round's matches
  winner?: string; // set when tournament is complete
  timerSeconds: number; // configurable per-match timer (0 = no timer)
  matchStartedAt: number; // Date.now() when current match began
}

// ── Bracket Generation ──

/**
 * Pre-generate the full bracket tree for a list of entries.
 * Round 1 matches are populated from entries (with byes for odd counts).
 * Later rounds have empty matches filled as winners are determined.
 */
export function generateBracket(entries: string[]): Match[][] {
  if (entries.length < 2) {
    throw new Error("Need at least 2 entries for a tournament");
  }

  const rounds: Match[][] = [];
  let slotsNeeded = entries.length;

  // Pre-allocate rounds: each round halves the number of matches
  while (slotsNeeded > 1) {
    const matchCount = Math.ceil(slotsNeeded / 2);
    rounds.push(
      Array.from({ length: matchCount }, (): Match => ({
        entryA: "",
        entryB: null,
        scoreA: 0,
        scoreB: 0,
        decided: false,
      })),
    );
    slotsNeeded = matchCount;
  }

  // Fill round 1 from entries
  const round1 = rounds[0];
  for (let i = 0; i < entries.length; i += 2) {
    const matchIdx = Math.floor(i / 2);
    round1[matchIdx].entryA = entries[i];
    if (i + 1 < entries.length) {
      round1[matchIdx].entryB = entries[i + 1];
    } else {
      // Bye — auto-win for the sole entry
      round1[matchIdx].entryB = null;
      round1[matchIdx].decided = true;
      round1[matchIdx].winner = entries[i];
    }
  }

  return rounds;
}

/**
 * Create a new tournament from a name and entry list.
 */
export function createTournament(
  name: string,
  entries: string[],
  timerSeconds = 0,
): TournamentState {
  const rounds = generateBracket(entries);
  return {
    name,
    entries,
    rounds,
    currentRound: 0,
    currentMatch: 0,
    timerSeconds,
    matchStartedAt: Date.now(),
  };
}

// ── Tournament Logic ──

/** Get the current match being voted on. */
export function getCurrentMatch(state: TournamentState): Match | null {
  if (state.winner) return null;
  const round = state.rounds[state.currentRound];
  if (!round) return null;
  return round[state.currentMatch] ?? null;
}

/** Get the current pair (entryA, entryB if exists, or null for bye). */
export function getCurrentPair(state: TournamentState): [string, string] | [string] | null {
  const match = getCurrentMatch(state);
  if (!match || !match.entryA) return null;
  if (match.entryB) return [match.entryA, match.entryB];
  return [match.entryA]; // bye
}

/** Apply a vote for an entry in the current match. Returns updated state. */
export function vote(state: TournamentState, entry: string): TournamentState {
  if (state.winner) return state;

  const rounds = state.rounds.map((r) => r.map((m) => ({ ...m })));
  const round = rounds[state.currentRound];
  if (!round) return state;

  const match = round[state.currentMatch];
  if (!match || match.decided) return state;

  if (entry === match.entryA) {
    match.scoreA += 1;
  } else if (entry === match.entryB) {
    match.scoreB += 1;
  }

  return { ...state, rounds };
}

/** Decide the current match (determine winner from scores) and advance. */
export function next(state: TournamentState): TournamentState {
  if (state.winner) return state;

  const rounds = state.rounds.map((r) => r.map((m) => ({ ...m })));
  let currentRound = state.currentRound;
  let currentMatch = state.currentMatch;

  const round = rounds[currentRound];
  if (!round) return state;

  const match = round[currentMatch];
  if (!match) return state;

  // Decide current match if not already decided
  if (!match.decided) {
    if (match.entryB === null) {
      // Bye
      match.winner = match.entryA;
    } else if (match.scoreA > match.scoreB) {
      match.winner = match.entryA;
    } else if (match.scoreB > match.scoreA) {
      match.winner = match.entryB;
    } else {
      // Tie — both advance (or pick first, your choice)
      // For now, entryA wins ties
      match.winner = match.entryA;
    }
    match.decided = true;
  }

  // Advance within the round
  currentMatch++;

  // If we've exhausted this round, populate the next round
  if (currentMatch >= round.length) {
    const winners = round.map((m) => m.winner!);
    const nextRoundIdx = currentRound + 1;

    if (nextRoundIdx >= rounds.length) {
      // Tournament complete — the last "winners" array should have one winner
      return {
        ...state,
        rounds,
        currentRound,
        currentMatch,
        winner: winners[0] ?? state.winner,
      };
    }

    // Populate next round's matches from winners
    const nextRound = rounds[nextRoundIdx];
    for (let i = 0; i < winners.length; i += 2) {
      const matchIdx = Math.floor(i / 2);
      nextRound[matchIdx].entryA = winners[i];
      if (i + 1 < winners.length) {
        nextRound[matchIdx].entryB = winners[i + 1];
      } else {
        // Bye in later round (odd number of winners)
        nextRound[matchIdx].entryB = null;
        nextRound[matchIdx].decided = true;
        nextRound[matchIdx].winner = winners[i];
      }
    }

    currentRound = nextRoundIdx;
    currentMatch = 0;
  }

  // Check if the new current match is already decided (bye), and if so, auto-advance
  const newRound = rounds[currentRound];
  const newMatch = newRound?.[currentMatch];
  if (newMatch?.decided && !newMatch.winner) {
    // This shouldn't happen — all decided matches should have winners
  }

  return {
    ...state,
    rounds,
    currentRound,
    currentMatch,
    matchStartedAt: Date.now(),
  };
}

/** Strip non-serializable bits for the wire (Redux state must be plain objects). */
export function toWireState(state: TournamentState): TournamentState {
  return JSON.parse(JSON.stringify(state));
}
