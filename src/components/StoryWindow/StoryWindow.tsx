import { useLayoutEffect, useRef, type ReactNode } from "react";
import { SplitText } from "../SplitText/SplitText";

/**
 * One modal window for Wilbur's game and the Field Guide.
 * Switching views replaces what is inside this dialog instead of opening another.
 */
export function StoryWindow({
  title,
  kicker,
  focusKey,
  scrollY,
  onClose,
  children,
  overlay,
}: {
  title: string;
  kicker?: string;
  focusKey: string;
  scrollY: number;
  onClose: () => void;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = "story-window-title";

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (!dialog.open) dialog.showModal();
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      if (dialog.open) dialog.close();
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    };
    // The lock matches the scroll position from the click that opened the window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    const target =
      dialog.querySelector<HTMLElement>("[data-autofocus]") ??
      dialog.querySelector<HTMLElement>("button") ??
      dialog;
    target.focus({ preventScroll: true });
  }, [focusKey]);

  return (
    <dialog
      ref={dialogRef}
      className="story-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="story-window"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="story-titlebar">
          <div className="story-title-copy">
            {kicker ? <p className="story-kicker">{kicker}</p> : null}
            <h2 id={titleId} {...(kicker ? { "data-strain": "heading" } : {})}>
              {kicker ? (
                <>
                  <span className="sr-only">{title}</span>
                  <SplitText text={title} hanger="last-letter" />
                </>
              ) : (
                title
              )}
            </h2>
          </div>
          <button type="button" className="icon-button story-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="story-body">{children}</div>
      </div>
      {overlay}
    </dialog>
  );
}
