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
