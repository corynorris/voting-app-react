import { configureStore, type Middleware } from "@reduxjs/toolkit";
import reducer, { SET_STATE } from "./reducer";
import socket from "./socket";
import type { AppState } from "./types";

// Middleware: intercept remote actions and send them to server instead
const socketMiddleware: Middleware = () => (next) => (action) => {
  const a = action as { type: string; payload?: { entry?: string } };
  if (a.type === "voting/VOTE") {
    socket.emit("action", {
      type: "VOTE",
      entry: a.payload?.entry,
    });
    return; // Don't apply locally — server will push new state
  }
  if (a.type === "voting/NEXT") {
    socket.emit("action", { type: "NEXT" });
    return;
  }

  return next(action);
};

export const store = configureStore({
  reducer: { voting: reducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socketMiddleware),
});

// Listen for state updates from server
socket.on("state", (state: AppState) => {
  store.dispatch(SET_STATE(state));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
