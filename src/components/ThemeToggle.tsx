import { useTheme } from "./useTheme";

export function ThemeToggle() {
	const [dark, toggle] = useTheme();

	return (
		<button
			className="theme-toggle"
			onClick={toggle}
			aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
			title={dark ? "Switch to light mode" : "Switch to dark mode"}
		>
			{dark ? "☀️" : "🌙"}
		</button>
	);
}
