import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { VOTE, NEXT } from "../reducer";
import { Winner } from "./Winner";

export function Voting() {
  const winner = useSelector((s: RootState) => s.voting.winner);
  const pair = useSelector((s: RootState) => s.voting.vote?.pair);
  const tally = useSelector((s: RootState) => s.voting.vote?.tally);
  const dispatch = useDispatch<AppDispatch>();

  const handleRestart = () => {
    window.location.reload();
  };

  if (winner) {
    return <Winner winner={winner} onRestart={handleRestart} />;
  }

  if (!pair) {
    return <div className="loading">Loading...</div>;
  }

  return <VotePair pair={pair} tally={tally} dispatch={dispatch} />;
}

function VotePair({
  pair,
  tally,
  dispatch,
}: {
  pair: [string, string];
  tally: Record<string, number> | undefined;
  dispatch: AppDispatch;
}) {
  const hasVotes = tally !== undefined;

  if (hasVotes) {
    return (
      <div className="results">
        <div className="tally">
          <div className="entry">
            <h1>{pair[0]}</h1>
            <div className="voteCount">{tally[pair[0]] ?? 0}</div>
          </div>
          <div className="entry">
            <h1>{pair[1]}</h1>
            <div className="voteCount">{tally[pair[1]] ?? 0}</div>
          </div>
        </div>
        <div className="management">
          <button className="next" onClick={() => dispatch(NEXT())}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Vote buttons
  return (
    <div className="voting">
      {pair.map((entry) => (
        <button
          key={entry}
          onClick={() => dispatch(VOTE({ entry }))}
          style={{
            display: "block",
            margin: "10px auto",
            padding: "20px 40px",
            fontSize: "1.2em",
            cursor: "pointer",
          }}
        >
          <h1 style={{ margin: 0 }}>{entry}</h1>
        </button>
      ))}
    </div>
  );
}
