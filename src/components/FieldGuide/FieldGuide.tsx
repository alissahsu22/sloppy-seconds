import { WilburSprite } from "../../assets/pig/WilburSprite";
import type { Discovery } from "../../content/animals/types";
import { collectedFieldGuide, fieldGuideEntries } from "../../content/fieldGuide";

/** Found discoveries read in full. The rest stay as locked slots with a hint, so the roaming has a goal. */
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
        Found in the pasture{" "}
        <span className="guide-finds-count">
          {found.length}/{discoveries.length}
        </span>
      </h4>
      <ul>
        {found.map((item) => (
          <li key={item.id} className="guide-find">
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </li>
        ))}
        {Array.from({ length: left }, (_, index) => (
          <li key={`locked-${index}`} className="guide-find is-locked" aria-hidden="true">
            <strong>???</strong>
          </li>
        ))}
      </ul>
      {left > 0 ? (
        <p className="guide-finds-hint">
          {`${left} more to find. Close this window and watch ${name} roam the page. He roots around for them on his own.`}
        </p>
      ) : null}
    </section>
  );
}

export function FieldGuide({
  ids,
  foundIds,
  reduced,
  onBack,
}: {
  ids: readonly string[];
  /** Discoveries the roaming pig has dug up so far. */
  foundIds: readonly string[];
  reduced: boolean;
  onBack: (() => void) | null;
}) {
  const entries = collectedFieldGuide(ids);

  return (
    <div className="guide-panel">
      {onBack ? (
        <button type="button" className="btn btn-secondary guide-back" onClick={onBack}>
          Back to the ending
        </button>
      ) : null}
      {entries.length === 0 ? (
        <div className="guide-empty" tabIndex={-1} data-autofocus="">
          <p>Your Field Guide is empty. Explore an animal’s story, and it will be kept here.</p>
        </div>
      ) : (
        entries.map((entry) => (
          <article className="guide-entry" key={entry.id}>
            <header className="guide-entry-head">
              <h3 tabIndex={-1} data-autofocus="">
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
                {entry.story.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </section>
              <Finds name={entry.name} discoveries={entry.discoveries} foundIds={foundIds} />
            </div>
            <div className="guide-aside">
              <div className="guide-photo">
                <img src={entry.image} alt={entry.imageAlt} />
                <span className="guide-photo-pixel" aria-hidden="true">
                  <WilburSprite pose="idle" playing={false} reduced={reduced} />
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
        ))
      )}
    </div>
  );
}
