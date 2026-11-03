import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { getAnimalKit } from "./animals/registry";
import { EscapeSequence } from "./animations/EscapeSequence";
import { AnimalsPage, CREW_ANCHOR } from "./components/AnimalsPage/AnimalsPage";
import { CharacterSwitch } from "./components/CharacterSlider/CharacterSwitch";
import { readCharacterChoice, writeCharacterChoice } from "./components/CharacterSlider/memory";
import { resolveCharacterId, stepCharacter } from "./components/CharacterSlider/slide";
import { FieldGuide } from "./components/FieldGuide/FieldGuide";
import { GuideNotice } from "./components/FieldGuide/GuideNotice";
import { GroundStrip } from "./components/GroundStrip/GroundStrip";
import { EndedCard } from "./components/SiteChrome/SiteChrome";
import { StoryWindow } from "./components/StoryWindow/StoryWindow";
import { animals } from "./content/animals";
import { storyCharacters } from "./content/characters";
import { collectedFieldGuide } from "./content/fieldGuide";
import { site } from "./content/site";
import { PigJumpGame } from "./game/PigJumpGame/PigJumpGame";
import type { EscapePayload } from "./game/PigJumpGame/types";
import { getPigVariant } from "./game/variants";
import { usePersistentProgress } from "./hooks/usePersistentProgress";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { Pasture } from "./npc/Pasture";
import { walkBounds } from "./npc/behaviorMachine/machine";
import { createPageReactions, type PageReactions } from "./page/reactions";
import { residentSpot } from "./progress/storage";
import { clamp } from "./utils/math";

/** Phase of Wilbur's game while its window is open. */
export type Phase = "begin" | "playing" | "collapsing" | "ended";

type DialogView = "game" | "guide";

const centerX = () => clamp(window.innerWidth * 0.46, 96, window.innerWidth - 96);

/** Each animal starts at its own offset so the pigs are not standing on each other. */
function homeX(id: string): number {
  const center = centerX();
  return center + getAnimalKit(id).art.homeOffset;
}

/** A saved spot may come from a wider window. Pull it back inside today's walk lane. */
function restoredX(saved: number | null): number {
  const { min, max } = walkBounds(window.innerWidth);
  return clamp(saved ?? centerX(), min, max);
}

export function App() {
  const reduced = usePrefersReducedMotion();
  const { progress, unlock, rememberFind, placeResident } = usePersistentProgress();
  // Finishing or skipping a story puts that pig on the pasture.
  const herd = animals.filter((animal) => progress.unlockedIds.includes(animal.id));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState(() =>
    resolveCharacterId(readCharacterChoice(), storyCharacters, storyCharacters[0]?.id ?? "wilbur"),
  );
  const [phase, setPhase] = useState<Phase>("begin");
  const [roaming, setRoaming] = useState(herd.length > 0);
  const [escape, setEscape] = useState<EscapePayload | null>(null);
  const [runId, setRunId] = useState(0);
  const [endingPreview, setEndingPreview] = useState(0);
  const [dialog, setDialog] = useState<DialogView | null>(null);
  const [returnToEnding, setReturnToEnding] = useState(false);
  const [noticeId, setNoticeId] = useState<string | null>(null);
  const [guideFocus, setGuideFocus] = useState<string | null>(null);
  const groundRef = useRef<HTMLElement>(null);
  const reactionsRef = useRef<PageReactions | null>(null);
  const collectedRef = useRef(progress.collectedIds);
  const openerRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef(0);
  const restoreArmed = useRef(false);
  const revealRef = useRef<string | null>(null);
  /** True when he is out because he just landed, so he starts exactly where he fell. */
  /** The animal whose breakout just landed on the pasture, at progress.pigX. */
  const landedRef = useRef<string | null>(null);
  collectedRef.current = progress.collectedIds;

  useEffect(() => {
    writeCharacterChoice(storyId);
  }, [storyId]);

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

  // The open window is a modal dialog in the top layer, so no z-index can lift the
  // pasture over it. Promote the ground strip into the top layer after the dialog
  // opens, so Wilbur stays in front of the window once he lands.
  const windowOpen = dialog !== null;
  useLayoutEffect(() => {
    const strip = groundRef.current;
    if (!windowOpen || !strip || typeof strip.showPopover !== "function") return;
    strip.popover = "manual";
    strip.showPopover();
    return () => {
      if (strip.matches(":popover-open")) strip.hidePopover();
      strip.removeAttribute("popover");
    };
  }, [windowOpen]);

  // Landings strain the card that is playing, not the whole page.
  useEffect(() => {
    if (!activeId || !getPigVariant(activeId).pageStrain) return;
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
    const reveal = revealRef.current ? document.getElementById(revealRef.current) : null;
    revealRef.current = null;
    if (reveal) reveal.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    else window.scrollTo({ top: y, left: 0, behavior: "auto" });
    opener?.focus({ preventScroll: true });
  }, [dialog, reduced]);

  const rememberOpener = (opener: HTMLElement) => {
    openerRef.current = opener;
    scrollRef.current = window.scrollY;
    restoreArmed.current = true;
  };

  const play = (id: string) => {
    landedRef.current = null;
    setEscape(null);
    setRoaming(false);
    setEndingPreview(0);
    setRunId((value) => value + 1);
    setPhase("begin");
    setActiveId(id);
  };

  /** Plays Toodles' sanctuary dance again without climbing the course. */
  const replayEnding = () => {
    if (!activeId || getPigVariant(activeId).finale !== "arrival") return;
    landedRef.current = null;
    setNoticeId(null);
    setRoaming(false);
    setPhase("playing");
    setEndingPreview((value) => value + 1);
  };

  const replay = () => {
    landedRef.current = null;
    reactionsRef.current?.reset();
    setEscape(null);
    setNoticeId(null);
    setRoaming(false);
    setEndingPreview(0);
    setRunId((value) => value + 1);
    setPhase("begin");
  };

  const closeDialog = () => {
    reactionsRef.current?.reset();
    setEscape(null);
    setNoticeId(null);
    setReturnToEnding(false);
    setDialog(null);
    setActiveId(null);
    // Leaving a replay early puts the herd back out. A first run left early unlocks nothing.
    if (herd.length > 0) setRoaming(true);
  };

  /** Closes the window and scrolls to the target, e.g. the top of the crew list. */
  const meetAnimal = (id: string) => {
    revealRef.current = id;
    closeDialog();
  };

  const finish = (id: string, x: number, facing: 1 | -1 = 1) => {
    reactionsRef.current?.settle();
    const added = !collectedRef.current.includes(id);
    if (added) collectedRef.current = [...collectedRef.current, id];
    unlock(id, x, facing);
    landedRef.current = id;
    if (added) setNoticeId(id);
    setEscape(null);
    setPhase("ended");
    setRoaming(true);
  };

  const skip = (id: string) => {
    if (getPigVariant(id).finale === "arrival") {
      completeArrival(id);
      return;
    }
    reactionsRef.current?.reset();
    finish(id, centerX());
  };

  /** Toodles has landed on the pasture. He does not break the page. */
  const completeArrival = (id: string, x = homeX(id), facing: 1 | -1 = 1) => {
    reactionsRef.current?.reset();
    const award = getPigVariant(id).awardsGuide;
    const added = award && !collectedRef.current.includes(id);
    if (added) collectedRef.current = [...collectedRef.current, id];
    placeResident(id, x, facing, award);
    setEscape(null);
    setNoticeId(added ? id : null);
    setPhase("ended");
    setRoaming(true);
  };

  const openGame = (id: string, opener: HTMLButtonElement) => {
    rememberOpener(opener);
    setNoticeId(null);
    setReturnToEnding(false);
    setStoryId(id);
    play(id);
    setDialog("game");
  };

  /** Arrows on the hero pick a story. The same arrows inside a game start that story. */
  const stepStory = (delta: -1 | 1) => {
    const basis = dialog === "game" && activeId ? activeId : storyId;
    const next = stepCharacter(storyCharacters, basis, delta);
    if (!next || next.id === basis) return;
    setStoryId(next.id);
    if (dialog !== "game") return;
    reactionsRef.current?.reset();
    setNoticeId(null);
    setReturnToEnding(false);
    play(next.id);
  };

  const openGuide = (opener: HTMLButtonElement) => {
    rememberOpener(opener);
    setGuideFocus(null);
    setReturnToEnding(false);
    setDialog("guide");
  };

  const viewEntry = useCallback(() => {
    setGuideFocus(noticeId);
    setNoticeId(null);
    setReturnToEnding(true);
    setDialog("guide");
  }, [noticeId]);

  const dismissNotice = useCallback(() => setNoticeId(null), []);

  const backToEnding = useCallback(() => {
    setDialog("game");
  }, []);

  const pagePhase = roaming ? "roaming" : activeId ? phase : "idle";
  const guideCount = collectedFieldGuide(progress.collectedIds).length;
  const variant = getPigVariant(activeId);

  return (
    <div className="page sanctuary" id="top" data-motion={reduced ? "reduce" : "full"} data-phase={pagePhase}>
      <div {...(dialog ? { inert: true } : {})}>
        <AnimalsPage
          reduced={reduced}
          activeId={activeId}
          phase={phase}
          playedIds={progress.unlockedIds}
          selectedId={storyId}
          guideCount={guideCount}
          onPlay={openGame}
          onStepStory={stepStory}
          onOpenGuide={openGuide}
          pageStrain={Boolean(activeId) && variant.pageStrain}
        />
        <GroundStrip
          ref={groundRef}
          name={roaming && herd.length > 0 ? herd.map((animal) => animal.displayName).join(", ") : undefined}
        >
          {roaming
            ? herd.map((animal) => {
                const saved = residentSpot(progress, animal.id);
                const justLanded = animal.id === landedRef.current;
                const facing = justLanded ? progress.facing : (saved?.facing ?? 1);
                const x = justLanded ? (progress.pigX ?? homeX(animal.id)) : restoredX(saved?.x ?? homeX(animal.id));
                return (
                  <Pasture
                    key={animal.id}
                    animal={animal}
                    found={progress.found}
                    startX={x}
                    startFacing={facing}
                    reduced={reduced}
                    suspended={dialog === "guide" && activeId !== null}
                    onFind={rememberFind}
                  />
                );
              })
            : null}
        </GroundStrip>
      </div>
      {dialog ? (
        <StoryWindow
          title={dialog === "guide" ? "Sanctuary Field Guide" : variant.windowTitle}
          kicker={dialog === "game" ? variant.windowKicker : undefined}
          strainTitle={dialog === "game" && variant.pageStrain}
          focusKey={`${dialog}-${phase}`}
          scrollY={scrollRef.current}
          onClose={closeDialog}
          overlay={
            dialog === "game" && phase === "collapsing" && escape ? (
              <EscapeSequence
                payload={escape}
                ground={groundRef.current}
                reduced={reduced}
                sprite={variant.sprite}
                gentle={variant.finale === "arrival"}
                onDone={(landing) => {
                  if (!activeId) return;
                  if (getPigVariant(activeId).finale === "arrival") {
                    completeArrival(activeId, landing.x, landing.facing);
                    return;
                  }
                  finish(activeId, landing.x, landing.facing);
                }}
              />
            ) : null
          }
        >
          {dialog === "guide" ? (
            <FieldGuide
              ids={progress.collectedIds}
              focusId={guideFocus}
              foundIds={progress.found.map((item) => item.id)}
              reduced={reduced}
              onBack={returnToEnding ? backToEnding : null}
            />
          ) : (
            <>
              {reduced ? <p className="story-reduced">{site.reduced}</p> : null}
              {phase !== "collapsing" ? (
                <CharacterSwitch
                  name={variant.displayName}
                  tone="game"
                  canStep={storyCharacters.length > 1}
                  reduced={reduced}
                  onStep={stepStory}
                />
              ) : null}
              <div className="stage-slot story-stage">
                <EndedCard
                  hidden={phase !== "ended"}
                  inert={phase !== "ended"}
                  title={variant.endingTitle}
                  lead={variant.endingLead}
                  helpLabel={variant.helpLabel}
                  helpHref={variant.helpHref}
                  onReplay={replay}
                  onMeet={() => meetAnimal(CREW_ANCHOR)}
                />
                {phase !== "ended" ? (
                  <PigJumpGame
                    key={runId}
                    variant={variant}
                    active={(phase === "playing" || phase === "collapsing") && dialog === "game"}
                    reduced={reduced}
                    endingPreview={variant.finale === "arrival" ? endingPreview : 0}
                    onStart={() => setPhase("playing")}
                    onRetry={replay}
                    onLanding={variant.pageStrain ? (landing) => reactionsRef.current?.land(landing) : undefined}
                    onArrive={() => {
                      if (activeId) completeArrival(activeId);
                    }}
                    onDescend={
                      variant.finale === "arrival"
                        ? (payload) => {
                            flushSync(() => {
                              setEscape({ ...payload, pieces: [] });
                              setPhase("collapsing");
                            });
                          }
                        : undefined
                    }
                    onCollapse={
                      variant.finale === "collapse"
                        ? (payload) => {
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
                          }
                        : undefined
                    }
                  />
                ) : null}
              </div>
              {noticeId ? (
                <GuideNotice
                  name={getPigVariant(noticeId).displayName}
                  sprite={getPigVariant(noticeId).sprite}
                  reduced={reduced}
                  onView={viewEntry}
                  onDismiss={dismissNotice}
                />
              ) : null}
              {phase !== "collapsing" ? (
                <div className="skip-row">
                  {phase !== "ended" && activeId ? (
                    <button type="button" className="link-button skip-link" onClick={() => skip(activeId)}>
                      {site.skip}
                    </button>
                  ) : null}
                  {variant.finale === "arrival" ? (
                    <button type="button" className="link-button skip-link ending-replay" onClick={replayEnding}>
                      Replay ending
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </StoryWindow>
      ) : null}
    </div>
  );
}
