import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { CrackStage } from "../../model/types";
import type { PlatformSkin, WorldEffect } from "../../game/physics/types";
import {
  TOODLES_PLATFORM_CANVAS,
  TOODLES_PLATFORM_OFFSET_Y,
  TOODLES_PLATFORM_TILE_WIDTH,
  isToodlesPlatformArt,
  toodlesPlatformUrl,
  toodlesPlatformWalkY,
  type ToodlesPlatformArt,
} from "./toodlesPlatforms";

/**
 * Toodles' platforms. The collider is still the physics box.
 * The sprite's walk row sits on that box's top edge, and the drawing may overflow it.
 * Shift every sprite with TOODLES_PLATFORM_OFFSET_Y, or one sprite with TOODLES_PLATFORM_WALK_Y.
 */
export function CourseArt({ stage, skin, art }: { stage: CrackStage; skin: PlatformSkin; art?: string }) {
  const name = resolveArt(art, skin, stage);
  if (skin === "bench") return <TiledPlatform name={name} />;
  return <PixelPlatform name={name} />;
}

function resolveArt(art: string | undefined, skin: PlatformSkin, stage: CrackStage): ToodlesPlatformArt {
  if (isToodlesPlatformArt(art)) return art;
  if (skin === "meadow") return "grass_04_flowers";
  if (skin === "overgrown") return "tube_06_grassy";
  if (skin === "tube-moss") return "tube_05_mossy";
  if (stage === "broken" || stage === "major") return "tube_03_leaking";
  if (stage === "hairline") return "tube_02_cracked";
  return "tube_01_clean";
}

function PixelPlatform({ name }: { name: ToodlesPlatformArt }) {
  const walk = toodlesPlatformWalkY(name);
  const shift = (-walk / TOODLES_PLATFORM_CANVAS.height) * 100;
  return (
    <img
      className="platform-pixel"
      src={toodlesPlatformUrl(name)}
      alt=""
      draggable={false}
      style={{ transform: `translateY(calc(${shift}% + ${TOODLES_PLATFORM_OFFSET_Y}px))` }}
    />
  );
}

function TiledPlatform({ name }: { name: ToodlesPlatformArt }) {
  const walk = toodlesPlatformWalkY(name);
  const tileH = TOODLES_PLATFORM_TILE_WIDTH * (TOODLES_PLATFORM_CANVAS.height / TOODLES_PLATFORM_CANVAS.width);
  const top = (-walk / TOODLES_PLATFORM_CANVAS.height) * tileH + TOODLES_PLATFORM_OFFSET_Y;
  return (
    <div
      className="platform-pixel-tile"
      style={{
        backgroundImage: `url("${toodlesPlatformUrl(name)}")`,
        backgroundSize: `${TOODLES_PLATFORM_TILE_WIDTH}px ${tileH}px`,
        height: tileH,
        top,
      }}
    />
  );
}

export function SpillArt() {
  return (
    <svg className="fx-svg" viewBox="0 0 80 36" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M40 0 C46 10 52 12 48 18 C74 18 80 28 40 34 C2 28 8 18 32 18 C28 12 34 10 40 0 Z"
        fill="var(--color-lab-glow)"
      />
      <ellipse cx="40" cy="26" rx="20" ry="5" fill="var(--color-lab-glow-deep)" opacity="0.7" />
    </svg>
  );
}

export function ScorchArt() {
  return (
    <svg className="fx-svg" viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="60" cy="16" rx="56" ry="9" fill="var(--color-ink)" opacity="0.22" />
      <ellipse cx="62" cy="16" rx="28" ry="5" fill="var(--color-lab-glow)" opacity="0.45" />
    </svg>
  );
}

/** Landing burst. Stems sit on the bottom of the box so they meet the platform. */
export function BloomArt() {
  return (
    <svg
      className="fx-svg"
      viewBox="0 0 56 36"
      preserveAspectRatio="xMidYMax meet"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <BloomFlower x={6} fill="var(--color-sticker-pink)" />
      <BloomFlower x={24} fill="var(--color-sticker-gold)" />
      <BloomFlower x={42} fill="var(--color-sticker-pink)" />
    </svg>
  );
}

/** Glass kicking off a tube. The shards sit on the bottom edge, on the glass. */
export function ChipArt() {
  return (
    <svg
      className="fx-svg"
      viewBox="0 0 52 30"
      preserveAspectRatio="xMidYMax meet"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="6" y="18" width="6" height="4" fill="var(--color-ink)" />
      <rect x="8" y="12" width="4" height="6" fill="var(--color-lab-glow)" />
      <rect x="10" y="8" width="3" height="4" fill="var(--color-ink)" />
      <rect x="22" y="20" width="8" height="4" fill="var(--color-ink)" />
      <rect x="24" y="10" width="4" height="10" fill="var(--color-surface)" />
      <rect x="25" y="6" width="2" height="4" fill="var(--color-ink)" />
      <rect x="36" y="16" width="7" height="4" fill="var(--color-ink)" />
      <rect x="38" y="8" width="4" height="8" fill="var(--color-lab-glow)" />
    </svg>
  );
}

/** A plant popping out of the landing. Same monochrome as the lab, until the flowers. */
export function GrowthArt({ kind }: { kind: "sprout" | "moss" | "grass" }) {
  if (kind === "moss") {
    return (
      <svg
        className="fx-svg"
        viewBox="0 0 56 22"
        preserveAspectRatio="xMidYMax meet"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="4" y="12" width="16" height="8" fill="var(--color-moss-deep)" />
        <rect x="8" y="8" width="10" height="6" fill="var(--color-moss)" />
        <rect x="22" y="10" width="14" height="10" fill="var(--color-moss-deep)" />
        <rect x="26" y="6" width="8" height="6" fill="var(--color-moss)" />
        <rect x="38" y="12" width="14" height="8" fill="var(--color-moss-deep)" />
      </svg>
    );
  }
  if (kind === "grass") {
    return (
      <svg
        className="fx-svg"
        viewBox="0 0 56 36"
        preserveAspectRatio="xMidYMax meet"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <Tuft x={4} />
        <Tuft x={22} />
        <Tuft x={40} />
      </svg>
    );
  }
  return (
    <svg
      className="fx-svg"
      viewBox="0 0 28 36"
      preserveAspectRatio="xMidYMax meet"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="12" y="16" width="4" height="18" fill="var(--color-moss-deep)" />
      <rect x="4" y="10" width="10" height="6" fill="var(--color-moss)" />
      <rect x="14" y="6" width="10" height="6" fill="var(--color-moss-deep)" />
      <rect x="10" y="4" width="6" height="4" fill="var(--color-ink)" />
    </svg>
  );
}

function Tuft({ x }: { x: number }) {
  return (
    <g>
      <rect x={x + 4} y={14} width="4" height="20" fill="var(--color-moss-deep)" />
      <rect x={x} y={8} width="4" height="16" fill="var(--color-moss-deep)" />
      <rect x={x + 8} y={10} width="4" height="14" fill="var(--color-moss)" />
    </g>
  );
}

/** Pop flowers and glass splashes. Reduced motion shows the drawing still. */
export function CourseFx({
  kind,
  reduced,
  children,
}: {
  kind: WorldEffect["kind"];
  reduced: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const node = ref.current;
      if (!node || reduced) return;
      if (kind === "bloom" || kind === "sprout" || kind === "moss" || kind === "grass") {
        gsap.fromTo(
          node,
          { scale: 0.2, opacity: 0.35 },
          { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)", transformOrigin: "50% 100%" },
        );
      } else if (kind === "chip") {
        gsap.fromTo(
          node,
          { y: 8, opacity: 0, scale: 0.6 },
          { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power2.out", transformOrigin: "50% 100%" },
        );
      } else if (kind === "spill") {
        gsap.fromTo(
          node,
          { scaleY: 0.15, opacity: 0.4 },
          { scaleY: 1, opacity: 1, duration: 0.32, ease: "power2.out", transformOrigin: "50% 0%" },
        );
      } else {
        gsap.fromTo(node, { opacity: 0 }, { opacity: 0.8, duration: 0.35, ease: "power1.out" });
      }
    },
    { dependencies: [kind, reduced] },
  );
  return (
    <div className="fx-art" ref={ref}>
      {children}
    </div>
  );
}

function BloomFlower({ x, fill }: { x: number; fill: string }) {
  return (
    <g>
      <rect x={x + 3} y={16} width="2" height="16" fill="var(--color-moss-deep)" />
      <rect x={x} y={8} width="8" height="8" fill={fill} />
      <rect x={x + 3} y={11} width="2" height="2" fill="var(--color-surface)" />
    </g>
  );
}
