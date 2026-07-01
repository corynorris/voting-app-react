import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TournamentState } from "./core.js";
import { createTournament, vote, next, toWireState } from "./core.js";

const serverSlice = createSlice({
  name: "voting",
  initialState: null as TournamentState | null,
  reducers: {
    CREATE_TOURNAMENT: (
      _state,
      action: PayloadAction<{ name: string; entries: string[]; timerSeconds?: number }>,
    ) => {
      return createTournament(action.payload.name, action.payload.entries, action.payload.timerSeconds ?? 0);
    },
    RESTORE_STATE: (
      _state,
      action: PayloadAction<TournamentState>,
    ) => {
      return action.payload;
    },
    VOTE: (state, action: PayloadAction<string>) => {
      if (!state) return state;
      return vote(state, action.payload);
    },
    NEXT: (state) => {
      if (!state) return state;
      return next(state);
    },
  },
});

export const { CREATE_TOURNAMENT, RESTORE_STATE, VOTE, NEXT } = serverSlice.actions;
export default serverSlice.reducer;

/** Get wire-safe state for sending to clients. */
export function getWireState(
  state: TournamentState | null,
): TournamentState | null {
  if (!state) return null;
  return toWireState(state);
}
