import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppState } from "./core.js";
import { setEntries, next, vote } from "./core.js";

const serverSlice = createSlice({
  name: "voting",
  initialState: {} as AppState,
  reducers: {
    SET_ENTRIES: (state, action: PayloadAction<string[]>) => {
      return setEntries(state, action.payload);
    },
    NEXT: (state) => {
      return next(state);
    },
    VOTE: (state, action: PayloadAction<string>) => {
      if (!state.vote) return state;
      return { ...state, vote: vote(state.vote, action.payload) };
    },
  },
});

export const { SET_ENTRIES, NEXT, VOTE } = serverSlice.actions;
export default serverSlice.reducer;
