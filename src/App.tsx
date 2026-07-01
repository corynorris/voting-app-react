import { Provider } from "react-redux";
import { store } from "./store";
import { Voting } from "./components/Voting";

export default function App() {
  return (
    <Provider store={store}>
      <Voting />
    </Provider>
  );
}
