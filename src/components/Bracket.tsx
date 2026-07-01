import type { TournamentState } from "../types";

interface BracketProps {
  state: TournamentState;
}

/**
 * Full bracket visualization showing all matches across all rounds.
 * Highlights the current match and marks winners.
 */
export function Bracket({ state }: BracketProps) {
  const { rounds, currentRound, currentMatch, winner } = state;

  return (
    <div className="bracket-container">
      <h3 className="bracket-title">Tournament Bracket</h3>
      <div className="bracket-scroll">
        <div className="bracket-grid">
          {rounds.map((round, roundIdx) => {
            const isActiveRound = roundIdx === currentRound && !winner;
            return (
              <div
                key={roundIdx}
                className={`bracket-round${isActiveRound ? " active" : ""}`}
              >
                <div className="bracket-round-header">
                  {roundIdx === rounds.length - 1
                    ? "🏆 Final"
                    : `Round ${roundIdx + 1}`}
                </div>
                <div className="bracket-matches">
                  {round.map((match, matchIdx) => {
                    const isCurrent =
                      roundIdx === currentRound &&
                      matchIdx === currentMatch &&
                      !winner;
                    return (
                      <div
                        key={matchIdx}
                        className={`bracket-match${isCurrent ? " current" : ""}${match.decided ? " decided" : ""}`}
                      >
                        <div
                          className={`bracket-entry${match.winner === match.entryA ? " winner" : ""}`}
                        >
                          <span className="bracket-entry-name">
                            {match.entryA || "—"}
                          </span>
                          {match.decided && (
                            <span className="bracket-entry-score">
                              {match.entryB !== null ? match.scoreA : "bye"}
                            </span>
                          )}
                        </div>
                        {match.entryB !== null && (
                          <div
                            className={`bracket-entry${match.winner === match.entryB ? " winner" : ""}`}
                          >
                            <span className="bracket-entry-name">
                              {match.entryB || "—"}
                            </span>
                            {match.decided && (
                              <span className="bracket-entry-score">
                                {match.scoreB}
                              </span>
                            )}
                          </div>
                        )}
                        {match.entryB === null && match.decided && (
                          <div className="bracket-entry bye">Bye</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact progress view: shows the path from current match to the final.
 * Each line represents one entry's potential path through the bracket.
 */
export function ProgressBar({
  currentRound,
  totalRounds,
}: {
  currentRound: number;
  totalRounds: number;
}) {
  const pct = totalRounds > 0 ? ((currentRound) / totalRounds) * 100 : 0;

  return (
    <div className="tournament-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="progress-label">
        Round {currentRound + 1} of {totalRounds}
        {totalRounds > 0 && ` (${Math.round(pct)}%)`}
      </div>
    </div>
  );
}
