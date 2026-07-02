import { useState, useEffect } from "react";

/**
 * Returns remaining seconds for a match timer.
 * Returns -1 if timer is disabled (timerSeconds <= 0).
 */
export function useCountdown(
	matchStartedAt: number,
	timerSeconds: number,
): number {
	const [remaining, setRemaining] = useState(() => {
		if (timerSeconds <= 0) return -1;
		const elapsed = (Date.now() - matchStartedAt) / 1000;
		return Math.max(0, timerSeconds - elapsed);
	});

	useEffect(() => {
		if (timerSeconds <= 0) {
			setRemaining(-1);
			return;
		}

		// Reset when match changes
		const elapsed = (Date.now() - matchStartedAt) / 1000;
		setRemaining(Math.max(0, timerSeconds - elapsed));

		const interval = setInterval(() => {
			const e = (Date.now() - matchStartedAt) / 1000;
			const r = Math.max(0, timerSeconds - e);
			setRemaining(r);
			if (r <= 0) clearInterval(interval);
		}, 100);

		return () => clearInterval(interval);
	}, [matchStartedAt, timerSeconds]);

	return remaining;
}
