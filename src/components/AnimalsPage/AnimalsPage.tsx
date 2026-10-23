import { useEffect, useState } from "react";
import { WilburSprite } from "../../assets/pig/WilburSprite";
import { crew, crewHeading, crewHeroCaption, crewHeroImage, crewRows } from "../../content/crew";
import { fieldGuideButtonLabel } from "../../content/fieldGuide";
import { site } from "../../content/site";
import type { Phase } from "../../App";

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

function SiteHeader({
  guideLabel,
  onOpenGuide,
}: {
  guideLabel: string;
  onOpenGuide: (opener: HTMLButtonElement) => void;
}) {
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
            className="guide-button"
            aria-haspopup="dialog"
            onClick={(event) => onOpenGuide(event.currentTarget)}
          >
            {guideLabel}
          </button>
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

function SplitText({
  text,
  hangLast = false,
  hangerWord,
}: {
  text: string;
  hangLast?: boolean;
  hangerWord?: { word: string; character: string };
}) {
  const words = text.split(" ");
  const last = Array.from(text.replace(/ /g, "")).length - 1;
  let letterIndex = 0;
  return (
    <span aria-hidden="true" className="crew-title-art">
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`}>
          {wordIndex > 0 ? " " : null}
          <span className="crew-word">
            {Array.from(word).map((character) => {
              const index = letterIndex;
              letterIndex += 1;
              const hang = hangLast
                ? index === last
                : hangerWord?.word === word && hangerWord.character === character;
              return (
                <span
                  key={index}
                  className="crew-letter"
                  data-letter={index}
                  data-word={word.toLowerCase()}
                  {...(hang ? { "data-hanger": "1" } : {})}
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

function CrewTitle() {
  return (
    <h1 className="crew-title" data-strain="heading">
      <span className="sr-only">{crewHeading}</span>
      <SplitText text={crewHeading} hangerWord={{ word: "sanctuary", character: "y" }} />
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
  const [hot, setHot] = useState(false);
  return (
    <div
      className="story-launch"
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
    >
      <span className={`story-launch-pig${hot ? " is-hot" : ""}`} aria-hidden="true">
        <WilburSprite pose={hot ? "curious" : "idle"} playing={false} reduced={reduced} />
      </span>
      <button
        type="button"
        className="story-launch-button"
        aria-haspopup="dialog"
        onClick={(event) => onPlay(event.currentTarget)}
      >
        {`Play ${name}'s story`}
      </button>
      {played ? <span className="story-played">{site.played}</span> : null}
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
                      alt={animal.name}
                      {...(straining ? { "data-strain": "photo" } : {})}
                    />
                  </div>
                </div>
                {animal.game ? (
                  <StoryLaunch
                    name={animal.name}
                    reduced={reduced}
                    played={played}
                    onPlay={(opener) => onPlay(animal.id, opener)}
                  />
                ) : null}
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

export function AnimalsPage(props: PlayProps) {
  const { reduced, guideCount, onOpenGuide } = props;
  return (
    <>
      <SiteHeader guideLabel={fieldGuideButtonLabel(guideCount)} onOpenGuide={onOpenGuide} />
      <section className="crew-hero" aria-label={crewHeroCaption}>
        <img src={crewHeroImage} alt="" />
        <div className="crew-hero-shade" aria-hidden="true" />
        <p className="crew-hero-caption">
          <strong>{crewHeroCaption}</strong>
        </p>
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
