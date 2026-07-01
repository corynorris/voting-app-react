interface WinnerProps {
  winner: string;
  onRestart: () => void;
}

export function Winner({ winner, onRestart }: WinnerProps) {
  return (
    <div className="winner">
      <div className="winner-card">
        <span className="winner-trophy">🏆</span>
        <div className="winner-label">Winner</div>
        <div className="winner-badge pulse">{winner}</div>
        <button onClick={onRestart}>Start Over</button>
      </div>
    </div>
  );
}
