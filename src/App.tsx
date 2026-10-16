import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { EscapeSequence } from "./animations/EscapeSequence";
import { GroundStrip } from "./components/GroundStrip/GroundStrip";
import { EndedCard } from "./components/SiteChrome/SiteChrome";
import { wilbur } from "./content/animals/wilbur";
import { site } from "./content/site";
import { PigJumpGame } from "./game/PigJumpGame/PigJumpGame";
import type { EscapePayload, GameHandle } from "./game/PigJumpGame/types";
import { usePersistentProgress } from "./hooks/usePersistentProgress";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { Pasture } from "./npc/Pasture";
import { clamp } from "./utils/math";

type Phase = "begin" | "playing" | "collapsing" | "roaming";

export function App() {
  const reduced = usePrefersReducedMotion();
  const { progress, unlock, rememberFind } = usePersistentProgress();
  const [phase, setPhase] = useState<Phase>("begin");
  const [escape, setEscape] = useState<EscapePayload | null>(null);
  const [runId, setRunId] = useState(0);
  const groundRef = useRef<HTMLElement>(null);
  const gameRef = useRef<GameHandle>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) gsap.globalTimeline.pause();
      else gsap.globalTimeline.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      gsap.globalTimeline.resume();
    };
  }, []);

  const replay = () => {
    setEscape(null);
    setRunId((value) => value + 1);
    setPhase("playing");
  };

  const meetWilbur = (x: number, facing: 1 | -1 = 1) => {
    unlock("wilbur", x, facing);
    setEscape(null);
    setPhase("roaming");
  };

  const skipToWilbur = () => meetWilbur(clamp(window.innerWidth * 0.46, 96, window.innerWidth - 96));

  return (
    <div className="page" data-motion={reduced ? "reduce" : "full"} data-phase={phase}>
      <div className="first-screen">
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="kicker">{site.kicker}</p>
              <h1>{site.title}</h1>
              {reduced ? <p className="reduced-note">{site.reduced}</p> : null}
            </div>
            <div className="stage-slot">
              <EndedCard hidden={phase !== "roaming"} inert={phase !== "roaming"} onReplay={replay} />
              {phase === "begin" || phase === "playing" || phase === "collapsing" ? (
                <PigJumpGame
                  key={runId}
                  ref={gameRef}
                  active={phase === "playing" || phase === "collapsing"}
                  reduced={reduced}
                  onStart={() => setPhase("playing")}
                  onCollapse={(payload) => {
                    setEscape(payload);
                    setPhase("collapsing");
                  }}
                />
              ) : null}
            </div>
            {phase === "begin" || phase === "playing" ? (
              <div className="skip-row">
                <button type="button" className="text-button" onClick={skipToWilbur}>
                  {site.skip}
                </button>
              </div>
            ) : null}
          </section>
        </main>
      </div>
      <GroundStrip ref={groundRef}>
        {phase === "roaming" ? (
          <Pasture
            animal={wilbur}
            found={progress.found}
            startX={progress.pigX ?? clamp(window.innerWidth * 0.46, 96, window.innerWidth - 96)}
            startFacing={progress.facing}
            visible
            reduced={reduced}
            holdState={null}
            onFind={rememberFind}
          />
        ) : null}
      </GroundStrip>
      {phase === "collapsing" && escape ? (
        <EscapeSequence
          payload={escape}
          ground={groundRef.current}
          reduced={reduced}
          onDone={(landing) => meetWilbur(landing.x, landing.facing)}
        />
      ) : null}
    </div>
  );
}
