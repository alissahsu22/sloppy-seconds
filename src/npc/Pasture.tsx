import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NPC_SCALE, PIG_DRAW } from "../assets/pig/metrics";
import { PigCharacter } from "../components/PigCharacter/PigCharacter";
import type { AnimalDefinition } from "../content/animals/types";
import type { Facing, NpcStateId, PigPose } from "../model/types";
import type { FoundDiscovery } from "../progress/storage";
import { clamp } from "../utils/math";
import {
  applyClick,
  applyHover,
  createNpcMemory,
  stepNpc,
} from "./behaviorMachine/machine";
import type { NpcContext, NpcMemory } from "./behaviorMachine/types";
import { pointerIsNearPig } from "./interactions/proximity";

interface View {
  pose: PigPose;
  facing: Facing;
  state: NpcStateId;
  bubble: string | null;
  walkTarget: number | null;
  token: number;
}

export function Pasture({
  animal,
  found,
  startX,
  startFacing,
  visible,
  reduced,
  holdState,
  suspended = false,
  onFind,
}: {
  animal: AnimalDefinition;
  found: FoundDiscovery[];
  startX: number;
  startFacing: Facing;
  visible: boolean;
  reduced: boolean;
  holdState: NpcStateId | null;
  /** Freezes the walk and pose loop while the Field Guide replaces the ending. */
  suspended?: boolean;
  onFind: (found: FoundDiscovery) => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
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
  const visibleRef = useRef(visible);
  const holdRef = useRef(holdState);
  const suspendedRef = useRef(suspended);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
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
  visibleRef.current = visible;
  holdRef.current = holdState;
  suspendedRef.current = suspended;

  const apply = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const facing = memoryRef.current.facing;
    anchor.style.transform = `translate(${motionRef.current.x - PIG_DRAW.width / 2}px, 0) scale(${facing * NPC_SCALE}, ${NPC_SCALE})`;
  };

  const publish = (memory: NpcMemory) => {
    setView((current) => ({
      pose: memory.pose,
      facing: memory.facing,
      state: memory.state,
      bubble: memory.bubble,
      walkTarget: memory.walkTarget,
      token:
        current.state !== memory.state || current.walkTarget !== memory.walkTarget
          ? current.token + 1
          : current.token,
    }));
  };

  const makeCtx = (): NpcContext => {
    const pointer = pointerRef.current;
    return {
      x: motionRef.current.x,
      width: window.innerWidth,
      pointerX: pointer?.x ?? null,
      pointerNear: pointer ? pointerIsNearPig(pointer.x, pointer.y, motionRef.current.x) : false,
      enrichmentX: null,
      discoveriesLeft: animal.discoveries.filter(
        (item) => !foundRef.current.some((foundItem) => foundItem.id === item.id),
      ).length,
      paused: !visibleRef.current || document.hidden || suspendedRef.current,
      holdState: holdRef.current,
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
        const next = animal.discoveries.find(
          (item) => !foundRef.current.some((foundItem) => foundItem.id === item.id),
        );
        if (next) {
          const x = clamp(motionRef.current.x + (Math.random() * 36 - 18), 64, window.innerWidth - 64);
          onFindRef.current({ id: next.id, x });
          const lines = profile.lines.found;
          memoryRef.current = {
            ...memoryRef.current,
            bubble: lines[Math.floor(Math.random() * lines.length)] ?? "look",
            bubbleUntil: now + 1700,
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
      if (now - last < 1500 || !visibleRef.current || document.hidden) return;
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
  }, [animal]);

  const onPig = () => {
    const next = applyClick(memoryRef.current, animal.behavior, makeCtx(), performance.now(), Math.random);
    memoryRef.current = next;
    publish(next);
  };

  return (
    <>
      <div
        ref={anchorRef}
        className={`pig-anchor${visible ? "" : " is-hidden"}`}
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
          <PigCharacter pose={view.pose} ambient={visible && !suspended} reduced={reduced} />
        </button>
        {view.bubble ? (
          <span className="bubble" role="status">
            {view.bubble}
          </span>
        ) : null}
      </div>
    </>
  );
}
