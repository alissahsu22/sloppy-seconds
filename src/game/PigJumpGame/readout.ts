import gsap from "gsap";

/** Drop a page still mid-flip so the readout shows only the current label. */
export function settleReadout(readout: HTMLElement | null): void {
  readout?.querySelectorAll(".age-readout-sheet").forEach((sheet) => sheet.remove());
}

/**
 * Called when the time label changes. Writes the new label underneath, then
 * flips one page carrying the old label off the top, like the calendar did.
 */
export function flipReadout(
  readout: HTMLElement,
  text: string,
  reduced: boolean,
): gsap.core.Timeline | null {
  const page = readout.querySelector<HTMLElement>(".age-readout-page");
  const value = readout.querySelector<HTMLElement>(".age-readout-value");
  if (!page || !value || value.textContent === text) return null;

  const leaving = value.textContent ?? "";
  readout.dataset.label = text;
  value.textContent = text;
  if (reduced) return null;

  const sheet = document.createElement("span");
  sheet.className = "age-readout-sheet";
  sheet.textContent = leaving;
  page.append(sheet);

  const timeline = gsap.timeline({ onComplete: () => settleReadout(readout) });
  timeline.to(sheet, {
    rotationX: 96,
    y: -6,
    transformPerspective: 160,
    transformOrigin: "50% 0%",
    duration: 0.2,
    ease: "power2.in",
  });
  timeline.to(sheet, { opacity: 0, duration: 0.06 }, 0.14);
  return timeline;
}
