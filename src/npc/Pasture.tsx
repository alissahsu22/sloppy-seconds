import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NPC_SCALE, PIG_DRAW } from "../assets/pig/metrics";
import { PigCharacter } from "../components/PigCharacter/PigCharacter";
import { StickerIcon } from "../components/Sticker/Sticker";
import type { AnimalDefinition, Discovery } from "../content/animals/types";
import type { Facing, NpcStateId, PigPose } from "../model/types";
import type { FoundDiscovery } from "../progress/storage";
import { clamp } from "../utils/math";
import { applyClick, applyHover, createNpcMemory, stepNpc } from "./behaviorMachine/machine";
import type { NpcContext, NpcMemory } from "./behaviorMachine/types";
import { bubbleLeft } from "./interactions/bubble";
import { pointerIsNearPig } from "./interactions/proximity";

interface View {
  pose: PigPose;
  facing: Facing;
  state: NpcStateId;
  bubble: string | null;
  walkTarget: number | null;
  token: number;
}

/** A sticker on the grass, waiting for the visitor to pick it up. */
interface Dropped {
  discovery: Discovery;
  x: number;
  /** Where it popped out of the pig, relative to where it lands. */
  fromX: number;
  tilt: number;
  collected: boolean;
}

const COLLECT_MS = 900;

export function Pasture({
  animal,
  found,
  startX,
  startFacing,
  reduced,
  suspended = false,
  onFind,
}: {
  animal: AnimalDefinition;
  found: FoundDiscovery[];
  startX: number;
  startFacing: Facing;
  reduced: boolean;
  /** Freezes the walk and pose loop while the Field Guide replaces the ending. */
  suspended?: boolean;
  onFind: (found: FoundDiscovery) => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const memoryRef = useRef<NpcMemory>(
    (() => {
      const initial = createNpcMemory(performance.now(), startX);
      initial.facing = startFacing;
      return initial;
    })(),
  );
  const motionRef = useRef({ x: startX });
  const foundRef = useRef(found);
  const onFindRef = useRef(onFind);
  const suspendedRef = useRef(suspended);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [dropped, setDropped] = useState<Dropped[]>([]);
  const droppedRef = useRef(dropped);
  droppedRef.current = dropped;
  const [view, setView] = useState<View>({
    pose: "idle",
    facing: startFacing,
    state: "idle",
    bubble: null,
    walkTarget: null,
    token: 0,
  });

  foundRef.current = found;
  onFindRef.current = onFind;
  suspendedRef.current = suspended;

  const apply = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const facing = memoryRef.current.facing;
    anchor.style.transform = `translate(${motionRef.current.x - PIG_DRAW.width / 2}px, 0) scale(${facing * NPC_SCALE}, ${NPC_SCALE})`;
    // The bubble rides beside him in page pixels, so it can turn to whichever side has room.
    const bubble = bubbleRef.current;
    if (bubble) {
      const lane = bubble.offsetParent instanceof HTMLElement ? bubble.offsetParent.clientWidth : window.innerWidth;
      bubble.style.left = `${bubbleLeft(motionRef.current.x, facing, bubble.offsetWidth, lane)}px`;
    }
  };

  // A new line has a new width, and a turn puts it on his other side.
  useLayoutEffect(apply, [view.bubble, view.facing]);

  useEffect(() => {
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const publish = (memory: NpcMemory) => {
    setView((current) => ({
      pose: memory.pose,
      facing: memory.facing,
      state: memory.state,
      bubble: memory.bubble,
      walkTarget: memory.walkTarget,
      token:
        current.state !== memory.state || current.walkTarget !== memory.walkTarget ? current.token + 1 : current.token,
    }));
  };

  // Found, or already lying on the grass. Either way he should not dig it up again.
  const isTaken = (id: string) =>
    foundRef.current.some((item) => item.id === id) || droppedRef.current.some((item) => item.discovery.id === id);

  const makeCtx = (): NpcContext => {
    const pointer = pointerRef.current;
    return {
      x: motionRef.current.x,
      width: window.innerWidth,
      pointerX: pointer?.x ?? null,
      pointerNear: pointer ? pointerIsNearPig(pointer.x, pointer.y, motionRef.current.x) : false,
      discoveriesLeft: animal.discoveries.filter((item) => !isTaken(item.id)).length,
      paused: document.hidden || suspendedRef.current,
    };
  };

  useGSAP(
    () => {
      const memory = memoryRef.current;
      if (suspended || memory.state !== "walking" || memory.walkTarget == null) {
        apply();
        return;
      }
      const proxy = { x: motionRef.current.x };
      const tween = gsap.to(proxy, {
        x: memory.walkTarget,
        duration: reduced ? 0.01 : Math.max(0.7, Math.abs(memory.walkTarget - proxy.x) / 88),
        ease: "power1.inOut",
        onUpdate: () => {
          motionRef.current.x = proxy.x;
          memoryRef.current.x = proxy.x;
          apply();
        },
      });
      return () => tween.kill();
    },
    { dependencies: [view.token, view.facing, reduced, suspended], scope: anchorRef },
  );

  useEffect(() => {
    const profile = animal.behavior;
    const tick = () => {
      if (document.hidden) return;
      const now = performance.now();
      const previous = memoryRef.current;
      const result = stepNpc(previous, makeCtx(), profile, now, Math.random);
      memoryRef.current = result.memory;
      if (result.unearthed) {
        const next = animal.discoveries.find((item) => !isTaken(item.id));
        if (next) {
          // Pop it out to one side so it lands clear of the pig and can be clicked.
          const pigX = motionRef.current.x;
          const side = Math.random() < 0.5 ? -1 : 1;
          const fling = 70 + Math.random() * 40;
          let x = pigX + side * fling;
          if (x < 40 || x > window.innerWidth - 40) x = pigX - side * fling;
          x = clamp(x, 40, window.innerWidth - 40);
          const sticker: Dropped = {
            discovery: next,
            x,
            fromX: pigX - x,
            tilt: Math.round(Math.random() * 24 - 12),
            collected: false,
          };
          droppedRef.current = [...droppedRef.current, sticker];
          setDropped(droppedRef.current);
          const lines = profile.lines.found;
          memoryRef.current = {
            ...memoryRef.current,
            bubble: lines[Math.floor(Math.random() * lines.length)] ?? "look!",
            bubbleUntil: now + 2600,
          };
        }
      }
      if (
        result.changed ||
        memoryRef.current.bubble !== previous.bubble ||
        memoryRef.current.state !== previous.state
      ) {
        publish(memoryRef.current);
      }
    };
    const interval = window.setInterval(tick, profile.tickMs);
    return () => {
      window.clearInterval(interval);
    };
    // The interval reads live values through refs. Animal identity is the config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal]);

  useEffect(() => {
    let last = 0;
    const onMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      const now = performance.now();
      if (now - last < 1500 || document.hidden) return;
      if (!pointerIsNearPig(event.clientX, event.clientY, motionRef.current.x)) return;
      last = now;
      const next = applyHover(memoryRef.current, animal.behavior, makeCtx(), now, Math.random);
      if (next.state !== memoryRef.current.state) {
        memoryRef.current = next;
        publish(next);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
    // makeCtx reads live values through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal]);

  const onPig = () => {
    const next = applyClick(memoryRef.current, animal.behavior, makeCtx(), performance.now(), Math.random);
    memoryRef.current = next;
    publish(next);
  };

  const collect = (sticker: Dropped) => {
    if (sticker.collected) return;
    onFindRef.current({ id: sticker.discovery.id, x: sticker.x });
    setDropped((current) => current.map((item) => (item === sticker ? { ...item, collected: true } : item)));
    window.setTimeout(
      () => setDropped((current) => current.filter((item) => item.discovery.id !== sticker.discovery.id)),
      reduced ? 1400 : COLLECT_MS,
    );
  };

  return (
    <>
      {dropped.map((sticker) => (
        <button
          key={sticker.discovery.id}
          type="button"
          className={`sticker-drop${sticker.collected ? " is-collected" : ""}`}
          style={
            {
              left: `${sticker.x}px`,
              "--from-x": `${sticker.fromX}px`,
              "--tilt": `${sticker.tilt}deg`,
            } as CSSProperties
          }
          onClick={() => collect(sticker)}
          disabled={sticker.collected}
          aria-label={`Sticker: ${sticker.discovery.title}. Pick it up for your Field Guide.`}
        >
          <span className="sticker-drop-face">
            <StickerIcon art={sticker.discovery.sticker} />
          </span>
          {sticker.collected ? (
            <span className="sticker-drop-toast" role="status">
              Added to Field Guide
            </span>
          ) : null}
        </button>
      ))}
      <div
        ref={anchorRef}
        className="pig-anchor"
        data-pose={view.pose}
        data-state={view.state}
        data-facing={view.facing}
      >
        <span className="ground-shadow" />
        <button
          type="button"
          className="pig-hit"
          onClick={onPig}
          aria-label={`${animal.displayName}. Activate for a reaction. He may be busy.`}
        >
          <PigCharacter pose={view.pose} ambient={!suspended} reduced={reduced} />
        </button>
      </div>
      {view.bubble ? (
        <span className="bubble" ref={bubbleRef} role="status">
          {view.bubble}
        </span>
      ) : null}
    </>
  );
}
