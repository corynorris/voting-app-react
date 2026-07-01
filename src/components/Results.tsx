import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { NEXT } from "../reducer";
import { Winner } from "./Winner";

export function Results() {
  const winner = useSelector((s: RootState) => s.voting.winner);
  const pair = useSelector((s: RootState) => s.voting.vote?.pair);
  const tally = useSelector((s: RootState) => s.voting.vote?.tally);
  const dispatch = useDispatch<AppDispatch>();

  if (winner) {
    return <Winner winner={winner} onRestart={() => window.location.reload()} />;
  }

  if (!pair || !tally) {
    return <div className="loading">No results yet...</div>;
  }

  return (
    <div className="results">
      <div className="tally">
        {pair.map((entry) => (
          <div key={entry} className="entry">
            <h1>{entry}</h1>
            <div className="voteCount">{tally[entry] ?? 0}</div>
          </div>
        ))}
      </div>
      <div className="management">
        <button className="next" onClick={() => dispatch(NEXT())}>
          Next
        </button>
      </div>
    </div>
  );
}
