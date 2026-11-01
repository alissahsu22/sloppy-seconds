import { site } from "../../content/site";

export function EndedCard({
  hidden,
  inert,
  onReplay,
  onMeet,
  title,
  lead,
  helpLabel,
  helpHref,
}: {
  hidden: boolean;
  inert: boolean;
  onReplay: () => void;
  onMeet: () => void;
  title: string;
  lead: string;
  helpLabel: string;
  helpHref: string;
}) {
  return (
    <section className="ended" hidden={hidden} aria-hidden={hidden} {...(inert ? { inert: true } : {})}>
      <h2 id="ending-title" tabIndex={-1} {...(hidden ? {} : { "data-autofocus": "" })}>
        {title}
      </h2>
      <p className="ended-lead">{lead}</p>
      <div className="ended-actions">
        <a className="btn btn-primary ended-primary" href={helpHref} target="_blank" rel="noreferrer">
          {helpLabel}
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
