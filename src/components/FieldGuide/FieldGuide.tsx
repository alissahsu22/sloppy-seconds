import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimalSprite } from "../../animals/AnimalSprite";
import { StickerIcon } from "../Sticker/Sticker";
import type { Discovery } from "../../content/animals/types";
import { collectedFieldGuide, fieldGuideEntries, type FieldGuideEntry } from "../../content/fieldGuide";

/** Stickers the visitor picked up read in full. The rest stay as blank slots with a hint, so the roaming has a goal. */
function Finds({
  name,
  discoveries,
  foundIds,
}: {
  name: string;
  discoveries: readonly Discovery[];
  foundIds: readonly string[];
}) {
  if (discoveries.length === 0) return null;
  const found = discoveries.filter((item) => foundIds.includes(item.id));
  const left = discoveries.length - found.length;
  return (
    <section className="guide-finds">
      <h4>
        {`${name}’s stickers`}{" "}
        <span className="guide-finds-count">
          {found.length}/{discoveries.length}
        </span>
      </h4>
      <ul>
        {found.map((item) => (
          <li key={item.id} className="guide-find">
            <span className="guide-find-sticker">
              <StickerIcon art={item.sticker} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
        {Array.from({ length: left }, (_, index) => (
          <li key={`locked-${index}`} className="guide-find is-locked" aria-hidden="true">
            <span className="guide-find-sticker">?</span>
            <strong>???</strong>
          </li>
        ))}
      </ul>
      {left > 0 ? (
        <p className="guide-finds-hint">{`${left} more to collect. Learn about ${name} by finding stickers.`}</p>
      ) : null}
    </section>
  );
}

function GuideSprite({ entry, reduced }: { entry: FieldGuideEntry; reduced: boolean }) {
  return <AnimalSprite id={entry.portrait} pose="idle" playing={false} reduced={reduced} />;
}

function PageChevron({ direction }: { direction: "left" | "right" }) {
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

function pageFor(entries: readonly FieldGuideEntry[], id: string | null | undefined): number {
  if (!id) return 0;
  const index = entries.findIndex((entry) => entry.id === id);
  return index < 0 ? 0 : index;
}

export function FieldGuide({
  ids,
  focusId = null,
  foundIds,
  reduced,
  onBack,
}: {
  ids: readonly string[];
  /** Opens the book on this animal. Null starts at the first page. */
  focusId?: string | null;
  /** Discoveries the roaming pig has dug up so far. */
  foundIds: readonly string[];
  reduced: boolean;
  onBack: (() => void) | null;
}) {
  const entries = collectedFieldGuide(ids);
  const [page, setPage] = useState(() => pageFor(entries, focusId));
  const pageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const turned = useRef(false);
  const index = entries.length === 0 ? 0 : Math.min(page, entries.length - 1);
  const entry = entries[index];

  useEffect(() => {
    pageRef.current?.scrollTo({ top: 0 });
    if (!turned.current) return;
    headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  const turn = (delta: -1 | 1) => {
    setPage((current) => {
      const next = Math.min(entries.length - 1, Math.max(0, current + delta));
      if (next !== current) turned.current = true;
      return next;
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    turn(event.key === "ArrowLeft" ? -1 : 1);
  };

  return (
    <div className="guide-panel" onKeyDown={onKeyDown}>
      {onBack ? (
        <div className="guide-toolbar">
          <button type="button" className="btn btn-secondary guide-back" onClick={onBack}>
            Back to the ending
          </button>
        </div>
      ) : null}
      <div className="guide-page" ref={pageRef}>
        {entry ? (
          <article className="guide-entry" key={entry.id}>
            <header className="guide-entry-head">
              <h3 ref={headingRef} tabIndex={-1} data-autofocus="">
                {entry.name}
              </h3>
              <p className="guide-entry-tag">
                {`No. ${String(fieldGuideEntries.indexOf(entry) + 1).padStart(2, "0")} · ${entry.species}`}
              </p>
            </header>
            {/* Both columns flatten into one stack on narrow screens, so the order there comes from CSS. */}
            <div className="guide-main">
              <section className="guide-lesson">
                <h4>What you learned</h4>
                <p className="guide-lesson-statement">{entry.learned.statement}</p>
                <p className="guide-lesson-support">{entry.learned.support}</p>
              </section>
              <section className="guide-story">
                <h4>His story</h4>
                {entry.story.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>{paragraph}</p>
                ))}
              </section>
              <Finds name={entry.name} discoveries={entry.discoveries} foundIds={foundIds} />
            </div>
            <div className="guide-aside">
              <div className="guide-photo">
                <img src={entry.image} alt={entry.imageAlt} />
                <span className="guide-photo-pixel" aria-hidden="true">
                  <GuideSprite entry={entry} reduced={reduced} />
                </span>
              </div>
              {entry.personality ? (
                <section className="guide-personality">
                  <h4>Personality</h4>
                  <p>{entry.personality}</p>
                </section>
              ) : null}
            </div>
          </article>
        ) : (
          <div className="guide-empty" tabIndex={-1} data-autofocus="">
            <p>Your Field Guide is empty. Explore an animal’s story, and it will be kept here.</p>
          </div>
        )}
      </div>
      {entries.length > 0 ? (
        <nav className="guide-pager" aria-label="Field guide pages">
          <button
            type="button"
            className="guide-pager-arrow"
            aria-label="Previous page"
            disabled={index === 0}
            onClick={() => turn(-1)}
          >
            <PageChevron direction="left" />
          </button>
          <p className="guide-pager-count">
            {index + 1} <span className="guide-pager-of">of</span> {entries.length}
          </p>
          <button
            type="button"
            className="guide-pager-arrow"
            aria-label="Next page"
            disabled={index >= entries.length - 1}
            onClick={() => turn(1)}
          >
            <PageChevron direction="right" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
