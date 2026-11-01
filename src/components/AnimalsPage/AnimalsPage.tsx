import { useEffect, useState } from "react";
import { WilburSprite } from "../../assets/pig/WilburSprite";
import { cdnSrcSet, crew, crewHeading, crewHeroCaption, crewHeroImage, crewRows } from "../../content/crew";
import { fieldGuideButtonLabel } from "../../content/fieldGuide";
import { site } from "../../content/site";
import { SplitText } from "../SplitText/SplitText";
import type { Phase } from "../../App";

/** The crew heading. The ending's "meet the other animals" scrolls here. */
export const CREW_ANCHOR = "animals";

/**
 * Drawn widths for the card photos, by row length. The crop scales each photo 1.2×,
 * so these run a fifth wider than the card itself.
 */
const PHOTO_SIZES: Record<number, string> = {
  3: "(max-width: 600px) 120vw, (max-width: 960px) 60vw, 384px",
  2: "(max-width: 600px) 120vw, (max-width: 1084px) 60vw, 600px",
};

/** The one card with a game. The hero teaser opens the same story. */
const GAME_ID = crew.find((animal) => animal.game)?.id;

const NAV = [
  { label: "About", href: "https://www.sloppysecondsinc.org/" },
  { label: "Our Animals", href: "#top", current: true },
  { label: "Ways to Help", href: "https://www.sloppysecondsinc.org/ways-to-help" },
  { label: "Resources", href: "https://www.sloppysecondsinc.org/resources" },
  { label: "Contact Us", href: "https://www.sloppysecondsinc.org/contact" },
] as const;

const FOOTER_NAV = [
  { label: "About", href: "https://www.sloppysecondsinc.org/home" },
  { label: "Our Animals", href: "#top" },
  { label: "Ways to Help", href: "https://www.sloppysecondsinc.org/ways-to-help" },
  { label: "Resources", href: "https://www.sloppysecondsinc.org/resources" },
  { label: "Contact Us", href: "https://www.sloppysecondsinc.org/contact" },
  { label: "Donate", href: "https://www.sloppysecondsinc.org/ways-to-help" },
] as const;

function SiteHeader() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header${solid ? " is-solid" : ""}${open ? " is-open" : ""}`}>
      <div className="site-header-inner">
        <p className="site-title">
          <a href="#top" onClick={() => setOpen(false)}>
            Sloppy Seconds, Inc
          </a>
        </p>
        <div className="site-header-tools">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span className="nav-toggle-bars" aria-hidden="true" />
          </button>
          <nav id="site-nav" className="site-nav" aria-label="Primary">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-current={"current" in item && item.current ? "page" : undefined}
                onClick={() => setOpen(false)}
                {...(item.href.startsWith("http") ? { rel: "noreferrer" } : {})}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

/** Floats in the bottom right corner so the guide stays one tap away while scrolling. */
function GuideButton({ count, onOpenGuide }: { count: number; onOpenGuide: (opener: HTMLButtonElement) => void }) {
  const label = fieldGuideButtonLabel(count);
  return (
    <button
      type="button"
      className="guide-button"
      aria-haspopup="dialog"
      aria-label={label}
      title={label}
      onClick={(event) => onOpenGuide(event.currentTarget)}
    >
      <svg className="guide-button-icon" viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
        <path d="M2 3h5v1h1V3h6v10H9v1H7v-1H2z" fill="currentColor" />
        <path d="M3 4h4v8H3zM9 4h4v8H9z" fill="var(--guide-page)" />
        <path d="M4 6h2v1H4zM4 8h2v1H4zM10 6h2v1h-2zM10 8h2v1h-2z" fill="currentColor" />
      </svg>
      {count > 0 ? (
        <span className="guide-button-count" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function CrewTitle() {
  return (
    <h1 className="crew-title" id={CREW_ANCHOR} data-strain="heading">
      <span className="sr-only">{crewHeading}</span>
      <SplitText text={crewHeading} hanger={{ word: "sanctuary", character: "y" }} />
    </h1>
  );
}

interface PlayProps {
  reduced: boolean;
  activeId: string | null;
  phase: Phase;
  playedIds: readonly string[];
  guideCount: number;
  onPlay: (id: string, opener: HTMLButtonElement) => void;
  onOpenGuide: (opener: HTMLButtonElement) => void;
}

function StoryLaunch({
  name,
  reduced,
  played,
  onPlay,
}: {
  name: string;
  reduced: boolean;
  played: boolean;
  onPlay: (opener: HTMLButtonElement) => void;
}) {
  const [hops, setHops] = useState(0);
  const hop = () => {
    if (!reduced) setHops((count) => count + 1);
  };

  return (
    <div className="story-launch" onMouseEnter={hop} onFocus={hop}>
      <span className="story-launch-pig" aria-hidden="true">
        <span className="story-launch-hop" key={hops} data-hop={hops > 0 ? "" : undefined}>
          <WilburSprite pose="idle" playing={false} reduced={reduced} />
        </span>
      </span>
      <div className="story-launch-actions">
        <button
          type="button"
          className="btn btn-secondary story-launch-button"
          aria-haspopup="dialog"
          onClick={(event) => onPlay(event.currentTarget)}
        >
          {`Play ${name}'s story`}
        </button>
        {played ? <span className="status-label story-played">{site.played}</span> : null}
      </div>
    </div>
  );
}

function Profiles({ reduced, activeId, phase, playedIds, onPlay }: PlayProps) {
  const byId = new Map(crew.map((animal) => [animal.id, animal]));
  return (
    <div className="profiles">
      {crewRows.map((row) => (
        <div className="profile-row" data-cols={String(row.length)} key={row.join("-")}>
          {row.map((id) => {
            const animal = byId.get(id);
            if (!animal) return null;
            const playing = activeId === animal.id;
            const straining = playing && (phase === "playing" || phase === "collapsing");
            const played = playedIds.includes(animal.id);
            return (
              <article className="profile" key={animal.id} id={animal.id}>
                <div className="profile-photo">
                  <div
                    className="profile-crop"
                    {...(animal.imagePosition ? { style: { transformOrigin: animal.imagePosition } } : {})}
                  >
                    <img
                      src={animal.image}
                      srcSet={cdnSrcSet(animal.image, animal.imageWidth)}
                      sizes={PHOTO_SIZES[row.length] ?? PHOTO_SIZES[2]}
                      alt={animal.alt}
                      loading="lazy"
                      decoding="async"
                      {...(straining ? { "data-strain": "photo" } : {})}
                    />
                  </div>
                  {animal.game ? (
                    <StoryLaunch
                      name={animal.name}
                      reduced={reduced}
                      played={played}
                      onPlay={(opener) => onPlay(animal.id, opener)}
                    />
                  ) : null}
                </div>
                <p className="profile-name" {...(straining ? { "data-strain": "heading" } : {})}>
                  {straining ? (
                    <>
                      <strong className="sr-only">{animal.name}</strong>
                      <SplitText text={animal.name} />
                    </>
                  ) : (
                    <strong>{animal.name}</strong>
                  )}
                </p>
                {animal.paragraphs.map((paragraph, index) => (
                  <p key={`${animal.id}-${index}`}>{paragraph}</p>
                ))}
              </article>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Puts the game above the fold. Without it, the only way in is a card a screen below the hero. */
function HeroPlay({
  reduced,
  played,
  onPlay,
}: {
  reduced: boolean;
  played: boolean;
  onPlay: (opener: HTMLButtonElement) => void;
}) {
  return (
    <div className="hero-play">
      <span className="hero-play-pig" aria-hidden="true">
        <WilburSprite pose="idle" playing={!reduced} reduced={reduced} />
      </span>
      <button
        type="button"
        className="btn btn-secondary hero-play-button"
        aria-haspopup="dialog"
        onClick={(event) => onPlay(event.currentTarget)}
      >
        {played ? site.heroReplay : site.heroPlay}
      </button>
      <p className="hero-play-note">{site.heroPlayNote}</p>
    </div>
  );
}

export function AnimalsPage(props: PlayProps) {
  const { reduced, guideCount, onOpenGuide, onPlay, playedIds } = props;
  return (
    <>
      <SiteHeader />
      <GuideButton count={guideCount} onOpenGuide={onOpenGuide} />
      <section className="crew-hero" aria-label={crewHeroCaption}>
        <img src={crewHeroImage} alt="" fetchPriority="high" />
        <div className="crew-hero-shade" aria-hidden="true" />
        <div className="crew-hero-content">
          <p className="crew-hero-caption">
            <strong>{crewHeroCaption}</strong>
          </p>
          {GAME_ID ? (
            <HeroPlay
              reduced={reduced}
              played={playedIds.includes(GAME_ID)}
              onPlay={(opener) => onPlay(GAME_ID, opener)}
            />
          ) : null}
        </div>
      </section>
      <main className="animals-main">
        <CrewTitle />
        <Profiles {...props} />
        <p className="find-us">
          <strong>Find us on:</strong>{" "}
          <a href="https://www.facebook.com/sloppysecondsinc/" rel="noreferrer">
            Facebook
          </a>
          {"  "}
          <a href="https://www.instagram.com/sloppyseconds_inc/?hl=en" rel="noreferrer">
            Instagram
          </a>
          {"  "}
          <a href="https://twitter.com/sloppy2ndsinc?lang=en" rel="noreferrer">
            Twitter
          </a>
        </p>
      </main>
      <footer className="site-footer">
        <p className="footer-nav">
          {FOOTER_NAV.map((item, index) => (
            <span key={item.label}>
              {index > 0 ? " | " : null}
              <a href={item.href} {...(item.href.startsWith("http") ? { rel: "noreferrer" } : {})}>
                {item.label}
              </a>
            </span>
          ))}
        </p>
        <p className="footer-copy">© 2018 Sloppy Seconds</p>
        <p>
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
            }}
          >
            Back to Top
          </a>
        </p>
      </footer>
    </>
  );
}
