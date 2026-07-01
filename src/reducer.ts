import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "./types";

const initialState: AppState = {};

const votingSlice = createSlice({
  name: "voting",
  initialState,
  reducers: {
    // Server sends full state snapshot
    SET_STATE: (_state, action: PayloadAction<AppState>) => {
      return action.payload;
    },
    // Client dispatches VOTE with entry (sent to server via socket middleware)
    VOTE: (_state, _action: PayloadAction<{ entry: string }>) => {
      // No local state change; server will send new state
      return;
    },
    NEXT: () => {
      // No local state change; server will send new state
      return;
    },
  },
});

export const { SET_STATE, VOTE, NEXT } = votingSlice.actions;
export default votingSlice.reducer;
