import { useEffect, useState } from "react";
import { ToodlesSprite } from "../assets/pig/ToodlesSprite";
import { WilburSprite } from "../assets/pig/WilburSprite";
import { CharacterSwitch } from "../components/CharacterSlider/CharacterSwitch";
import type { StoryCharacter } from "../content/characters";
import { site } from "../content/site";

function HeroSprite({ sprite, reduced }: { sprite: StoryCharacter["sprite"]; reduced: boolean }) {
  if (sprite === "toodles") return <ToodlesSprite pose="idle" playing={!reduced} reduced={reduced} />;
  return <WilburSprite pose="idle" playing={!reduced} reduced={reduced} />;
}

/**
 * The in-flow story control for a Squarespace code block.
 * Character choice, the game, and the Field Guide. No site header or biography.
 */
export function StoryLauncher({
  character,
  reduced,
  played,
  canStep,
  onPlay,
  onStep,
  onOpenGuide,
}: {
  character: StoryCharacter;
  reduced: boolean;
  played: boolean;
  canStep: boolean;
  onPlay: (opener: HTMLButtonElement) => void;
  onStep: (delta: -1 | 1) => void;
  onOpenGuide: (opener: HTMLButtonElement) => void;
}) {
  const label = played ? site.heroReplay : site.heroPlay;
  const [outgoing, setOutgoing] = useState<StoryCharacter | null>(null);
  const [dir, setDir] = useState<-1 | 1>(1);
  const [swap, setSwap] = useState(0);

  useEffect(() => {
    if (swap === 0) return;
    const timer = window.setTimeout(() => setOutgoing(null), 620);
    return () => window.clearTimeout(timer);
  }, [swap]);

  const step = (delta: -1 | 1) => {
    if (!reduced) {
      setOutgoing(character);
      setDir(delta);
      setSwap((count) => count + 1);
    }
    onStep(delta);
  };

  const departing = outgoing && outgoing.id !== character.id ? outgoing : null;

  return (
    <div className="ss-launcher hero-play">
      <CharacterSwitch name={character.name} tone="game" canStep={canStep} reduced={reduced} onStep={step} />
      <span className="hero-play-pig" aria-hidden="true">
        {departing ? (
          <span className="hero-play-swap" data-phase="out" data-dir={dir}>
            <HeroSprite sprite={departing.sprite} reduced={reduced} />
          </span>
        ) : null}
        <span
          className="hero-play-swap"
          data-phase={departing ? "in" : undefined}
          data-dir={departing ? dir : undefined}
        >
          <HeroSprite sprite={character.sprite} reduced={reduced} />
        </span>
      </span>
      <button
        type="button"
        className="btn btn-secondary hero-play-button"
        aria-haspopup="dialog"
        aria-label={`${label}, ${character.name}`}
        onClick={(event) => onPlay(event.currentTarget)}
      >
        {label}
      </button>
      {played ? <span className="status-label story-played">{site.played}</span> : null}
      <p className="hero-play-note">{site.heroPlayNote}</p>
      <button
        type="button"
        className="link-button ss-launcher-guide"
        onClick={(event) => onOpenGuide(event.currentTarget)}
      >
        Field Guide
      </button>
    </div>
  );
}
