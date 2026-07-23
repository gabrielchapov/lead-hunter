import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./styles/tokens.css";
import "./styles/app.css";
// Explicit extension: an old App.jsx placeholder still sits alongside
// App.tsx (this environment can't delete files) and a bare "./App"
// import resolves to the .jsx one instead. See App.jsx's comment.
import App from "./App.tsx";

const el = document.getElementById("root");
if (!el) throw new Error("#root element not found");

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>
);
