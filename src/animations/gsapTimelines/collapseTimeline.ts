import gsap from "gsap";
import { PIG_DRAW } from "../../assets/pig/metrics";
import type { Facing } from "../../model/types";

export interface CollapseMotion {
  x: number;
  y: number;
  scale: number;
  squashX: number;
  squashY: number;
  rotation: number;
  facing: Facing;
}

/**
 * Moves the same pig graphic from the game's foot-point to the pasture foot-point.
 * Viewport pixels, not physics. He stays at the jumper's size through the drop,
 * then eases to the pasture size on impact.
 */
export function applyPigFoot(pig: HTMLElement, motion: CollapseMotion): void {
  const width = PIG_DRAW.width;
  const height = PIG_DRAW.height;
  pig.style.transform = `translate(${motion.x - width / 2}px, ${motion.y - height}px) rotate(${motion.rotation}deg) scale(${motion.facing * motion.scale * motion.squashX}, ${motion.scale * motion.squashY})`;
}

export function createCollapseTimeline(options: {
  pig: HTMLElement;
  art: Element | null;
  line: HTMLElement | null;
  frame: HTMLElement;
  debris: HTMLElement[];
  dust: HTMLElement[];
  motion: CollapseMotion;
  landing: { x: number; y: number; scale: number };
  reduced: boolean;
  /** Same landing as the breakthrough, without the shake, debris, or crash. */
  gentle?: boolean;
  onComplete: () => void;
}): gsap.core.Timeline {
  const { pig, art, line, frame, debris, dust, motion, landing, reduced, gentle = false } = options;
  // A gentle drop keeps the sanctuary up and only hides the pig still standing on it.
  const concealed = gentle ? ".pig-slot, .growth-echo" : ".world, .age-panel, .intro";
  options.frame.querySelectorAll<HTMLElement>(concealed).forEach((element) => {
    element.style.visibility = "hidden";
  });
  applyPigFoot(pig, motion);

  const apply = () => applyPigFoot(pig, motion);
  const timeline = gsap.timeline({ onComplete: options.onComplete });

  if (reduced) {
    timeline.to(motion, {
      x: landing.x,
      y: landing.y,
      scale: landing.scale,
      rotation: 0,
      duration: 0.35,
      ease: "power1.out",
      onUpdate: apply,
    });
    timeline.to(frame, { opacity: 0, duration: 0.35 }, 0);
    return timeline;
  }

  if (gentle) {
    // He is already on all fours. Motion starts on that frame, so the settle does not cut to a fall pose.
    timeline.addLabel("fall", 0);
    timeline.addLabel("land", 0.92);
    timeline.to(frame, { opacity: 0, duration: 0.6, ease: "power1.in" }, 0.35);
    timeline.to(
      motion,
      {
        x: landing.x,
        y: landing.y,
        rotation: motion.facing * 6,
        duration: 0.92,
        ease: "power3.in",
        onUpdate: apply,
      },
      "fall",
    );
    timeline.call(() => art?.setAttribute("data-pose", "land"), [], "land");
    timeline.to(motion, { scale: landing.scale, duration: 0.45, ease: "power2.out", onUpdate: apply }, "land");
    timeline.to(motion, { rotation: 0, duration: 0.3, ease: "power2.out", onUpdate: apply }, "land");
    timeline.to(motion, { squashX: 1.1, squashY: 0.88, duration: 0.08, onUpdate: apply }, "land");
    timeline.to(motion, { squashX: 1, squashY: 1, duration: 0.38, ease: "power2.out", onUpdate: apply }, "land+=0.1");
    dust.forEach((speck, index) => {
      gsap.set(speck, {
        left: landing.x + (index === 0 ? -18 : 12),
        top: landing.y - 6,
        opacity: 0,
      });
      timeline.to(speck, { opacity: 0.35, scale: 1.15, duration: 0.16 }, "land");
      timeline.to(speck, { opacity: 0, y: -10, duration: 0.4 }, "land+=0.12");
    });
    timeline.call(() => art?.setAttribute("data-pose", "idle"), [], "land+=0.34");
    return timeline;
  }

  timeline.addLabel("fall", 0.16);
  timeline.addLabel("land", 1.02);

  timeline.to(
    frame,
    {
      keyframes: [
        { x: -14, y: 6, rotation: -1.2, duration: 0.05 },
        { x: 12, y: -5, rotation: 1, duration: 0.05 },
        { x: -10, y: 4, rotation: -0.8, duration: 0.05 },
        { x: 9, y: -3, rotation: 0.6, duration: 0.05 },
        { x: -6, y: 2, rotation: -0.4, duration: 0.05 },
        { x: 4, y: 0, rotation: 0.2, duration: 0.05 },
      ],
      ease: "none",
    },
    0,
  );
  timeline.to(frame, { opacity: 0, duration: 0.55, ease: "power1.in" }, 0.62);

  debris.forEach((piece, index) => {
    const direction = index % 2 === 0 ? -1 : 1;
    timeline.to(
      piece,
      {
        y: Math.min(window.innerHeight * 0.72, 640),
        rotation: direction * (28 + (index % 5) * 14),
        opacity: 0,
        duration: 0.82 + (index % 4) * 0.06,
        ease: "power2.in",
      },
      0.08 + index * 0.025,
    );
  });

  timeline.call(() => art?.setAttribute("data-pose", "fall"), [], "fall");
  if (line) {
    timeline.fromTo(line, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2 }, "fall");
  }
  timeline.to(
    motion,
    {
      x: landing.x,
      y: landing.y,
      rotation: motion.facing * 16,
      duration: 0.78,
      ease: "power2.in",
      onUpdate: apply,
    },
    "fall",
  );
  timeline.call(
    () => {
      art?.setAttribute("data-pose", "land");
      if (line) line.textContent = "oof";
    },
    [],
    "land",
  );
  timeline.to(motion, { scale: landing.scale, duration: 0.55, ease: "power2.out", onUpdate: apply }, "land");
  timeline.to(motion, { rotation: 0, duration: 0.16, ease: "power2.out", onUpdate: apply }, "land");
  timeline.to(motion, { squashX: 1.18, squashY: 0.74, duration: 0.08, onUpdate: apply }, "land+=0.05");
  timeline.to(
    motion,
    { squashX: 1, squashY: 1, duration: 0.42, ease: "elastic.out(1, 0.55)", onUpdate: apply },
    "land+=0.14",
  );

  dust.forEach((speck, index) => {
    gsap.set(speck, {
      left: landing.x + (index === 0 ? -24 : 16),
      top: landing.y - 8,
      opacity: 0,
    });
    timeline.to(speck, { opacity: 0.85, scale: 1.5, duration: 0.16 }, "land");
    timeline.to(speck, { opacity: 0, y: -18, duration: 0.45 }, "land+=0.12");
  });

  if (line) timeline.to(line, { opacity: 0, duration: 0.3 }, "land+=0.35");
  timeline.call(() => art?.setAttribute("data-pose", "idle"), [], "land+=0.48");
  return timeline;
}
