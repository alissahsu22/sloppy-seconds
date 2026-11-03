import gsap from "gsap";

function animationTargets(animation: gsap.core.Animation): unknown[] {
  const candidate = animation as gsap.core.Animation & { targets?: () => unknown[] };
  return typeof candidate.targets === "function" ? candidate.targets() : [];
}

function relevantTarget(target: unknown, root: HTMLElement | null): boolean {
  if (!(target instanceof Node)) return false;
  if (root?.contains(target)) return true;
  return target instanceof Element && Boolean(target.closest("[data-ss-strain]"));
}

/**
 * Pauses tweens that touch the embed or a host element it was asked to strain.
 * The global timeline is left running so other libraries on the page keep going.
 */
export function bindWidgetMotion(root: HTMLElement): () => void {
  const paused = new Set<gsap.core.Animation>();
  const owned = (animation: gsap.core.Animation) =>
    animationTargets(animation).some((target) => relevantTarget(target, root));

  const onVisibility = () => {
    const children = gsap.globalTimeline.getChildren(true, true, true);
    if (document.hidden) {
      for (const child of children) {
        if (!owned(child) || child.paused()) continue;
        child.pause();
        paused.add(child);
      }
      return;
    }
    for (const child of paused) child.resume();
    paused.clear();
  };

  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    for (const child of paused) child.resume();
    paused.clear();
  };
}

/** Stops leftover tweens inside a shadow root after React has unmounted. */
export function killShadowMotion(shadow: ShadowRoot | null | undefined): void {
  if (!shadow) return;
  for (const child of gsap.globalTimeline.getChildren(true, true, true)) {
    const hit = animationTargets(child).some((target) => target instanceof Node && shadow.contains(target));
    if (hit) child.kill();
  }
}
