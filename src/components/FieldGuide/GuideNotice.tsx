import { useEffect, useState } from "react";
import { WilburSprite } from "../../assets/pig/WilburSprite";

const DISMISS_MS = 8000;

export function GuideNotice({
  reduced,
  onView,
  onDismiss,
}: {
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
        <WilburSprite pose="idle" playing={false} reduced={reduced} />
      </span>
      <p>Wilbur added to your Field Guide</p>
      <button type="button" className="guide-notice-view" onClick={onView}>
        View entry
      </button>
      <button type="button" className="guide-notice-dismiss" aria-label="Dismiss notification" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
