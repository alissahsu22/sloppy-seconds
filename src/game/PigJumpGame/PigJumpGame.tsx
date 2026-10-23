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
import { LIFE_STAGES, MILESTONES } from "../progression/age";
import { WilburSprite } from "../../assets/pig/WilburSprite";
import { PIG_DRAW } from "../../assets/pig/metrics";
import type { PigPose } from "../../model/types";
import { platformSignature, resizeWorld } from "../physics/platforms";
import { BOUNCE_VY } from "../physics/constants";
import { createWorld, jumpProgress, stepWorld } from "../physics/step";
import type { World } from "../physics/types";
import { measureEscape, paintAgeCue, paintWorld, poseForBody, writeAge } from "./paint";
import type { EscapePayload, GameHandle } from "./types";
import type { LandingPulse } from "../physics/types";

interface PigJumpGameProps {
  active: boolean;
  reduced: boolean;
  onCollapse: (payload: EscapePayload) => void;
  onLanding?: (landing: LandingPulse) => void;
  onStart?: () => void;
}

/**
 * Rendering is a copy of the physics world onto transforms.
 * React state changes only when a plank's crack state changes or the age label does.
 */
export const PigJumpGame = forwardRef<GameHandle, PigJumpGameProps>(function PigJumpGame(
  { active, reduced, onCollapse, onLanding, onStart },
  ref,
) {
  const frameRef = useRef<HTMLElement>(null);
  const worldElRef = useRef<HTMLDivElement>(null);
  const pigRef = useRef<HTMLDivElement>(null);
  const ageCardRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const onCollapseRef = useRef(onCollapse);
  const onLandingRef = useRef(onLanding);
  const activeRef = useRef(active);
  const reducedRef = useRef(reduced);
  const poseRef = useRef<PigPose>("idle");
  const holdingRef = useRef(true);
  const onStartRef = useRef(onStart);
  const [holding, setHolding] = useState(true);
  const [ready, setReady] = useState(false);
  const [pose, setPose] = useState<PigPose>("idle");
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

  const paint = (world: World) => {
    const pig = pigRef.current;
    if (!pig) return;
    paintWorld(world, nodesRef.current, pig, reducedRef.current);
    paintAgeCue(world, ageCardRef.current);
    const nextPose = holdingRef.current ? "idle" : poseForBody(world);
    if (nextPose !== poseRef.current) {
      poseRef.current = nextPose;
      setPose(nextPose);
    }
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
    writeAge(world, ageCardRef.current);
    setReady(true);
    return () => {
      world.over = true;
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
    setHolding(false);
    onStartRef.current?.();
  };

  useImperativeHandle(ref, () => ({
    setProgress(progress: number) {
      const world = worldRef.current;
      if (!world || world.over) return;
      release();
      jumpProgress(world, progress);
      writeAge(world, ageCardRef.current);
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
        if (events.milestoneChanged) writeAge(world, ageCardRef.current);
        if (events.landed) onLandingRef.current?.(events.landed);
        if (platformSignature(world.platforms, world.time) !== before) syncPlatforms(world);
        if (events.finale) {
          world.over = true;
          onCollapseRef.current(measureEscape(world, worldEl, frame, nodesRef.current, reducedRef.current));
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
      if (!activeRef.current) return;
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
      data-strain="frame"
      data-autofocus=""
      aria-label={site.gameLabel}
    >
      <div
        className="age-card"
        ref={ageCardRef}
        data-debris="badge"
        data-stage="piglet"
        data-label={`${LIFE_STAGES[0].label}. ${MILESTONES[0].tagline}`}
      >
        <p className="sr-only" data-age-live aria-live="polite">
          {`Age: ${LIFE_STAGES[0].label}. ${MILESTONES[0].tagline}`}
        </p>
        <div aria-hidden="true">
          <p className="age-kicker">{site.ageKicker}</p>
          <div className="age-compare">
            <span className="age-sil age-sil-ref">
              <WilburSprite pose="idle" playing={false} reduced={reduced} />
            </span>
            <span className="age-sil age-sil-now">
              <WilburSprite pose="idle" playing={false} reduced={reduced} />
            </span>
          </div>
          <p className="age-track">
            {LIFE_STAGES.map((stage, index) => (
              <span className="age-stage-wrap" key={stage.id}>
                {index > 0 ? <span className="age-arrow">→</span> : null}
                <span className={`age-stage${index === 0 ? " is-current" : ""}`} data-life={stage.id}>
                  {stage.label}
                </span>
              </span>
            ))}
          </p>
          <p className="age-tag">{MILESTONES[0].tagline}</p>
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
      </div>
      <p className="how" data-debris="note" data-label={site.steer}>
        {site.steer}
      </p>
      {holding ? <p className="begin-prompt">{site.begin}</p> : null}
    </section>
  );
});
