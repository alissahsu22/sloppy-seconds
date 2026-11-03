import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { getAnimalKit } from "../animals/registry";
import { PlatformArt } from "../assets/environment/scenery";
import { PIG_DRAW } from "../assets/pig/metrics";
import { clamp } from "../utils/math";
import type { EscapePayload } from "../game/PigJumpGame/types";
import type { Facing } from "../model/types";
import { walkBounds } from "../npc/behaviorMachine/machine";
import { createCollapseTimeline, type CollapseMotion } from "./gsapTimelines/collapseTimeline";

export function EscapeSequence({
  payload,
  ground,
  reduced,
  sprite,
  gentle = false,
  onDone,
}: {
  payload: EscapePayload;
  ground: HTMLElement | null;
  reduced: boolean;
  /** Which animal is landing. */
  sprite: string;
  /** An "arrival" ending: lowers onto the pasture after the dance instead of breaking through. */
  gentle?: boolean;
  onDone: (landing: { x: number; facing: Facing }) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const pigRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const art = getAnimalKit(sprite).art;
  const { Sprite } = art;

  useGSAP(
    () => {
      const pig = pigRef.current;
      const layer = layerRef.current;
      if (!pig || !layer || !ground) return;
      const strip = ground.getBoundingClientRect();
      const bar = Number.parseFloat(getComputedStyle(ground).getPropertyValue("--bar")) || 0;
      const lane = walkBounds(window.innerWidth);
      const landing = {
        x: gentle
          ? clamp(payload.footX, lane.min, lane.max)
          : clamp(payload.footX, 210, Math.max(230, window.innerWidth - 190)),
        y: strip.bottom - bar,
        scale: art.pastureScale,
      };
      const motion: CollapseMotion = {
        x: payload.footX,
        y: payload.footY,
        scale: payload.scale,
        squashX: 1,
        squashY: 1,
        rotation: gentle ? 0 : payload.tilt,
        facing: payload.facing,
      };
      const timeline = createCollapseTimeline({
        pig,
        art: pig.querySelector(`.${art.spriteClass}`),
        line: gentle ? null : layer.querySelector(".fall-line"),
        frame: payload.frame,
        debris: Array.from(layer.querySelectorAll<HTMLElement>(".debris")),
        dust: Array.from(layer.querySelectorAll<HTMLElement>(".dust")),
        motion,
        landing,
        reduced,
        gentle,
        onComplete: () => {
          if (done.current) return;
          done.current = true;
          onDone({ x: landing.x, facing: payload.facing });
        },
      });
      return () => {
        timeline.kill();
      };
    },
    { scope: layerRef, dependencies: [] },
  );

  return (
    <div className="escape-layer" ref={layerRef} aria-hidden="true">
      {payload.pieces.map((piece) =>
        piece.kind === "platform" ? (
          <div
            key={piece.id}
            className="debris plank-bit"
            style={{ left: piece.x, top: piece.y, width: piece.width, height: piece.height }}
          >
            <PlatformArt stage={piece.stage ?? "major"} art={piece.art} />
          </div>
        ) : (
          <div
            key={piece.id}
            className={`debris ${piece.kind === "cloud" ? "cloud-bit" : "chip-bit"} ${piece.className ?? ""}`}
            style={{ left: piece.x, top: piece.y, width: piece.width, height: piece.height }}
          >
            {piece.kind === "chip" ? piece.label : null}
          </div>
        ),
      )}
      <div ref={pigRef} className="escape-pig" style={{ width: PIG_DRAW.width, height: PIG_DRAW.height }}>
        {gentle ? (
          <Sprite pose="idle" holdFrame={reduced ? undefined : art.settleFrame} playing={false} reduced={reduced} />
        ) : (
          <Sprite pose="fall" playing={!reduced} reduced={reduced} />
        )}
        {gentle ? null : (
          <span className="fall-read" data-facing={payload.facing}>
            <span className="fall-line">coming through</span>
          </span>
        )}
      </div>
      <span className="dust" />
      <span className="dust dust-b" />
    </div>
  );
}
