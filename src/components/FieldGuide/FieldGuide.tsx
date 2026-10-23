import { WilburSprite } from "../../assets/pig/WilburSprite";
import { collectedFieldGuide } from "../../content/fieldGuide";

export function FieldGuide({
  ids,
  reduced,
  onBack,
}: {
  ids: readonly string[];
  reduced: boolean;
  onBack: (() => void) | null;
}) {
  const entries = collectedFieldGuide(ids);

  return (
    <div className="guide-panel">
      {onBack ? (
        <button type="button" className="text-button guide-back" onClick={onBack}>
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
            <h3 tabIndex={-1} data-autofocus="">
              {entry.name}
            </h3>
            <div className="guide-portraits">
              <figure>
                <img src={entry.image} alt={`Photograph of ${entry.name}`} />
                <figcaption>Photograph</figcaption>
              </figure>
              <figure>
                <div className="guide-pixel-frame" aria-hidden="true">
                  <WilburSprite pose="idle" playing={false} reduced={reduced} />
                </div>
                <figcaption>Pixel portrait</figcaption>
              </figure>
            </div>
            <section>
              <h4>His story</h4>
              <p>{entry.story}</p>
            </section>
            <section>
              <h4>What you learned</h4>
              <p>{entry.learned}</p>
            </section>
            {entry.personality ? (
              <section>
                <h4>Personality</h4>
                <p>{entry.personality}</p>
              </section>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
