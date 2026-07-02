import { configureStore, type Middleware } from "@reduxjs/toolkit";
import reducer, { SET_STATE } from "./reducer";
import socket from "./socket";
import type { TournamentState } from "./types";

// Middleware: intercept actions and forward to server via socket
const socketMiddleware: Middleware = () => (next) => (action) => {
	const a = action as { type: string; payload?: Record<string, unknown> };
	switch (a.type) {
		case "voting/CREATE_TOURNAMENT":
			socket.emit("action", {
				type: "CREATE_TOURNAMENT",
				name: a.payload?.name,
				entries: a.payload?.entries,
				timerSeconds: a.payload?.timerSeconds,
			});
			return;
		case "voting/VOTE":
			socket.emit("action", {
				type: "VOTE",
				entry: a.payload?.entry,
			});
			return;
		case "voting/NEXT":
			socket.emit("action", { type: "NEXT" });
			return;
		default:
			return next(action);
	}
};

export const store = configureStore({
	reducer: { voting: reducer },
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(socketMiddleware),
});

// Listen for state updates from server
socket.on("state", (state: TournamentState) => {
	store.dispatch(SET_STATE(state));
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
