import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initializeTheme } from "./theme/theme";
import "./theme/fonts.css";
import "./theme/tokens.css";
import "./theme/global.css";

initializeTheme();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
