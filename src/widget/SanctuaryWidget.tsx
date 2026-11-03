import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { EscapeSequence } from "../animations/EscapeSequence";
import { readCharacterChoice, writeCharacterChoice } from "../components/CharacterSlider/memory";
import { resolveCharacterId, stepCharacter } from "../components/CharacterSlider/slide";
import { CharacterSwitch } from "../components/CharacterSlider/CharacterSwitch";
import { FieldGuide } from "../components/FieldGuide/FieldGuide";
import { GuideNotice } from "../components/FieldGuide/GuideNotice";
import { GroundStrip } from "../components/GroundStrip/GroundStrip";
import { EndedCard } from "../components/SiteChrome/SiteChrome";
import { StoryWindow } from "../components/StoryWindow/StoryWindow";
import { animals } from "../content/animals";
import { storyCharacters } from "../content/characters";
import { collectedFieldGuide, fieldGuideButtonLabel } from "../content/fieldGuide";
import { site } from "../content/site";
import { wilbur } from "../content/animals/wilbur";
import { PigJumpGame } from "../game/PigJumpGame/PigJumpGame";
import type { EscapePayload } from "../game/PigJumpGame/types";
import { getPigVariant, isPlayableStory } from "../game/variants";
import { usePersistentProgress } from "../hooks/usePersistentProgress";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Pasture } from "../npc/Pasture";
import { walkBounds } from "../npc/behaviorMachine/machine";
import { createPageReactions, type PageReactions } from "../page/reactions";
import { residentSpot } from "../progress/storage";
import { clamp } from "../utils/math";
import { watchClearance } from "./clearance";
import { StoryLauncher } from "./Launcher";
import { bindWidgetMotion } from "./motion";

type Phase = "begin" | "playing" | "collapsing" | "ended";
type DialogView = "game" | "guide";

const centerX = () => clamp(window.innerWidth * 0.46, 96, window.innerWidth - 96);

function homeX(id: string): number {
  const center = centerX();
  if (id === "toodles") return center + 120;
  return center;
}

function restoredX(saved: number | null): number {
  const { min, max } = walkBounds(window.innerWidth);
  return clamp(saved ?? centerX(), min, max);
}

function pxVar(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const value = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

export interface WidgetApiBridge {
  openStory: (id: string, opener: HTMLElement | null) => void;
  openGuide: (opener: HTMLElement | null) => void;
}

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

/**
 * Games, Field Guide, breakout, and roaming pigs.
 * Squarespace keeps the header, biographies, photos, and footer.
 */
export function SanctuaryWidget({
  bridge,
  helpHref,
  launcherSlot,
  animalsSelector,
  clearanceSelector,
}: {
  bridge: WidgetApiBridge;
  helpHref: string;
  launcherSlot: HTMLElement | null;
  animalsSelector: string;
  clearanceSelector: string;
}) {
  const reduced = usePrefersReducedMotion();
  const { progress, unlock, rememberFind, placeResident } = usePersistentProgress();
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
  const pageRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLElement>(null);
  const reactionsRef = useRef<PageReactions | null>(null);
  const collectedRef = useRef(progress.collectedIds);
  const openerRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef(0);
  const restoreArmed = useRef(false);
  const revealRef = useRef<HTMLElement | null>(null);
  const landedRef = useRef(false);
  collectedRef.current = progress.collectedIds;

  useEffect(() => {
    writeCharacterChoice(storyId);
  }, [storyId]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    return bindWidgetMotion(page);
  }, []);

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

  useEffect(() => {
    if (!activeId || !getPigVariant(activeId).pageStrain) return;
    const root = pageRef.current;
    if (!root) return;
    const reactions = createPageReactions(root, reduced, {
      scope: root,
      includePageChrome: false,
      hostPhotos: () => [...document.querySelectorAll<HTMLElement>("[data-ss-strain='photo']")],
      hostLetters: () => [...document.querySelectorAll<HTMLElement>("[data-ss-strain='letters'] .crew-letter")],
      hostHeadings: () => [...document.querySelectorAll<HTMLElement>("[data-ss-strain='letters']")],
    });
    reactionsRef.current = reactions;
    return () => {
      reactions.destroy();
      if (reactionsRef.current === reactions) reactionsRef.current = null;
    };
  }, [activeId, reduced]);

  useEffect(() => {
    const page = pageRef.current;
    const rootNode = page?.getRootNode();
    const host = rootNode instanceof ShadowRoot && rootNode.host instanceof HTMLElement ? rootNode.host : page;
    if (!host) return;
    return watchClearance(clearanceSelector, (box) => {
      host.style.setProperty("--ss-clear-top", `${box.top}px`);
      host.style.setProperty("--ss-clear-bottom", `${box.bottom}px`);
      const spacer = document.querySelector<HTMLElement>("[data-ss-spacer]");
      if (!spacer) return;
      if (!roaming) {
        spacer.style.height = "0px";
        return;
      }
      const style = getComputedStyle(host);
      const lane = pxVar(style, "--lane", 96);
      const bar = pxVar(style, "--bar", 12);
      spacer.style.height = `${lane + bar + box.bottom}px`;
    });
  }, [clearanceSelector, roaming]);

  useEffect(() => {
    if (dialog !== null) return;
    if (!restoreArmed.current) return;
    restoreArmed.current = false;
    const y = scrollRef.current;
    const opener = openerRef.current;
    const reveal = revealRef.current;
    revealRef.current = null;
    if (reveal) reveal.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    else window.scrollTo({ top: y, left: 0, behavior: "auto" });
    opener?.focus({ preventScroll: true });
  }, [dialog, reduced]);

  const rememberOpener = (opener: HTMLElement | null) => {
    openerRef.current = opener;
    scrollRef.current = window.scrollY;
    restoreArmed.current = true;
  };

  const play = (id: string) => {
    landedRef.current = false;
    setEscape(null);
    setRoaming(false);
    setEndingPreview(0);
    setRunId((value) => value + 1);
    setPhase("begin");
    setActiveId(id);
  };

  const replayEnding = () => {
    if (!activeId || getPigVariant(activeId).finale !== "arrival") return;
    landedRef.current = false;
    setNoticeId(null);
    setRoaming(false);
    setPhase("playing");
    setEndingPreview((value) => value + 1);
  };

  const replay = () => {
    landedRef.current = false;
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
    if (herd.length > 0) setRoaming(true);
  };

  const meetAnimal = () => {
    let target: Element | null = null;
    try {
      target = document.querySelector(animalsSelector);
    } catch {
      target = null;
    }
    revealRef.current = target instanceof HTMLElement ? target : null;
    closeDialog();
  };

  const finish = (id: string, x: number, facing: 1 | -1 = 1) => {
    reactionsRef.current?.settle();
    const added = !collectedRef.current.includes(id);
    if (added) collectedRef.current = [...collectedRef.current, id];
    unlock(id, x, facing);
    landedRef.current = true;
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

  const openGame = (id: string, opener: HTMLElement | null) => {
    if (!isPlayableStory(id)) return;
    rememberOpener(opener);
    setNoticeId(null);
    setReturnToEnding(false);
    setStoryId(id);
    play(id);
    setDialog("game");
  };

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

  const openGuide = (opener: HTMLElement | null) => {
    rememberOpener(opener);
    setGuideFocus(null);
    setReturnToEnding(false);
    setDialog("guide");
  };

  const actions = useRef<WidgetApiBridge>({
    openStory: () => {},
    openGuide: () => {},
  });
  actions.current.openStory = openGame;
  actions.current.openGuide = openGuide;

  useLayoutEffect(() => {
    bridge.openStory = (id, opener) => actions.current.openStory(id, opener);
    bridge.openGuide = (opener) => actions.current.openGuide(opener);
  }, [bridge]);

  const viewEntry = useCallback(() => {
    setGuideFocus(noticeId);
    setNoticeId(null);
    setReturnToEnding(true);
    setDialog("guide");
  }, [noticeId]);

  const dismissNotice = useCallback(() => setNoticeId(null), []);
  const backToEnding = useCallback(() => setDialog("game"), []);

  const pagePhase = roaming ? "roaming" : activeId ? phase : "idle";
  const guideCount = collectedFieldGuide(progress.collectedIds).length;
  const variant = getPigVariant(activeId);
  const selected = storyCharacters.find((character) => character.id === storyId) ?? storyCharacters[0];

  const launcher =
    launcherSlot && selected ? (
      <StoryLauncher
        character={selected}
        reduced={reduced}
        played={progress.unlockedIds.includes(selected.id)}
        canStep={storyCharacters.length > 1}
        onStep={stepStory}
        onPlay={(opener) => openGame(selected.id, opener)}
        onOpenGuide={openGuide}
      />
    ) : null;

  return (
    <>
      {launcherSlot && launcher ? createPortal(launcher, launcherSlot) : null}
      <div ref={pageRef} className="page sanctuary" data-motion={reduced ? "reduce" : "full"} data-phase={pagePhase}>
        <div {...(dialog ? { inert: true } : {})}>
          <GuideButton count={guideCount} onOpenGuide={openGuide} />
          <GroundStrip
            ref={groundRef}
            name={roaming && herd.length > 0 ? herd.map((animal) => animal.displayName).join(", ") : undefined}
          >
            {roaming
              ? herd.map((animal) => {
                  const saved = residentSpot(progress, animal.id);
                  const justLanded = animal.id === wilbur.id && landedRef.current;
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
                    helpHref={helpHref}
                    onReplay={replay}
                    onMeet={meetAnimal}
                  />
                  {phase !== "ended" ? (
                    <PigJumpGame
                      key={runId}
                      variant={variant}
                      active={(phase === "playing" || phase === "collapsing") && dialog === "game"}
                      reduced={reduced}
                      endingPreview={variant.id === "toodles" ? endingPreview : 0}
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
                    {variant.id === "toodles" ? (
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
    </>
  );
}
