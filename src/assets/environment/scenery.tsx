import type { CrackStage } from "../../model/types";

/** Provisional planks. Replace the SVG; keep `stage` — the game already computes it. */
export function PlatformArt({ stage }: { stage: CrackStage }) {
  return (
    <svg className="plank" viewBox="0 0 200 36" preserveAspectRatio="none" aria-hidden="true">
      <rect x="1" y="4" width="198" height="26" fill="var(--color-ink)" />
      <path d="M14 14h28M48 22h40M110 13h34" stroke="var(--color-surface)" strokeWidth="2" fill="none" strokeLinecap="square" />
      <g className="cracks" data-stage={stage}>
        <path className="crack hair" d="M78 4c6 8-8 12 2 26" />
        <path className="crack major" d="M124 2c-12 10 16 8-2 28" />
        <path className="crack major" d="M52 6c8 8 0 12 12 22" />
        <path className="crack break" d="M100 0c-4 12 10 10-8 34" />
      </g>
    </svg>
  );
}
