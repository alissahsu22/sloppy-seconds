import { wilbur } from "../../content/animals/wilbur";
import { site } from "../../content/site";

export function EndedCard({
  hidden,
  inert,
  onReplay,
}: {
  hidden: boolean;
  inert: boolean;
  onReplay: () => void;
}) {
  return (
    <section className="ended" hidden={hidden} aria-hidden={hidden} {...(inert ? { inert: true } : {})}>
      <h2 id="ending-title" tabIndex={-1} {...(hidden ? {} : { "data-autofocus": "" })}>
        {site.endingTitle}
      </h2>
      <p className="ended-lead">{wilbur.endingLead}</p>
      <div className="ended-actions">
        <a className="ended-primary" href={site.sanctuaryUrl} target="_blank" rel="noreferrer">
          {site.sanctuaryLabel}
        </a>
        <button type="button" className="ended-replay" onClick={onReplay}>
          {site.replay}
        </button>
      </div>
    </section>
  );
}
