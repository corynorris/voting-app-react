import { Provider } from "react-redux";
import { store } from "./store";
import { Voting } from "./components/Voting";
import { ThemeToggle } from "./components/ThemeToggle";

export default function App() {
  return (
    <Provider store={store}>
      <ThemeToggle />
      <Voting />
    </Provider>
  );
}
