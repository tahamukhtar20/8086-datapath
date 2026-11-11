import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/base.css";
import "./styles/controls.css";
import "./styles/board.css";
import "./styles/editor.css";
import "./styles/panels.css";
import "./styles/dialog.css";
import "./styles/layout.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
