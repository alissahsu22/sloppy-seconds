import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { WilburSprite } from "../assets/pig/WilburSprite";
import { ToodlesSprite } from "../assets/pig/ToodlesSprite";
import { TOODLES_DANCE_SETTLE } from "../assets/pig/toodles";
import { PlatformArt } from "../assets/environment/scenery";
import { PIG_DRAW, NPC_SCALE, PASTURE_SCALE } from "../assets/pig/metrics";
import { clamp } from "../utils/math";
import type { EscapePayload } from "../game/PigJumpGame/types";
import type { Facing } from "../model/types";
import { walkBounds } from "../npc/behaviorMachine/machine";
import { createCollapseTimeline, type CollapseMotion } from "./gsapTimelines/collapseTimeline";

export function EscapeSequence({
  payload,
  ground,
  reduced,
  gentle = false,
  onDone,
}: {
  payload: EscapePayload;
  ground: HTMLElement | null;
  reduced: boolean;
  /** After Toodles dances, he lowers onto the pasture instead of breaking through. */
  gentle?: boolean;
  onDone: (landing: { x: number; facing: Facing }) => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const pigRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);

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
        scale: gentle ? PASTURE_SCALE.toodles : NPC_SCALE,
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
      const art = pig.querySelector(gentle ? ".toodles-sprite" : ".wilbur-sprite");
      const timeline = createCollapseTimeline({
        pig,
        art,
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
          <ToodlesSprite
            pose="idle"
            holdFrame={reduced ? undefined : TOODLES_DANCE_SETTLE[TOODLES_DANCE_SETTLE.length - 1]}
            playing={false}
            reduced={reduced}
          />
        ) : (
          <WilburSprite pose="fall" playing={!reduced} reduced={reduced} />
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
