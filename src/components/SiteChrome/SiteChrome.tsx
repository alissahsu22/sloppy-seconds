import { wilbur } from "../../content/animals/wilbur";
import { site } from "../../content/site";

export function EndedCard({
  hidden,
  inert,
  onReplay,
  onMeet,
}: {
  hidden: boolean;
  inert: boolean;
  onReplay: () => void;
  onMeet: () => void;
}) {
  return (
    <section className="ended" hidden={hidden} aria-hidden={hidden} {...(inert ? { inert: true } : {})}>
      <h2 id="ending-title" tabIndex={-1} {...(hidden ? {} : { "data-autofocus": "" })}>
        {site.endingTitle}
      </h2>
      <p className="ended-lead">{wilbur.endingLead}</p>
      <div className="ended-actions">
        <a className="btn btn-primary ended-primary" href={site.helpHref} target="_blank" rel="noreferrer">
          {site.helpLabel}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <div className="ended-secondary">
          <button type="button" className="link-button" onClick={onMeet}>
            {site.sanctuaryLabel}
          </button>
          <button type="button" className="link-button" onClick={onReplay}>
            {site.replay}
          </button>
        </div>
      </div>
    </section>
  );
}
