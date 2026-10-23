import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { EscapeSequence } from "./animations/EscapeSequence";
import { AnimalsPage } from "./components/AnimalsPage/AnimalsPage";
import { FieldGuide } from "./components/FieldGuide/FieldGuide";
import { GuideNotice } from "./components/FieldGuide/GuideNotice";
import { GroundStrip } from "./components/GroundStrip/GroundStrip";
import { EndedCard } from "./components/SiteChrome/SiteChrome";
import { StoryWindow } from "./components/StoryWindow/StoryWindow";
import { wilbur } from "./content/animals/wilbur";
import { collectedFieldGuide } from "./content/fieldGuide";
import { site } from "./content/site";
import { PigJumpGame } from "./game/PigJumpGame/PigJumpGame";
import type { EscapePayload, GameHandle } from "./game/PigJumpGame/types";
import { usePersistentProgress } from "./hooks/usePersistentProgress";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { Pasture } from "./npc/Pasture";
import { createPageReactions, type PageReactions } from "./page/reactions";
import { clamp } from "./utils/math";

/** Phase of Wilbur's game while its window is open. */
export type Phase = "begin" | "playing" | "collapsing" | "ended";

type DialogView = "game" | "guide";

export function App() {
  const reduced = usePrefersReducedMotion();
  const { progress, unlock, rememberFind } = usePersistentProgress();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("begin");
  const [roaming, setRoaming] = useState(false);
  const [escape, setEscape] = useState<EscapePayload | null>(null);
  const [runId, setRunId] = useState(0);
  const [dialog, setDialog] = useState<DialogView | null>(null);
  const [returnToEnding, setReturnToEnding] = useState(false);
  const [notice, setNotice] = useState(false);
  const groundRef = useRef<HTMLElement>(null);
  const gameRef = useRef<GameHandle>(null);
  const reactionsRef = useRef<PageReactions | null>(null);
  const collectedRef = useRef(progress.collectedIds);
  const openerRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef(0);
  const restoreArmed = useRef(false);
  collectedRef.current = progress.collectedIds;

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

  // Landings strain the card that is playing, not the whole page.
  useEffect(() => {
    if (!activeId) return;
    const root = document.getElementById(activeId);
    if (!root) return;
    const reactions = createPageReactions(root, reduced);
    reactionsRef.current = reactions;
    return () => {
      reactions.destroy();
      if (reactionsRef.current === reactions) reactionsRef.current = null;
    };
  }, [activeId, reduced]);

  useEffect(() => {
    if (dialog !== null) return;
    if (!restoreArmed.current) return;
    restoreArmed.current = false;
    const y = scrollRef.current;
    const opener = openerRef.current;
    window.scrollTo({ top: y, left: 0, behavior: "auto" });
    opener?.focus({ preventScroll: true });
  }, [dialog]);

  const rememberOpener = (opener: HTMLElement) => {
    openerRef.current = opener;
    scrollRef.current = window.scrollY;
    restoreArmed.current = true;
  };

  const play = (id: string) => {
    setEscape(null);
    setRoaming(false);
    setRunId((value) => value + 1);
    setPhase("begin");
    setActiveId(id);
  };

  const replay = () => {
    reactionsRef.current?.reset();
    setEscape(null);
    setNotice(false);
    setRoaming(false);
    setRunId((value) => value + 1);
    setPhase("begin");
  };

  const closeDialog = () => {
    reactionsRef.current?.reset();
    setEscape(null);
    setNotice(false);
    setReturnToEnding(false);
    setDialog(null);
    setActiveId(null);
  };

  const finish = (id: string, x: number, facing: 1 | -1 = 1) => {
    reactionsRef.current?.settle();
    const added = !collectedRef.current.includes(id);
    if (added) collectedRef.current = [...collectedRef.current, id];
    unlock(id, x, facing);
    if (added) setNotice(true);
    setEscape(null);
    setPhase("ended");
    setRoaming(true);
  };

  const skip = (id: string) => {
    reactionsRef.current?.reset();
    finish(id, clamp(window.innerWidth * 0.46, 96, window.innerWidth - 96));
  };

  const openGame = (id: string, opener: HTMLButtonElement) => {
    rememberOpener(opener);
    setNotice(false);
    setReturnToEnding(false);
    play(id);
    setDialog("game");
  };

  const openGuide = (opener: HTMLButtonElement) => {
    rememberOpener(opener);
    setReturnToEnding(false);
    setDialog("guide");
  };

  const viewEntry = useCallback(() => {
    setNotice(false);
    setReturnToEnding(true);
    setDialog("guide");
  }, []);

  const dismissNotice = useCallback(() => setNotice(false), []);

  const backToEnding = useCallback(() => {
    setDialog("game");
  }, []);

  const pagePhase = roaming ? "roaming" : activeId ? phase : "idle";
  const guideCount = collectedFieldGuide(progress.collectedIds).length;

  return (
    <div className="page sanctuary" id="top" data-motion={reduced ? "reduce" : "full"} data-phase={pagePhase}>
      <div {...(dialog ? { inert: true } : {})}>
        <AnimalsPage
          reduced={reduced}
          activeId={activeId}
          phase={phase}
          playedIds={progress.unlockedIds}
          guideCount={guideCount}
          onPlay={openGame}
          onOpenGuide={openGuide}
        />
        <GroundStrip ref={groundRef}>
          {roaming ? (
            <Pasture
              animal={wilbur}
              found={progress.found}
              startX={progress.pigX ?? clamp(window.innerWidth * 0.46, 96, window.innerWidth - 96)}
              startFacing={progress.facing}
              visible
              reduced={reduced}
              holdState={null}
              suspended={dialog === "guide" && activeId !== null}
              onFind={rememberFind}
            />
          ) : null}
        </GroundStrip>
      </div>
      {dialog ? (
        <StoryWindow
          title={dialog === "guide" ? "Sanctuary Field Guide" : `${site.title}.`}
          kicker={dialog === "game" ? site.kicker : undefined}
          focusKey={`${dialog}-${phase}`}
          scrollY={scrollRef.current}
          onClose={closeDialog}
          overlay={
            dialog === "game" && phase === "collapsing" && escape ? (
              <EscapeSequence
                payload={escape}
                ground={groundRef.current}
                reduced={reduced}
                onDone={(landing) => {
                  if (activeId) finish(activeId, landing.x, landing.facing);
                }}
              />
            ) : null
          }
        >
          {dialog === "guide" ? (
            <FieldGuide
              ids={progress.collectedIds}
              reduced={reduced}
              onBack={returnToEnding ? backToEnding : null}
            />
          ) : (
            <>
              {phase === "begin" ? (
                <div className="story-instructions">
                  <p>{site.gameLabel}</p>
                  <p>{site.begin}</p>
                </div>
              ) : null}
              {reduced ? <p className="story-reduced">{site.reduced}</p> : null}
              <div className="stage-slot story-stage">
                <EndedCard hidden={phase !== "ended"} inert={phase !== "ended"} onReplay={replay} />
                {phase !== "ended" ? (
                  <PigJumpGame
                    key={runId}
                    ref={gameRef}
                    active={(phase === "playing" || phase === "collapsing") && dialog === "game"}
                    reduced={reduced}
                    onStart={() => setPhase("playing")}
                    onLanding={(landing) => reactionsRef.current?.land(landing)}
                    onCollapse={(payload) => {
                      try {
                        reactionsRef.current?.breakthrough({ x: payload.footX, y: payload.footY });
                      } finally {
                        // The physics loop stops on this frame. Commit the fall now so
                        // the ending cannot sit queued behind a later paint.
                        flushSync(() => {
                          setEscape(payload);
                          setPhase("collapsing");
                        });
                      }
                    }}
                  />
                ) : null}
              </div>
              {notice ? <GuideNotice reduced={reduced} onView={viewEntry} onDismiss={dismissNotice} /> : null}
              {phase !== "collapsing" ? (
                <div className="skip-row">
                  {phase !== "ended" && activeId ? (
                    <button type="button" className="text-button" onClick={() => skip(activeId)}>
                      {site.skip}
                    </button>
                  ) : null}
                  <button type="button" className="text-button" onClick={closeDialog}>
                    {site.backToStory}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </StoryWindow>
      ) : null}
    </div>
  );
}
