interface WinnerProps {
  winner: string;
  onRestart: () => void;
}

export function Winner({ winner, onRestart }: WinnerProps) {
  return (
    <div className="winner" style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>🏆 Winner is {winner}! 🏆</h1>
      <button
        onClick={onRestart}
        style={{ marginTop: "20px", padding: "10px 30px", fontSize: "1em" }}
      >
        Restart
      </button>
    </div>
  );
}
