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
    return (
      <Winner winner={winner} onRestart={() => window.location.reload()} />
    );
  }

  if (!pair || !tally) {
    return <div className="loading">No results yet...</div>;
  }

  return (
    <div className="results">
      <h2>Current Standings</h2>
      <div className="tally">
        <div className="entry pair-a">
          <h1>{pair[0]}</h1>
          <div className="voteCount">{tally[pair[0]] ?? 0}</div>
        </div>
        <div className="entry pair-b">
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
