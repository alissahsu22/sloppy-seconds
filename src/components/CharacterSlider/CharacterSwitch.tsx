import { useEffect, useState, type KeyboardEvent } from "react";

function Chevron({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "5,1 2,4 5,7" : "3,1 6,4 3,7";
  return (
    <svg viewBox="0 0 8 8" width="14" height="14" aria-hidden="true" shapeRendering="crispEdges">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

const NAME_SWAP_MS = 360;

/** Arrows and a name. The hero keeps its play button; the game shows only this. */
export function CharacterSwitch({
  name,
  tone,
  canStep,
  reduced = false,
  onStep,
}: {
  name: string;
  tone: "hero" | "game";
  canStep: boolean;
  reduced?: boolean;
  onStep: (delta: -1 | 1) => void;
}) {
  const [leaving, setLeaving] = useState<string | null>(null);
  const [swap, setSwap] = useState(0);

  useEffect(() => {
    if (swap === 0) return;
    const timer = window.setTimeout(() => setLeaving(null), NAME_SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [swap]);

  const step = (delta: -1 | 1) => {
    if (!reduced) {
      setLeaving(name);
      setSwap((count) => count + 1);
    }
    onStep(delta);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!canStep || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    event.stopPropagation();
    step(event.key === "ArrowLeft" ? -1 : 1);
  };

  const departing = leaving && leaving !== name ? leaving : null;

  return (
    <div className="character-switch" data-tone={tone} role="group" aria-label="Choose an animal" onKeyDown={onKeyDown}>
      <button
        type="button"
        className="character-switch-arrow"
        aria-label="Previous animal"
        disabled={!canStep}
        onClick={() => step(-1)}
      >
        <Chevron direction="left" />
      </button>
      <span className="character-switch-name-slot">
        {departing ? (
          <p className="character-switch-name" data-phase="out" aria-hidden="true">
            {departing}
          </p>
        ) : null}
        <p className="character-switch-name" data-phase={departing ? "in" : undefined} aria-live="polite">
          {name}
        </p>
      </span>
      <button
        type="button"
        className="character-switch-arrow"
        aria-label="Next animal"
        disabled={!canStep}
        onClick={() => step(1)}
      >
        <Chevron direction="right" />
      </button>
    </div>
  );
}
