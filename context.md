# Voting App React — Full Codebase Analysis

## 1. What the App Does

A real-time, full-stack voting application where users vote on pairs of movie titles in a tournament-style bracket. The server:

- Holds all vote state in a Redux store
- Broadcasts state changes to all connected clients via Socket.IO
- Advances rounds and tracks tallies using Redux actions

The client:

- Renders the current voting pair as clickable buttons
- Shows "Voted" label and disables buttons after user votes
- Displays results as a tally screen with a "Next" button
- Declares a winner when one entry remains

The app runs as two separate processes:

- **Server**: `babel-node index.js` (Socket.IO on port 8090)
- **Client**: `webpack-dev-server` (React app on port 8080)

---

## 2. Tech Stack and Key Dependencies

### Server (`voting-server/`)

| Dependency                 | Version         | Purpose                                         |
| -------------------------- | --------------- | ----------------------------------------------- |
| `immutable`                | ^3.8.1          | Immutable data structures (List, Map) for state |
| `redux`                    | ^3.5.2          | Server-side Redux store                         |
| `socket.io`                | ^1.4.6          | WebSocket real-time communication               |
| `babel-cli` / `babel-core` | ^6.9.0          | ES2015 transpilation                            |
| `babel-preset-es2015`      | ^6.9.0          | ES2015 features                                 |
| `mocha`                    | ^2.5.3          | Test runner                                     |
| `chai` / `chai-immutable`  | ^3.5.0 / ^1.5.4 | Assertions with Immutable.js support            |

### Client (`voting-client/`)

| Dependency                                   | Version         | Purpose                                         |
| -------------------------------------------- | --------------- | ----------------------------------------------- |
| `react` / `react-dom`                        | ^15.1.0         | UI components                                   |
| `react-redux`                                | ^4.4.5          | Redux bindings for React                        |
| `react-router`                               | ^2.0.0          | Client-side routing (hashHistory)               |
| `react-addons-pure-render-mixin`             | ^15.1.0         | Performance optimization via shallow comparison |
| `redux`                                      | ^3.5.2          | Client-side Redux store                         |
| `immutable`                                  | ^3.8.1          | Immutable state on client                       |
| `socket.io-client`                           | ^1.4.6          | Socket.IO client for real-time updates          |
| `webpack`                                    | ^1.13.1         | Module bundler                                  |
| `babel-loader` / `babel-core`                | ^6.2.4 / ^6.9.0 | JSX/ES2015 → ES5 transpilation                  |
| `babel-preset-es2015` / `babel-preset-react` | ^6.9.0 / ^6.5.0 | Babel presets                                   |
| `react-hot-loader`                           | ^1.3.0          | HMR for development                             |
| `jsdom`                                      | ^9.2.1          | DOM simulation for tests                        |
| `mocha` / `chai` / `chai-immutable`          | as above        | Testing                                         |

### Other

- ESLint v2.11.0 with `babel-eslint` parser (root `.eslintrc`)
- No TypeScript — plain JavaScript/JSX with Babel

---

## 3. File Structure Overview

```
voting-app-react/
├── .eslintrc
├── .gitignore                    # Only ignores node_modules/
├── README.md
│
├── voting-server/
│   ├── package.json
│   ├── index.js                  # Entry: creates store, starts server, dispatches initial actions
│   ├── entries.json              # 11 movie titles (Danny Boyle filmography)
│   ├── src/
│   │   ├── core.js               # Pure logic: setEntries, getWinners, next, vote
│   │   ├── reducer.js            # Redux reducer wrapping core logic
│   │   ├── store.js              # createStore factory
│   │   └── server.js             # Socket.IO server: broadcasts state, relays actions
│   └── test/
│       ├── test_helper.js        # chai-immutable plugin setup
│       ├── core_spec.js          # 7 tests for core logic
│       ├── reducer_spec.js       # 5 tests for reducer
│       └── store_spec.js         # 1 test for store creation
│
└── voting-client/
    ├── package.json
    ├── webpack.config.js         # Webpack 1.x config with HMR
    ├── dist/
    │   ├── index.html            # Skeleton HTML with #app mount point
    │   └── bundle.js             # Pre-built bundle (placeholder, 57 lines)
    ├── src/
    │   ├── index.jsx             # Entry: Socket.IO client, Redux setup, Router, ReactDOM.render
    │   ├── action_creators.js    # setState, vote, next action creators
    │   ├── reducer.js            # Client-side reducer: SET_STATE, VOTE
    │   ├── remote_action_middleware.js  # Redux middleware: sends remote actions over socket
    │   └── components/
    │       ├── App.jsx           # Root component (renders children)
    │       ├── Vote.jsx          # Voting buttons component (pure)
    │       ├── Voting.jsx        # Container: renders Vote or Winner
    │       ├── Results.jsx       # Results/tally display with Next button
    │       └── Winner.jsx        # Simple winner announcement
    └── test/
        ├── test_helper.js        # jsdom setup + chai-immutable
        ├── reducer_spec.js       # 6 tests for client reducer
        └── components/
            ├── Voting_spec.jsx   # 6 tests for Voting component
            └── Results_spec.jsx  # 3 tests for Results component
```

---

## 4. How It's Built/Deployed

### Server

```bash
cd voting-server
npm install
npm start                    # Runs: babel-node index.js
npm test                     # Runs: mocha with babel-core/register
```

- `index.js` creates a Redux store, attaches a Socket.IO server on port **8090**, dispatches `SET_ENTRIES` and `NEXT` to kick off the first round.
- On each state change (via `store.subscribe`), the full state is serialized (`.toJS()`) and emitted to all connected clients as a `'state'` event.
- Clients can send `'action'` events; the server dispatches them directly into its store.

### Client

```bash
cd voting-client
npm install
npm start                    # Runs: webpack-dev-server (port 8080)
```

- Webpack 1.x config with `react-hot-loader`, Babel (`babel-preset-es2015` + `react`).
- Entry connects to `ws://<hostname>:8090` and listens for `'state'` events.
- A Redux middleware (`remote_action_middleware.js`) intercepts actions with `meta: {remote: true}` and sends them to the server over the socket.
- React Router uses `hashHistory` with two routes: `/` (VotingContainer) and `/results` (ResultsContainer).
- `dist/index.html` has a single `<div id="app">` mount point.

### Environment

- Development-only setup. No production build config (no minification, no production server).
- No Docker, no CI pipeline, no deployment scripts.

---

## 5. Obvious Issues and Outdated Patterns

### Critical Bug

1. **`voting-server/src/core.js` lines 12-15 — Tie-breaking logic is broken**
   ```javascript
   if (aVotes > bVotes) return [a];
   else if (aVotes > bVotes)
     return [b]; // BUG: should be aVotes < bVotes
   else return [a, b];
   ```
   The second condition repeats `aVotes > bVotes` instead of `aVotes < bVotes`. This means: when A has more votes, A wins (correct); when B has more votes, it falls through to the "tie" branch (incorrect — both are returned as if tied). This makes the voting system fundamentally broken for non-tied outcomes where B is the winner.

### Outdated / Deprecated Packages

2. **React 15.1.0** — 10+ major versions behind (React 19 is current). Uses `React.createClass`, string refs, and mixins, all removed in modern React.
3. **react-router 2.x** — API is completely different from modern v6/v7 (uses `<Route component={}>` with `hashHistory`).
4. **Webpack 1.x** — The config format (loaders vs rules, `module.loaders` vs `module.rules`, string loader syntax like `'react-hot!babel'`) is obsolete.
5. **socket.io 1.4.6** — 3+ major versions behind; API has changed significantly.
6. **babel-preset-es2015** — Deprecated in favor of `@babel/preset-env`. Babel 6 is EOL.
7. **react-addons-pure-render-mixin** — React 15.3+ deprecated addons; `React.PureComponent` replaced this mixin.
8. **mocha 2.x** — Outdated; `--compilers` flag is deprecated.
9. **jsdom 9.x** — Very outdated; API has changed completely (jsdom 9 uses `jsdom.jsdom()`, modern jsdom uses `new JSDOM()`).
10. **react-hot-loader 1.x** — Replaced by v3 then by React Fast Refresh.

### Architecture / Design Issues

11. **No production build** — No webpack production config, no server for static files, no environment separation.
12. **Client connects directly to `localhost:8090`** — Hardcoded; no configuration mechanism (no env vars, no config file).
13. **Client reducer field naming mismatch** — Client reducer test (`voting-client/test/reducer_spec.js`) expects `hasVoted` at the top level of state, but the reducer (`voting-client/src/reducer.js`) stores it as `myVote.entry`. The VotingContainer reads `state.getIn(['myVote', 'entry'])`. This is inconsistent — the test and actual code use different paths (`hasVoted` vs `myVote.entry`).
14. **No authentication or session management** — Any connected client can dispatch any action, including `NEXT` (advancing rounds).
15. **State broadcast on every change** — Entire tree sent on each `store.subscribe` tick; no diffing or throttling.
16. **`.gitignore` only ignores `node_modules/`** — No `dist/` or `bundle.js` exclusion. The bundled output is committed.
17. **No lock files** — No `package-lock.json` or `yarn.lock` in either sub-project.

### Minor / Style

18. **Missing semicolons** — Mixed semicolon usage throughout (some lines have them, some don't).
19. **Comment referencing `hasVoted`** — `voting-client/src/reducer.js` has a function comment that doesn't match the actual field name (`myVote`).
20. **Hardcoded port 8090** in both client and server — No configurability.
21. **`babel-node` for server** — Not recommended for production; the Babel docs warn it's heavy and meant for development.

---

## Key Files for Remediation

| Priority               | File                                                                   | Issue                                                                          |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **P0 (Bug)**           | `voting-server/src/core.js:12-15`                                      | `getWinners` tie-breaking logic is broken: `aVotes > bVotes` used twice        |
| **P1 (Inconsistency)** | `voting-client/src/reducer.js` vs `voting-client/test/reducer_spec.js` | Client state uses `myVote` but tests reference `hasVoted`                      |
| **P2 (Obsolete)**      | Both `package.json` files                                              | All dependencies are 8-10 years out of date                                    |
| **P2 (Obsolete)**      | `voting-client/webpack.config.js`                                      | Webpack 1.x config format                                                      |
| **P2 (Obsolete)**      | All `.jsx` files                                                       | `React.createClass`, mixins, string refs — needs functional components + hooks |

## Test Suite Summary

### Server (13 tests total)

- `core_spec.js`: 7 tests — setEntries (2), next (4), vote (3)
- `reducer_spec.js`: 5 tests — SET_ENTRIES, NEXT, VOTE, initial state, reduce composition
- `store_spec.js`: 1 test — store is a Redux store with correct reducer

### Client (9 tests total)

- `reducer_spec.js`: 6 tests — SET_STATE (3), VOTE (2), hasVoted removal on round change (1)
- `Voting_spec.jsx`: 6 tests — click, disable, label, winner rendering, pure component behavior, prop updates
- `Results_spec.jsx`: 3 tests — vote counts, next callback, winner rendering
