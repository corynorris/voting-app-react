import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TournamentState } from "./types";

const initialState: TournamentState | null = null;

const votingSlice = createSlice({
  name: "voting",
  initialState: initialState as TournamentState | null,
  reducers: {
    SET_STATE: (_state, action: PayloadAction<TournamentState>) => {
      return action.payload;
    },
    CREATE_TOURNAMENT: (
      _state,
      _action: PayloadAction<{ name: string; entries: string[]; timerSeconds?: number }>,
    ) => {
      return _state; // sent to server via socket middleware
    },
    VOTE: (_state, _action: PayloadAction<{ entry: string }>) => {
      return _state; // sent to server
    },
    NEXT: (state) => {
      return state; // sent to server
    },
  },
});

export const { SET_STATE, CREATE_TOURNAMENT, VOTE, NEXT } =
  votingSlice.actions;
export default votingSlice.reducer;
