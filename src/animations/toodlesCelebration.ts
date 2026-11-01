import gsap from "gsap";

/**
 * Optional lift during the looping dance only, in pixels on the frame.
 * 0 keeps his feet planted on the sanctuary platform. The frames do the dancing.
 * Rise, settle, and the return to idle are not hopped.
 */
export const TOODLES_HOP_PX = 0;

/**
 * A small hop in place for the middle dance. The frame sequence owns the poses.
 * This timeline is killed before he settles so the feet line stays put.
 */
export function playToodlesCelebration(
  node: HTMLElement,
  seconds: number,
  reduced: boolean,
  onComplete?: () => void,
): () => void {
  if (reduced || seconds <= 0 || TOODLES_HOP_PX <= 0) {
    if (!onComplete) return () => undefined;
    const timer = window.setTimeout(onComplete, 0);
    return () => window.clearTimeout(timer);
  }
  const hops = 4;
  const hop = seconds / hops;
  const timeline = gsap.timeline({ onComplete });
  for (let index = 0; index < hops; index += 1) {
    const direction = index % 2 === 0 ? -1 : 1;
    timeline.to(node, {
      y: -TOODLES_HOP_PX,
      rotation: direction * 5,
      duration: hop * 0.42,
      ease: "power2.out",
    });
    timeline.to(node, { y: 0, rotation: 0, duration: hop * 0.58, ease: "bounce.out" });
  }
  return () => {
    timeline.kill();
  };
}
