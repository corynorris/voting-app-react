import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { VOTE, NEXT, CREATE_TOURNAMENT } from "../reducer";
import { Winner } from "./Winner";
import { useState, useEffect, useRef } from "react";
import { useCountdown } from "./useCountdown";
import { Bracket } from "./Bracket";
import { playSound } from "../sounds";

export function Voting() {
	const state = useSelector((s: RootState) => s.voting);
	const dispatch = useDispatch<AppDispatch>();

	// Always call hooks, even when state is null
	const remaining = useCountdown(
		state?.matchStartedAt ?? 0,
		state?.timerSeconds ?? 0,
	);

	// ── Sound Effects ──
	const prevMatchRef = useRef<string | null>(null);
	const prevWinnerRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!state) return;
		const matchKey = `${state.currentRound}-${state.currentMatch}`;
		const prevKey = prevMatchRef.current;

		// Match just advanced (new match)
		if (prevKey !== null && prevKey !== matchKey) {
			playSound("next");
		}

		// Tournament just completed
		if (state.winner && !prevWinnerRef.current) {
			playSound("winner");
		}

		prevMatchRef.current = matchKey;
		prevWinnerRef.current = state.winner;
	}, [state?.currentRound, state?.currentMatch, state?.winner]);

	// Vote sound — detect score changes
	const prevScoresRef = useRef<string>("");
	useEffect(() => {
		if (!state) return;
		const round = state.rounds[state.currentRound];
		const match = round?.[state.currentMatch];
		if (!match) return;
		const scoresKey = `${match.scoreA}-${match.scoreB}`;
		if (
			prevScoresRef.current &&
			scoresKey !== prevScoresRef.current &&
			scoresKey !== "0-0"
		) {
			playSound("vote");
		}
		prevScoresRef.current = scoresKey;
	}, [state]);

	// Timer tick sound in last 5 seconds
	useEffect(() => {
		if (
			remaining > 0 &&
			remaining <= 5 &&
			Math.abs(remaining - Math.round(remaining)) < 0.15
		) {
			playSound("tick");
		}
	}, [Math.round(remaining)]);

	// No tournament created yet — show lobby
	if (!state) {
		return <Lobby dispatch={dispatch} />;
	}

	const { winner, rounds, currentRound, currentMatch } = state;

	// Tournament complete
	if (winner) {
		return (
			<div className="app-layout">
				<Winner winner={winner} onRestart={() => window.location.reload()} />
				<Bracket state={state} />
			</div>
		);
	}

	// Get current match
	const round = rounds[currentRound];
	if (!round || currentMatch >= round.length) {
		return (
			<div className="app-layout">
				<div className="loading">Loading...</div>
				<Bracket state={state} />
			</div>
		);
	}

	const match = round[currentMatch];
	if (!match || !match.entryA) {
		return (
			<div className="app-layout">
				<div className="loading">Loading...</div>
				<Bracket state={state} />
			</div>
		);
	}

	const hasVotes = match.scoreA > 0 || match.scoreB > 0 || match.decided;

	const mainView =
		match.decided || hasVotes ? (
			<ResultsView
				match={match}
				round={currentRound}
				matchIndex={currentMatch}
				totalRounds={rounds.length}
				remaining={remaining}
				onNext={() => dispatch(NEXT())}
			/>
		) : (
			<VoteView
				entryA={match.entryA}
				entryB={match.entryB}
				round={currentRound}
				totalRounds={rounds.length}
				remaining={remaining}
				onVote={(entry: string) => dispatch(VOTE({ entry }))}
			/>
		);

	return (
		<div className="app-layout">
			{mainView}
			<Bracket state={state} />
		</div>
	);
}

// ── Lobby Component ──

function Lobby({ dispatch }: { dispatch: AppDispatch }) {
	const [name, setName] = useState("");
	const [entryText, setEntryText] = useState("");
	const [timerSec, setTimerSec] = useState(30);

	const handleStart = () => {
		const entries = entryText
			.split("\n")
			.map((e) => e.trim())
			.filter(Boolean);
		if (entries.length >= 2 && name.trim()) {
			dispatch(
				CREATE_TOURNAMENT({
					name: name.trim(),
					entries,
					timerSeconds: timerSec,
				}),
			);
		}
	};

	return (
		<div className="lobby">
			<h1>🎯 Create Tournament</h1>
			<div className="lobby-form">
				<label htmlFor="tournament-name">Tournament Name</label>
				<input
					id="tournament-name"
					type="text"
					placeholder="e.g. Best Danny Boyle Film"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<label htmlFor="tournament-entries">
					Entries (one per line, min 2)
				</label>
				<textarea
					id="tournament-entries"
					rows={8}
					placeholder={"Shallow Grave\nTrainspotting\n28 Days Later\n..."}
					value={entryText}
					onChange={(e) => setEntryText(e.target.value)}
				/>
				<label htmlFor="tournament-timer">
					Timer per match (seconds, 0 = disabled)
				</label>
				<input
					id="tournament-timer"
					type="number"
					min={0}
					max={300}
					value={timerSec}
					onChange={(e) => setTimerSec(Number(e.target.value) || 0)}
				/>
				<button
					className="start-btn"
					disabled={
						!name.trim() || entryText.split("\n").filter(Boolean).length < 2
					}
					onClick={handleStart}
				>
					Start Tournament
				</button>
			</div>
		</div>
	);
}

// ── Timer Display ──

function TimerBar({ remaining }: { remaining: number }) {
	if (remaining < 0) return null;

	const seconds = Math.ceil(remaining);
	const isUrgent = seconds <= 5;

	return (
		<div className={`timer-bar${isUrgent ? " urgent" : ""}`}>
			<div
				className="timer-bar-fill"
				style={{ width: `${(remaining / 30) * 100}%` }}
			/>
			<span className="timer-text">{seconds}s</span>
		</div>
	);
}

// ── Vote View ──

function VoteView({
	entryA,
	entryB,
	round,
	totalRounds,
	remaining,
	onVote,
}: {
	entryA: string;
	entryB: string | null;
	round: number;
	totalRounds: number;
	remaining: number;
	onVote: (entry: string) => void;
}) {
	// Bye — shouldn't normally show in vote view, but handle gracefully
	if (!entryB) {
		return (
			<div className="voting">
				<h2>Bye Round</h2>
				<p>{entryA} advances automatically!</p>
			</div>
		);
	}

	return (
		<div className="voting">
			<div className="round-indicator">
				Round {round + 1} of {totalRounds}
			</div>
			<TimerBar remaining={remaining} />
			<h2>Choose your favorite</h2>
			<div className="vote-pair">
				<button className="vote-btn pair-a" onClick={() => onVote(entryA)}>
					<h1>{entryA}</h1>
				</button>
				<button className="vote-btn pair-b" onClick={() => onVote(entryB)}>
					<h1>{entryB}</h1>
				</button>
			</div>
		</div>
	);
}

// ── Results View ──

function ResultsView({
	match,
	round,
	matchIndex,
	totalRounds,
	remaining,
	onNext,
}: {
	match: {
		entryA: string;
		entryB: string | null;
		scoreA: number;
		scoreB: number;
		decided: boolean;
		winner?: string;
	};
	round: number;
	matchIndex: number;
	totalRounds: number;
	remaining: number;
	onNext: () => void;
}) {
	const isBye = match.entryB === null;
	const winner = match.winner;

	return (
		<div className="results">
			<div className="round-indicator">
				Round {round + 1} of {totalRounds}
				{matchIndex > 0 && ` — Match ${matchIndex + 1}`}
			</div>
			<TimerBar remaining={remaining} />
			{isBye ? (
				<div className="bye-notice">
					<p>
						<strong>{match.entryA}</strong> gets a bye and advances
						automatically!
					</p>
				</div>
			) : (
				<>
					<h2>Current Standings</h2>
					<div className="tally">
						<div
							className={`entry pair-a${winner === match.entryA ? " winner" : ""}`}
						>
							<h1>{match.entryA}</h1>
							<div className="voteCount">{match.scoreA}</div>
							{winner === match.entryA && (
								<div className="winner-tag">Winner!</div>
							)}
						</div>
						<div
							className={`entry pair-b${winner === match.entryB ? " winner" : ""}`}
						>
							<h1>{match.entryB}</h1>
							<div className="voteCount">{match.scoreB}</div>
							{winner === match.entryB && (
								<div className="winner-tag">Winner!</div>
							)}
						</div>
					</div>
				</>
			)}
			<div className="management">
				<button className="next" onClick={onNext}>
					{match.decided ? "Next Match →" : "Decide & Next →"}
				</button>
			</div>
		</div>
	);
}
