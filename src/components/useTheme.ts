import { useState, useEffect, useCallback } from "react";

const KEY = "voting-app-theme";

/**
 * Theme hook: dark = Mocha (default), light = Macchiato.
 * Defaults to dark (Mocha) unless user has explicitly chosen light.
 */
export function useTheme(): [boolean, () => void] {
	const [dark, setDark] = useState(() => {
		const saved = localStorage.getItem(KEY);
		if (saved !== null) return saved !== "light";
		// Default to dark (Mocha) — no system preference check
		return true;
	});

	useEffect(() => {
		document.documentElement.setAttribute(
			"data-theme",
			dark ? "dark" : "light",
		);
		localStorage.setItem(KEY, dark ? "dark" : "light");
	}, [dark]);

	const toggle = useCallback(() => setDark((d) => !d), []);

	return [dark, toggle];
}
