const TOP_BAND = 160;
const BOTTOM_BAND = 180;
const GAP = 8;

export interface Clearance {
  top: number;
  bottom: number;
}

/**
 * Measures host controls the page explicitly marked.
 * Only fixed or sticky boxes in the top or bottom band count, so a normal
 * biography or donation link in the page flow is left alone.
 */
export function measureClearance(selector: string, doc: Document = document): Clearance {
  let top = 0;
  let bottom = 0;
  let nodes: HTMLElement[] = [];
  try {
    nodes = [...doc.querySelectorAll<HTMLElement>(selector)];
  } catch {
    return { top: 0, bottom: 0 };
  }
  for (const node of nodes) {
    if (node.closest("[data-ss-engine], [data-ss-mount], [data-ss-spacer]")) continue;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") continue;
    if (style.position !== "fixed" && style.position !== "sticky") continue;
    const rect = node.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1 || rect.bottom <= 0 || rect.top >= window.innerHeight) continue;
    if (rect.bottom > window.innerHeight - BOTTOM_BAND && rect.top > window.innerHeight * 0.4) {
      bottom = Math.max(bottom, window.innerHeight - rect.top + GAP);
    }
    if (rect.top < TOP_BAND) top = Math.max(top, rect.bottom);
  }
  return { top: Math.ceil(top), bottom: Math.ceil(bottom) };
}

/** Follow sticky headers, resized notices, and bars inserted after page load. */
export function watchClearance(selector: string, apply: (clearance: Clearance) => void): () => void {
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      apply(measureClearance(selector));
    });
  };
  const resize = new ResizeObserver(schedule);
  const observeControls = () => {
    resize.disconnect();
    try {
      for (const node of document.querySelectorAll(selector)) resize.observe(node);
    } catch {
      // Invalid optional selectors leave the page controls alone.
    }
    schedule();
  };
  const mutations = new MutationObserver((records) => {
    if (
      records.every(
        (record) =>
          record.target instanceof Element &&
          record.target.closest("[data-ss-engine], [data-ss-spacer], [data-ss-mount]"),
      )
    )
      return;
    if (records.some((record) => record.type === "childList")) observeControls();
    else schedule();
  });
  mutations.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden"],
  });
  observeControls();
  apply(measureClearance(selector));
  window.addEventListener("resize", schedule);
  window.addEventListener("scroll", schedule, true);
  window.visualViewport?.addEventListener("resize", schedule);
  return () => {
    resize.disconnect();
    mutations.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("scroll", schedule, true);
    window.visualViewport?.removeEventListener("resize", schedule);
  };
}
