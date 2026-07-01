export interface VoteState {
  pair?: [string, string];
  tally?: Record<string, number>;
  round?: number;
}

export interface AppState {
  entries?: string[];
  vote?: VoteState;
  winner?: string;
}

// Initial state: empty map
export const INITIAL_STATE: AppState = {};

// Add entries to the tournament
export function setEntries(state: AppState, entries: string[]): AppState {
  return { ...state, entries };
}

// Determine winners of the current vote
export function getWinners(vote: VoteState): string[] {
  if (!vote.pair) return [];
  const [a, b] = vote.pair;
  const aVotes = vote.tally?.[a] ?? 0;
  const bVotes = vote.tally?.[b] ?? 0;
  // FIXED: original had aVotes > bVotes twice — now properly handles a<b and tie
  if (aVotes > bVotes) return [a];
  if (aVotes < bVotes) return [b];
  return [a, b]; // tie
}

// Advance the tournament to the next round
export function next(state: AppState): AppState {
  const currentVote = state.vote;
  const winners = currentVote ? getWinners(currentVote) : [];
  const entries = [...(state.entries ?? []), ...winners];

  if (entries.length === 1) {
    // Single entry left — it's the winner
    return { winner: entries[0] };
  }

  // Next round: take the first 2 entries as the pair, rest go back in the pool
  return {
    entries: entries.slice(2),
    vote: {
      round: (currentVote?.round ?? 0) + 1,
      pair: [entries[0], entries[1]],
    },
  };
}

// Cast a vote for an entry
export function vote(state: VoteState, entry: string): VoteState {
  if (!state.pair?.includes(entry)) {
    return state;
  }
  const currentTally = state.tally ?? {};
  return {
    ...state,
    tally: {
      ...currentTally,
      [entry]: (currentTally[entry] ?? 0) + 1,
    },
  };
}
