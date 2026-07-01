import { Provider } from "react-redux";
import { store } from "./store";
import { Voting } from "./components/Voting";
import { Results } from "./components/Results";

export default function App() {
  return (
    <Provider store={store}>
      <Voting />
    </Provider>
  );
}
