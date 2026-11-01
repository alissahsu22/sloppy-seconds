import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { App } from "./App";
import "./styles/global.css";
import "./styles/sanctuary.css";
import "./styles/story.css";
import "./styles/toodles.css";
import "./styles/character-slider.css";

gsap.registerPlugin(useGSAP);

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
