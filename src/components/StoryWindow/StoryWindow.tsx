import { useLayoutEffect, useRef, type ReactNode } from "react";

function SplitText({ text }: { text: string }) {
  const words = text.split(" ");
  let letterIndex = 0;
  let lastLetter = -1;
  words.forEach((word) => {
    Array.from(word).forEach((character, index) => {
      if (/[A-Za-z]/.test(character)) lastLetter = letterIndex + index;
    });
    letterIndex += Array.from(word).length;
  });
  letterIndex = 0;
  return (
    <span aria-hidden="true" className="crew-title-art">
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`}>
          {wordIndex > 0 ? " " : null}
          <span className="crew-word">
            {Array.from(word).map((character) => {
              const index = letterIndex;
              letterIndex += 1;
              return (
                <span
                  key={index}
                  className="crew-letter"
                  data-letter={index}
                  data-word={word.toLowerCase()}
                  {...(index === lastLetter ? { "data-hanger": "1" } : {})}
                >
                  {character}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </span>
  );
}

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
                  <SplitText text={title} />
                </>
              ) : (
                title
              )}
            </h2>
          </div>
          <button type="button" className="story-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="story-body">{children}</div>
      </div>
      {overlay}
    </dialog>
  );
}
