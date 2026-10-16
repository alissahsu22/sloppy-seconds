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
      <p className="kicker">{site.outside}</p>
      <h2>{site.endingTitle}</h2>
      <p className="thesis">{site.thesis}</p>
      <p className="ended-lead">{wilbur.endingLead}</p>
      <p className="pasture-hint">{site.pastureHint}</p>
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
