import { useEffect, useState } from "react";
import { ToodlesSprite } from "../../assets/pig/ToodlesSprite";
import { WilburSprite } from "../../assets/pig/WilburSprite";
import type { SpriteId } from "../../game/variants/types";

const DISMISS_MS = 8000;

export function GuideNotice({
  name,
  sprite,
  reduced,
  onView,
  onDismiss,
}: {
  name: string;
  sprite: SpriteId;
  reduced: boolean;
  onView: () => void;
  onDismiss: () => void;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(onDismiss, DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, paused]);

  return (
    <div
      className="guide-notice"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="guide-notice-pig" aria-hidden="true">
        {sprite === "toodles" ? (
          <ToodlesSprite pose="idle" playing={false} reduced={reduced} />
        ) : (
          <WilburSprite pose="idle" playing={false} reduced={reduced} />
        )}
      </span>
      <p>{`${name} added to your Field Guide`}</p>
      <button type="button" className="btn btn-secondary guide-notice-view" onClick={onView}>
        View entry
      </button>
      <button
        type="button"
        className="icon-button guide-notice-dismiss"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}
