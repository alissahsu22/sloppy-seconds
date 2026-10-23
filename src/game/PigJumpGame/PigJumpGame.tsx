import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PlatformArt } from "../../assets/environment/scenery";
import { site } from "../../content/site";
import { MILESTONES, gameAgeLabel, milestoneAt, type AgeMilestone } from "../progression/age";
import { WilburSprite } from "../../assets/pig/WilburSprite";
import { PIG_DRAW } from "../../assets/pig/metrics";
import type { PigPose } from "../../model/types";
import { platformSignature, resizeWorld } from "../physics/platforms";
import { BOUNCE_VY } from "../physics/constants";
import { createWorld, jumpProgress, stepWorld } from "../physics/step";
import type { World } from "../physics/types";
import { flipReadout, settleReadout } from "./readout";
import { measureEscape, paintEcho, paintWorld, poseForBody, writeCaption, type GrowthEcho } from "./paint";
import { clamp01, lerp } from "../../utils/math";
import type { EscapePayload, GameHandle } from "./types";
import type { LandingPulse } from "../physics/types";

interface PigJumpGameProps {
  active: boolean;
  reduced: boolean;
  onCollapse: (payload: EscapePayload) => void;
  onLanding?: (landing: LandingPulse) => void;
  onStart?: () => void;
  onRetry: () => void;
}

/** Game seconds a milestone note stays under the age. Game time, so it holds while the tab is hidden. */
const NOTE_SECONDS = 4.5;
/** The size change plays first. The age turns once he has finished growing. */
const GROW_SECONDS = 0.35;
const AGE_DELAY = 0.45;
const START_AGE = gameAgeLabel(MILESTONES[0]);

/** Phones and tablets get tap wording. A laptop with a touchscreen still has a fine pointer, so it keeps the keys. */
const coarsePointer = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: coarse)").matches
    : false;

/**
 * Rendering is a copy of the physics world onto transforms.
 * React state changes only when a plank's crack state changes. The age readout, its note, and the growth echo are written directly.
 */
export const PigJumpGame = forwardRef<GameHandle, PigJumpGameProps>(function PigJumpGame(
  { active, reduced, onCollapse, onLanding, onStart, onRetry },
  ref,
) {
  const frameRef = useRef<HTMLElement>(null);
  const worldElRef = useRef<HTMLDivElement>(null);
  const pigRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const echoNodeRef = useRef<HTMLDivElement>(null);
  const ageLiveRef = useRef<HTMLParagraphElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const readoutTurnRef = useRef<ReturnType<typeof flipReadout>>(null);
  /** Drawn size: eases from `from` to `to` starting at `startedAt` (game time). */
  const growRef = useRef({ from: MILESTONES[0].scale, to: MILESTONES[0].scale, startedAt: 0 });
  const echoRef = useRef<GrowthEcho | null>(null);
  /** A milestone reached in the air waits here for a safe landing. */
  const pendingGrowthRef = useRef<AgeMilestone | null>(null);
  const pendingAgeRef = useRef<{ milestone: AgeMilestone; at: number } | null>(null);
  const noteUntilRef = useRef(0);
  const worldRef = useRef<World | null>(null);
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const onCollapseRef = useRef(onCollapse);
  const onLandingRef = useRef(onLanding);
  const activeRef = useRef(active);
  const reducedRef = useRef(reduced);
  const poseRef = useRef<PigPose>("idle");
  const holdingRef = useRef(true);
  const onStartRef = useRef(onStart);
  const [touch] = useState(coarsePointer);
  const [holding, setHolding] = useState(true);
  const [ready, setReady] = useState(false);
  const [pose, setPose] = useState<PigPose>("idle");
  const [fell, setFell] = useState(false);
  const [platforms, setPlatforms] = useState<{ id: string; stage: World["platforms"][number]["stage"]; falling: boolean; wobble: boolean }[]>([]);

  onCollapseRef.current = onCollapse;
  onLandingRef.current = onLanding;
  onStartRef.current = onStart;
  activeRef.current = active;
  reducedRef.current = reduced;

  const syncPlatforms = (world: World) => {
    setPlatforms(
      world.platforms.map((platform) => ({
        id: platform.id,
        stage: platform.stage,
        falling: platform.falling,
        wobble: world.time < platform.wobbleUntil,
      })),
    );
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
    const nextPose = holdingRef.current ? "idle" : poseForBody(world);
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
    const age = gameAgeLabel(milestone);
    const readout = readoutRef.current;
    if (readout) {
      stopReadout();
      readoutTurnRef.current = flipReadout(readout, age, reducedRef.current);
    }
    const note = noteRef.current;
    if (note) {
      writeCaption(note, milestone);
      note.dataset.show = "1";
      noteUntilRef.current = world.time + NOTE_SECONDS;
    }
    announce(`${site.ageLabel}: ${age}. ${milestone.label} ${milestone.tagline}`);
  };

  useLayoutEffect(() => {
    const worldEl = worldElRef.current;
    if (!worldEl) return;
    const world = createWorld({
      width: Math.max(280, worldEl.clientWidth),
      height: Math.max(220, worldEl.clientHeight),
    });
    worldRef.current = world;
    syncPlatforms(world);
    setReady(true);
    return () => {
      world.over = true;
      stopReadout();
      setReady(false);
    };
  }, []);

  useLayoutEffect(() => {
    const world = worldRef.current;
    if (!world || !ready) return;
    paint(world);
  }, [platforms, ready]);

  const release = () => {
    const world = worldRef.current;
    if (!world || world.over || !holdingRef.current) return;
    holdingRef.current = false;
    world.pig.vy = BOUNCE_VY;
    announce(`${site.ageLabel}: ${START_AGE}.`);
    setHolding(false);
    onStartRef.current?.();
  };

  useImperativeHandle(ref, () => ({
    setProgress(progress: number) {
      const world = worldRef.current;
      if (!world || world.over) return;
      release();
      jumpProgress(world, progress);
      const milestone = milestoneAt(world.progress);
      if (milestone.scale !== growRef.current.to) grow(world, milestone);
      paint(world);
      syncPlatforms(world);
    },
    collapseNow() {
      const world = worldRef.current;
      if (!world || world.over) return;
      release();
      world.finaleRequested = true;
    },
  }));

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
        const before = platformSignature(world.platforms, world.time);
        const events = stepWorld(world, dt);
        paint(world);
        if (events.milestoneChanged) {
          const milestone = milestoneAt(world.progress);
          if (milestone.at >= 1) grow(world, milestone);
          else pendingGrowthRef.current = milestone;
        }
        if (events.fell) {
          stopReadout();
          hideNote();
          announce(`${site.fellTitle} ${site.fellNote}`);
          setFell(true);
          return;
        }
        const safe = events.landed !== null && events.landed.outcome !== "break";
        if (pendingGrowthRef.current && safe) grow(world, pendingGrowthRef.current);
        const pendingAge = pendingAgeRef.current;
        if (pendingAge && world.time >= pendingAge.at) showAge(world, pendingAge.milestone);
        if (noteUntilRef.current && world.time >= noteUntilRef.current) hideNote();
        if (events.landed) onLandingRef.current?.(events.landed);
        if (platformSignature(world.platforms, world.time) !== before) syncPlatforms(world);
        if (events.finale) {
          world.over = true;
          // He leaves at the size he is growing into, even if the expansion hasn't finished.
          const milestone = milestoneAt(world.progress);
          if (milestone.scale !== growRef.current.to) grow(world, milestone);
          onCollapseRef.current(
            measureEscape(world, worldEl, frame, nodesRef.current, reducedRef.current, growRef.current.to),
          );
          return;
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [ready]);

  useEffect(() => {
    const worldEl = worldElRef.current;
    if (!worldEl || !ready) return;
    const observer = new ResizeObserver(() => {
      const world = worldRef.current;
      if (!world || world.over) return;
      const width = Math.max(280, worldEl.clientWidth);
      const height = Math.max(220, worldEl.clientHeight);
      if (width === world.width && height === world.height) return;
      resizeWorld(world, width, height);
      paint(world);
    });
    observer.observe(worldEl);
    return () => observer.disconnect();
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

  return (
    <section
      className="stage"
      ref={frameRef}
      tabIndex={0}
      data-holding={holding ? "1" : undefined}
      data-fallen={fell ? "1" : undefined}
      data-strain="frame"
      data-autofocus=""
      aria-label={site.gameLabel}
    >
      <p className="sr-only" ref={ageLiveRef} aria-live="polite" />
      <div className="age-panel" aria-hidden="true">
        <div className="age-readout" ref={readoutRef} data-debris="badge" data-label={START_AGE}>
          <span className="age-readout-label">{site.ageLabel}</span>
          <span className="age-readout-page">
            {MILESTONES.map((milestone) => (
              <span className="age-readout-sizer" key={milestone.id}>{gameAgeLabel(milestone)}</span>
            ))}
            <span className="age-readout-value">{START_AGE}</span>
          </span>
        </div>
        <div className="age-note" ref={noteRef} data-show="0" data-debris="badge">
          <p className="age-headline" />
          <p className="age-tag" />
        </div>
      </div>
      <div className="world" ref={worldElRef}>
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`platform${platform.falling ? " is-falling" : ""}`}
            data-stage={platform.stage}
            data-wobble={platform.wobble ? "1" : "0"}
            ref={(node) => {
              if (node) nodesRef.current.set(platform.id, node);
              else nodesRef.current.delete(platform.id);
            }}
          >
            <div className="platform-skin">
              <PlatformArt stage={platform.stage} />
            </div>
          </div>
        ))}
        <div
          className="pig-slot"
          ref={pigRef}
          style={{ width: PIG_DRAW.width, height: PIG_DRAW.height }}
        >
          <WilburSprite pose={pose} reduced={reduced} />
        </div>
        <div
          className="growth-echo"
          ref={echoNodeRef}
          data-on="0"
          style={{ width: PIG_DRAW.width, height: PIG_DRAW.height }}
        >
          <WilburSprite pose={pose} playing={false} reduced />
        </div>
      </div>
      <div className="intro" aria-hidden={holding ? undefined : true}>
        <div className="intro-story">
          <p className="intro-title">{MILESTONES[0].label}</p>
          <p className="intro-tag">{MILESTONES[0].tagline}</p>
        </div>
        <div className="intro-action">
          <p className="intro-begin">{touch ? site.beginTouch : site.begin}</p>
          <p className="intro-steer">{touch ? site.steerTouch : site.steer}</p>
        </div>
      </div>
      {fell ? (
        <div className="intro game-over" role="group" aria-labelledby="game-over-title">
          <div className="intro-story">
            <p className="intro-title" id="game-over-title">{site.fellTitle}</p>
            <p className="intro-tag">{site.fellNote}</p>
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
});
