import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Provider } from "@/components/ui/provider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider defaultTheme="light">
    <App />
  </Provider>
);
