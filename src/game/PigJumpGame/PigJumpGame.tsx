import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PlatformArt } from "../../assets/environment/scenery";
import { BloomArt, ChipArt, CourseFx, GrowthArt, ScorchArt, SpillArt } from "../../assets/environment/courseArt";
import { LabBackdrop } from "../../assets/environment/LabBackdrop";
import { site } from "../../content/site";
import { milestoneAlong, type AgeMilestone } from "../progression/age";
import { WilburSprite } from "../../assets/pig/WilburSprite";
import { ToodlesSprite } from "../../assets/pig/ToodlesSprite";
import { PIG_DRAW } from "../../assets/pig/metrics";
import type { PigPose } from "../../model/types";
import { effectSignature, platformSignature, resizeWorld } from "../physics/platforms";
import { BOUNCE_VY } from "../physics/constants";
import { createWorld, stepWorld } from "../physics/step";
import type { World, WorldEffect } from "../physics/types";
import { flipReadout, settleReadout } from "./readout";
import { measureEscape, paintEcho, paintWorld, poseForBody, writeCaption, type GrowthEcho } from "./paint";
import { clamp01, lerp } from "../../utils/math";
import type { EscapePayload } from "./types";
import type { LandingPulse } from "../physics/types";
import { biomeAt } from "../variants/toodles";
import { wilburVariant, type PigVariant } from "../variants";

interface PigJumpGameProps {
  active: boolean;
  reduced: boolean;
  variant?: PigVariant;
  onCollapse?: (payload: EscapePayload) => void;
  onArrive?: () => void;
  /** Dance finished. The page drops him from here onto the pasture. */
  onDescend?: (payload: EscapePayload) => void;
  onLanding?: (landing: LandingPulse) => void;
  onStart?: () => void;
  onRetry: () => void;
  /** Bumps to play Toodles' ending from the sanctuary, without climbing again. */
  endingPreview?: number;
}

/** Game seconds a milestone note stays under the age. Game time, so it holds while the tab is hidden. */
const NOTE_SECONDS = 4.5;
/** The size change plays first. The age turns once he has finished growing. */
const GROW_SECONDS = 0.35;
const AGE_DELAY = 0.45;

type InputHints = "keys" | "touch" | "both";

/**
 * Phones and tablets get tap wording. A laptop with a touchscreen still has a fine
 * pointer, so it keeps the keys and adds the tap and hold wording.
 */
const inputHints = (): InputHints => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "keys";
  if (window.matchMedia("(pointer: coarse)").matches) return "touch";
  return window.matchMedia("(any-pointer: coarse)").matches ? "both" : "keys";
};

/** A full jump arc needs this much room. Smaller stages draw the same world scaled down. */
const MIN_WORLD_WIDTH = 280;
const MIN_WORLD_HEIGHT = 220;

/**
 * Sizes the physics world to the stage and returns it. A stage shorter or narrower
 * than the minimum (a phone on its side) keeps the minimum world and scales its
 * drawing down to fit, so the floor and the planks below him are never cropped.
 */
const fitWorld = (frame: HTMLElement, worldEl: HTMLElement) => {
  const stageWidth = frame.clientWidth;
  const stageHeight = frame.clientHeight;
  const view =
    stageWidth > 0 && stageHeight > 0 ? Math.min(1, stageWidth / MIN_WORLD_WIDTH, stageHeight / MIN_WORLD_HEIGHT) : 1;
  const width = Math.max(MIN_WORLD_WIDTH, stageWidth / view);
  const height = Math.max(MIN_WORLD_HEIGHT, stageHeight / view);
  const scaled = view < 1;
  worldEl.style.width = scaled ? `${width}px` : "";
  worldEl.style.height = scaled ? `${height}px` : "";
  worldEl.style.transform = scaled ? `scale(${view})` : "";
  return { width, height };
};

const BEGIN: Record<InputHints, string> = { keys: site.begin, touch: site.beginTouch, both: site.beginBoth };
const STEER: Record<InputHints, string> = { keys: site.steer, touch: site.steerTouch, both: site.steerBoth };

function VariantSprite({
  sprite,
  pose,
  reduced,
  dancing,
  danceRun,
  onDanceComplete,
}: {
  sprite: PigVariant["sprite"];
  pose: PigPose;
  reduced: boolean;
  dancing: boolean;
  danceRun: number;
  onDanceComplete?: () => void;
}) {
  if (sprite === "toodles") {
    return (
      <ToodlesSprite
        pose={pose}
        reduced={reduced}
        dancing={dancing}
        danceRun={danceRun}
        onDanceComplete={onDanceComplete}
      />
    );
  }
  return <WilburSprite pose={pose} reduced={reduced} />;
}

/**
 * Rendering is a copy of the physics world onto transforms.
 * React state changes only when a plank's crack state changes. The age readout, its note, and the growth echo are written directly.
 */
export function PigJumpGame({
  active,
  reduced,
  variant = wilburVariant,
  onCollapse,
  onArrive,
  onDescend,
  onLanding,
  onStart,
  onRetry,
  endingPreview = 0,
}: PigJumpGameProps) {
  const frameRef = useRef<HTMLElement>(null);
  const worldElRef = useRef<HTMLDivElement>(null);
  const pigRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const echoNodeRef = useRef<HTMLDivElement>(null);
  const ageLiveRef = useRef<HTMLParagraphElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const readoutTurnRef = useRef<ReturnType<typeof flipReadout>>(null);
  const opening = variant.milestones[0];
  /** Drawn size: eases from `from` to `to` starting at `startedAt` (game time). */
  const growRef = useRef({ from: opening.scale, to: opening.scale, startedAt: 0 });
  const echoRef = useRef<GrowthEcho | null>(null);
  /** A milestone reached in the air waits here for a safe landing. */
  const pendingGrowthRef = useRef<AgeMilestone | null>(null);
  const pendingAgeRef = useRef<{ milestone: AgeMilestone; at: number } | null>(null);
  const noteUntilRef = useRef(0);
  const worldRef = useRef<World | null>(null);
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const onCollapseRef = useRef(onCollapse);
  const onArriveRef = useRef(onArrive);
  const onDescendRef = useRef(onDescend);
  const onLandingRef = useRef(onLanding);
  const activeRef = useRef(active);
  const reducedRef = useRef(reduced);
  const variantRef = useRef(variant);
  const poseRef = useRef<PigPose>("idle");
  const holdingRef = useRef(endingPreview === 0);
  const onStartRef = useRef(onStart);
  const dancingRef = useRef(false);
  const arrivalRef = useRef(false);
  const arrivedRef = useRef(false);
  const spillCountRef = useRef(0);
  const biomeRef = useRef(biomeAt(0));
  const [hints] = useState(inputHints);
  const [holding, setHolding] = useState(endingPreview === 0);
  const [ready, setReady] = useState(false);
  const [pose, setPose] = useState<PigPose>("idle");
  const [fell, setFell] = useState(false);
  const [dancing, setDancing] = useState(false);
  const [danceRun, setDanceRun] = useState(0);
  const [biome, setBiome] = useState(biomeAt(0));
  const [platforms, setPlatforms] = useState<
    {
      id: string;
      stage: World["platforms"][number]["stage"];
      skin: NonNullable<World["platforms"][number]["skin"]>;
      art?: string;
      falling: boolean;
      wobble: boolean;
    }[]
  >([]);
  const [effects, setEffects] = useState<{ id: string; kind: WorldEffect["kind"] }[]>([]);

  onCollapseRef.current = onCollapse;
  onArriveRef.current = onArrive;
  onDescendRef.current = onDescend;
  onLandingRef.current = onLanding;
  onStartRef.current = onStart;
  activeRef.current = active;
  reducedRef.current = reduced;
  variantRef.current = variant;

  const syncScene = (world: World) => {
    setPlatforms(
      world.platforms.map((platform) => ({
        id: platform.id,
        stage: platform.stage,
        skin: platform.skin ?? "plank",
        art: platform.art,
        falling: platform.falling,
        wobble: world.time < platform.wobbleUntil,
      })),
    );
    setEffects(world.effects.map((effect) => ({ id: effect.id, kind: effect.kind })));
  };

  const drawScale = (world: World) => {
    const grow = growRef.current;
    const t = reducedRef.current ? 1 : clamp01((world.time - grow.startedAt) / GROW_SECONDS);
    return lerp(grow.from, grow.to, 1 - (1 - t) ** 3);
  };

  const paint = (world: World) => {
    const pig = pigRef.current;
    if (!pig) return;
    paintWorld(world, nodesRef.current, pig, reducedRef.current, drawScale(world));
    if (echoNodeRef.current) paintEcho(world, echoRef.current, echoNodeRef.current, reducedRef.current);
    const nextPose = holdingRef.current ? "idle" : dancingRef.current ? "dance" : poseForBody(world);
    if (nextPose !== poseRef.current) {
      poseRef.current = nextPose;
      setPose(nextPose);
    }
  };

  const stopReadout = () => {
    readoutTurnRef.current?.kill();
    readoutTurnRef.current = null;
    settleReadout(readoutRef.current);
  };

  const announce = (text: string) => {
    const live = ageLiveRef.current;
    if (live && live.textContent !== text) live.textContent = text;
  };

  const hideNote = () => {
    noteUntilRef.current = 0;
    if (noteRef.current) noteRef.current.dataset.show = "0";
  };

  /**
   * One call per milestone, with his feet on a plank (or in the air for the last
   * one, whose landing ends the run). He expands from the size he was, a faint
   * echo of that size rides on him, and the age waits until he has grown.
   */
  const grow = (world: World, milestone: AgeMilestone) => {
    pendingGrowthRef.current = null;
    const from = drawScale(world);
    growRef.current = { from, to: milestone.scale, startedAt: world.time };
    echoRef.current = { scale: from, startedAt: world.time };
    pendingAgeRef.current = { milestone, at: world.time + (reducedRef.current ? 0 : AGE_DELAY) };
  };

  const showAge = (world: World, milestone: AgeMilestone) => {
    pendingAgeRef.current = null;
    const current = variantRef.current;
    const age = current.readout(milestone);
    const readout = readoutRef.current;
    if (readout) {
      stopReadout();
      readoutTurnRef.current = flipReadout(readout, age, reducedRef.current);
    }
    const note = noteRef.current;
    const noteCopy = current.note(milestone);
    if (note) {
      if (noteCopy) {
        writeCaption(note, noteCopy);
        note.dataset.show = "1";
        noteUntilRef.current = world.time + NOTE_SECONDS;
      } else {
        hideNote();
      }
    }
    announce(current.announcement(milestone));
  };

  const finishArrival = () => {
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    const world = worldRef.current;
    const frame = frameRef.current;
    const worldEl = worldElRef.current;
    const descend = onDescendRef.current;
    if (world && frame && worldEl && descend) {
      descend(measureEscape(world, worldEl, frame, nodesRef.current, reducedRef.current, growRef.current.to));
      return;
    }
    onArriveRef.current?.();
  };

  const beginArrival = (world: World) => {
    if (arrivalRef.current) return;
    arrivalRef.current = true;
    arrivedRef.current = false;
    world.over = true;
    holdingRef.current = false;
    setHolding(false);
    dancingRef.current = true;
    poseRef.current = "dance";
    setPose("dance");
    setDancing(true);
    setDanceRun((value) => value + 1);
    biomeRef.current = "sanctuary";
    setBiome("sanctuary");
    const frame = frameRef.current;
    if (frame) frame.style.setProperty("--climb", "1");
    const finale = variantRef.current.milestones[variantRef.current.milestones.length - 1];
    showAge(world, finale);
  };

  const beginArrivalRef = useRef(beginArrival);
  beginArrivalRef.current = beginArrival;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const worldEl = worldElRef.current;
    if (!frame || !worldEl) return;
    const world = createWorld({ ...fitWorld(frame, worldEl), variant: variant.id });
    worldRef.current = world;
    syncScene(world);
    setReady(true);
    return () => {
      world.over = true;
      stopReadout();
      gsap.killTweensOf(frame);
      setReady(false);
    };
  }, [variant.id]);

  useLayoutEffect(() => {
    const world = worldRef.current;
    if (!world || !ready) return;
    paint(world);
    // paint, grow, showAge and release read only refs, so any render's copy is current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms, effects, ready]);

  useLayoutEffect(() => {
    if (!endingPreview || !ready || variantRef.current.id !== "toodles") return;
    const world = worldRef.current;
    if (!world) return;
    const sanctuary = world.platforms.reduce<World["platforms"][number] | null>((best, platform) => {
      if (platform.broken || platform.falling) return best;
      if (!best || platform.y > best.y) return platform;
      return best;
    }, null);
    if (sanctuary) {
      world.pig.x = sanctuary.x + sanctuary.width / 2;
      world.pig.y = sanctuary.y;
      world.pig.vx = 0;
      world.pig.vy = 0;
      world.pig.facing = 1;
      world.cameraBottom = Math.max(0, sanctuary.y - world.height * 0.42);
    }
    world.progress = 1;
    world.maxHeight = world.finaleHeight;
    world.over = false;
    arrivalRef.current = false;
    arrivedRef.current = false;
    beginArrivalRef.current(world);
    paint(world);
    // beginArrival and paint read refs. endingPreview is the replay signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endingPreview, ready]);

  const release = () => {
    const world = worldRef.current;
    if (!world || world.over || !holdingRef.current) return;
    holdingRef.current = false;
    world.pig.vy = BOUNCE_VY;
    announce(variantRef.current.startAnnouncement);
    setHolding(false);
    onStartRef.current?.();
  };

  useEffect(() => {
    if (!ready) return;
    let frameId = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const world = worldRef.current;
      const frame = frameRef.current;
      const worldEl = worldElRef.current;
      if (!world || !frame || !worldEl || world.over) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!document.hidden && activeRef.current && !holdingRef.current) {
        const sceneKey = () => platformSignature(world.platforms, world.time) + effectSignature(world.effects);
        const before = sceneKey();
        const events = stepWorld(world, dt);
        paint(world);
        const current = variantRef.current;
        if (current.id === "toodles") {
          const nextBiome = biomeAt(world.progress);
          if (nextBiome !== biomeRef.current) {
            biomeRef.current = nextBiome;
            setBiome(nextBiome);
          }
          frame.style.setProperty("--climb", world.progress.toFixed(3));
          const spills = world.effects.reduce(
            (count, effect) => count + (effect.kind === "spill" && effect.hazard ? 1 : 0),
            0,
          );
          if (current.scorchFlashMs > 0 && spills > spillCountRef.current) {
            gsap.fromTo(
              frame,
              { "--scorch": 1 },
              { "--scorch": 0, duration: current.scorchFlashMs / 1000, ease: "power2.out", overwrite: "auto" },
            );
          }
          spillCountRef.current = spills;
        }
        if (events.milestoneChanged) {
          const milestone = milestoneAlong(world.milestones, world.progress);
          if (milestone.at >= 1) grow(world, milestone);
          else pendingGrowthRef.current = milestone;
        }
        if (events.fell) {
          stopReadout();
          hideNote();
          announce(`${current.fellTitle} ${current.fellNote}`);
          setFell(true);
          return;
        }
        const safe = events.landed !== null && events.landed.outcome !== "break";
        if (pendingGrowthRef.current && safe) grow(world, pendingGrowthRef.current);
        const pendingAge = pendingAgeRef.current;
        if (pendingAge && world.time >= pendingAge.at) showAge(world, pendingAge.milestone);
        if (noteUntilRef.current && world.time >= noteUntilRef.current) hideNote();
        if (events.landed && current.pageStrain) onLandingRef.current?.(events.landed);
        if (sceneKey() !== before) syncScene(world);
        if (events.finale) {
          if (current.finale === "arrival") {
            beginArrival(world);
            return;
          }
          world.over = true;
          // He leaves at the size he is growing into, even if the expansion hasn't finished.
          const milestone = milestoneAlong(world.milestones, world.progress);
          if (milestone.scale !== growRef.current.to) grow(world, milestone);
          onCollapseRef.current?.(
            measureEscape(world, worldEl, frame, nodesRef.current, reducedRef.current, growRef.current.to),
          );
          return;
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    const frame = frameRef.current;
    const worldEl = worldElRef.current;
    if (!frame || !worldEl || !ready) return;
    // Watches the stage, not the world: the world's own size is set from this.
    const observer = new ResizeObserver(() => {
      const world = worldRef.current;
      if (!world || world.over) return;
      const { width, height } = fitWorld(frame, worldEl);
      if (width === world.width && height === world.height) return;
      resizeWorld(world, width, height);
      paint(world);
    });
    observer.observe(frame);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (fell) retryRef.current?.focus({ preventScroll: true });
  }, [fell]);

  useEffect(() => {
    if (!ready || !holding) return;
    const frame = frameRef.current;
    if (!frame) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("a, button, input, textarea, select, summary")) return;
      event.preventDefault();
      release();
    };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !frame.contains(event.target)) return;
      release();
    };
    window.addEventListener("keydown", onKey);
    frame.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      frame.removeEventListener("pointerdown", onPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, holding]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !ready) return;
    const keys = new Set<string>();
    const pointers = new Map<number, number>();

    const sync = () => {
      const world = worldRef.current;
      if (!world) return;
      world.input.left = keys.has("arrowleft") || keys.has("a");
      world.input.right = keys.has("arrowright") || keys.has("d");
      if (pointers.size === 0) {
        world.input.touchLeft = false;
        world.input.touchRight = false;
        return;
      }
      const rect = frame.getBoundingClientRect();
      let left = false;
      let right = false;
      for (const x of pointers.values()) {
        if (x < rect.left + rect.width / 2) left = true;
        else right = true;
      }
      world.input.touchLeft = left;
      world.input.touchRight = right;
    };

    const canSteer = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, a, button")) {
        return false;
      }
      if (!activeRef.current) return false;
      const activeElement = document.activeElement;
      if (activeElement === document.body || activeElement === document.documentElement) return true;
      return frame.contains(activeElement);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!canSteer(event)) return;
      const key = event.key.toLowerCase();
      if (key !== "arrowleft" && key !== "arrowright" && key !== "a" && key !== "d") return;
      keys.add(key);
      if (key.startsWith("arrow")) event.preventDefault();
      sync();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase());
      sync();
    };
    const onPointerDown = (event: PointerEvent) => {
      // Capturing the pointer would steal the click from the try-again button.
      if (!activeRef.current || worldRef.current?.over) return;
      frame.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, event.clientX);
      sync();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, event.clientX);
      sync();
    };
    const onPointerEnd = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      sync();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    frame.addEventListener("pointerdown", onPointerDown);
    frame.addEventListener("pointermove", onPointerMove);
    frame.addEventListener("pointerup", onPointerEnd);
    frame.addEventListener("pointercancel", onPointerEnd);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      frame.removeEventListener("pointerdown", onPointerDown);
      frame.removeEventListener("pointermove", onPointerMove);
      frame.removeEventListener("pointerup", onPointerEnd);
      frame.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [ready]);

  const openingReadout = variant.readout(opening);

  return (
    <section
      className="stage"
      ref={frameRef}
      tabIndex={0}
      data-variant={variant.id}
      data-biome={variant.id === "toodles" ? biome : undefined}
      data-holding={holding ? "1" : undefined}
      data-fallen={fell ? "1" : undefined}
      data-dancing={dancing ? "1" : undefined}
      data-strain={variant.pageStrain ? "frame" : undefined}
      data-autofocus=""
      aria-label={variant.gameLabel}
    >
      <p className="sr-only" ref={ageLiveRef} aria-live="polite" />
      <div className="age-panel" aria-hidden="true">
        <div
          className="age-readout"
          ref={readoutRef}
          data-debris={variant.finale === "collapse" ? "badge" : undefined}
          data-label={openingReadout}
        >
          {variant.readoutLabel ? <span className="age-readout-label">{variant.readoutLabel}</span> : null}
          <span className="age-readout-page">
            {variant.readoutSamples.map((sample) => (
              <span className="age-readout-sizer" key={sample}>
                {sample}
              </span>
            ))}
            <span className="age-readout-value">{openingReadout}</span>
          </span>
        </div>
        <div
          className="age-note"
          ref={noteRef}
          data-show="0"
          data-debris={variant.finale === "collapse" ? "badge" : undefined}
        >
          <p className="age-headline" />
          <p className="age-tag" />
        </div>
      </div>
      <div className="world" ref={worldElRef}>
        {variant.id === "toodles" ? <LabBackdrop reduced={reduced} /> : null}
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`platform${platform.falling ? " is-falling" : ""}`}
            data-stage={platform.stage}
            data-skin={platform.skin}
            data-wobble={platform.wobble ? "1" : "0"}
            ref={(node) => {
              if (node) nodesRef.current.set(platform.id, node);
              else nodesRef.current.delete(platform.id);
            }}
          >
            <div className="platform-skin">
              <PlatformArt stage={platform.stage} skin={platform.skin} art={platform.art} />
            </div>
          </div>
        ))}
        {effects.map((effect) => (
          <div
            key={effect.id}
            className={`fx fx-${effect.kind}`}
            ref={(node) => {
              if (node) nodesRef.current.set(effect.id, node);
              else nodesRef.current.delete(effect.id);
            }}
          >
            <CourseFx kind={effect.kind} reduced={reduced}>
              {effect.kind === "bloom" ? (
                <BloomArt />
              ) : effect.kind === "scorch" ? (
                <ScorchArt />
              ) : effect.kind === "spill" ? (
                <SpillArt />
              ) : effect.kind === "chip" ? (
                <ChipArt />
              ) : (
                <GrowthArt kind={effect.kind} />
              )}
            </CourseFx>
          </div>
        ))}
        <div className="pig-slot" ref={pigRef} style={{ width: PIG_DRAW.width, height: PIG_DRAW.height }}>
          <VariantSprite
            sprite={variant.sprite}
            pose={pose}
            reduced={reduced}
            dancing={dancing}
            danceRun={danceRun}
            onDanceComplete={variant.finale === "arrival" ? finishArrival : undefined}
          />
        </div>
        {variant.showGrowthEcho ? (
          <div
            className="growth-echo"
            ref={echoNodeRef}
            data-on="0"
            style={{ width: PIG_DRAW.width, height: PIG_DRAW.height }}
          >
            <WilburSprite pose={pose} playing={false} reduced />
          </div>
        ) : null}
      </div>
      <div className="intro" aria-hidden={holding ? undefined : true}>
        <div className="intro-story">
          <p className="intro-title">{variant.introLabel}</p>
          <p className="intro-tag">{variant.introTag}</p>
        </div>
        <div className="intro-action">
          <p className="intro-begin">{BEGIN[hints]}</p>
          <p className="intro-steer">{STEER[hints]}</p>
        </div>
      </div>
      {fell ? (
        <div className="intro game-over" role="group" aria-labelledby="game-over-title">
          <div className="intro-story">
            <p className="intro-title" id="game-over-title">
              {variant.fellTitle}
            </p>
            <p className="intro-tag">{variant.fellNote}</p>
          </div>
          <div className="intro-action">
            <button type="button" className="btn btn-primary" ref={retryRef} onClick={onRetry}>
              {site.replay}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
