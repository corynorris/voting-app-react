import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { configureStore } from "@reduxjs/toolkit";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import reducer, { SET_ENTRIES, NEXT, VOTE } from "./reducer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load movie entries
const entriesData = readFileSync(resolve(__dirname, "entries.json"), "utf-8");
const entries: string[] = JSON.parse(entriesData);

// Set up Redux store
const store = configureStore({ reducer });
store.dispatch(SET_ENTRIES(entries));
store.dispatch(NEXT()); // Start the first round

// Set up Express + HTTP server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Emit state changes to all clients
store.subscribe(() => {
  const state = store.getState();
  io.emit("state", state);
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  // Send current state to newly connected client
  socket.emit("state", store.getState());

  // Client sends actions, server applies them
  socket.on("action", (action: { type: string; entry?: string }) => {
    switch (action.type) {
      case "VOTE":
        if (action.entry) store.dispatch(VOTE(action.entry));
        break;
      case "NEXT":
        store.dispatch(NEXT());
        break;
    }
  });
});

// Serve static files in production
const PORT = parseInt(process.env.PORT ?? "8090", 10);
httpServer.listen(PORT, () => {
  console.log(`Voting server running on port ${PORT}`);
});
