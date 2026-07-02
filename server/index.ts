import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { configureStore } from "@reduxjs/toolkit";
import { existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import reducer, {
	CREATE_TOURNAMENT,
	RESTORE_STATE,
	VOTE,
	NEXT,
	getWireState,
} from "./reducer.js";
import {
	saveTournament,
	loadTournament,
	archiveTournament,
	getHistory,
} from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Set up Redux store
const store = configureStore({ reducer });

// ── Persistent state: load saved tournament on startup ──
const saved = loadTournament();
if (saved) {
	store.dispatch(RESTORE_STATE(saved));
}

// ── Auto-advance timer ──
let advanceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAdvance(state: import("./core.js").TournamentState) {
	// Clear existing timer
	if (advanceTimer) {
		clearTimeout(advanceTimer);
		advanceTimer = null;
	}

	// Don't schedule if tournament is over or timer is disabled
	if (state.winner || state.timerSeconds <= 0) return;

	// Calculate time remaining
	const elapsed = Date.now() - state.matchStartedAt;
	const remaining = state.timerSeconds * 1000 - elapsed;

	if (remaining <= 0) {
		// Already expired — advance immediately
		store.dispatch(NEXT());
		return;
	}

	advanceTimer = setTimeout(() => {
		store.dispatch(NEXT());
	}, remaining);
}

// Set up Express + HTTP server
const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: { origin: "*" },
});

// ── REST API ──

app.get("/api/history", (_req, res) => {
	res.json(getHistory());
});

// ── Socket.IO ──

// Track previous state to detect completion
let prevWinner: string | undefined;

io.on("connection", (socket) => {
	// Send current state to newly connected client
	const state = store.getState();
	if (state) {
		socket.emit("state", getWireState(state));
	}

	// Client sends actions, server applies them
	socket.on("action", (action: { type: string; [key: string]: unknown }) => {
		switch (action.type) {
			case "CREATE_TOURNAMENT": {
				const { name, entries, timerSeconds } = action as {
					type: string;
					name: string;
					entries: string[];
					timerSeconds?: number;
				};
				if (name && entries?.length >= 2) {
					store.dispatch(CREATE_TOURNAMENT({ name, entries, timerSeconds }));
				}
				break;
			}
			case "VOTE":
				if (typeof action.entry === "string") {
					store.dispatch(VOTE(action.entry));
				}
				break;
			case "NEXT":
				store.dispatch(NEXT());
				break;
		}
	});
});

// Emit state changes to all clients + persist + timer
store.subscribe(() => {
	const state = store.getState();
	if (!state) {
		prevWinner = undefined;
		return;
	}

	io.emit("state", getWireState(state));
	scheduleAdvance(state);

	// Detect tournament completion (winner just appeared)
	if (state.winner && !prevWinner) {
		archiveTournament(state);
	} else if (!state.winner) {
		saveTournament(state);
	}
	prevWinner = state.winner;
});

// ── Static file serving (production) ──

const distPath = resolve(__dirname, "..", "..", "dist");
if (existsSync(distPath)) {
	app.use(express.static(distPath));
	app.get("*", (_req, res) => {
		res.sendFile(join(distPath, "index.html"));
	});
}

const PORT = parseInt(process.env.PORT ?? "8090", 10);
httpServer.listen(PORT, () => {
	console.log(`Voting server running on port ${PORT}`);
});
