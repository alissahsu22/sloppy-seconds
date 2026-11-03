import gsap from "gsap";
import type { LandingPulse } from "../game/physics/types";
import { clamp } from "../utils/math";

const LANDING_COOLDOWN_MS = 380;
const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_CRACKS = 6;
const LOOSE_WORDS = new Set(["rescued", "animals", "sanctuary"]);

interface GhostSnapshot {
  rect: DOMRect;
  text: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing: string;
  color: string;
}

export interface PageReactionOptions {
  /** Where the game window lives. The standalone page uses the document. */
  scope?: ParentNode;
  /**
   * The standalone animals page also shakes `.crew-title`.
   * The embed leaves that off and passes host nodes it was explicitly given.
   */
  includePageChrome?: boolean;
  hostPhotos?: () => HTMLElement[];
  hostLetters?: () => HTMLElement[];
  hostHeadings?: () => HTMLElement[];
}

/**
 * Page reactions stay off the physics loop. Landings, the age tier, and the
 * one breakthrough call this. Tweens are tracked so replay and skip can clear them.
 */
export function createPageReactions(root: HTMLElement, reduced: boolean, options?: PageReactionOptions) {
  const scope = options?.scope ?? document;
  const pageChrome = options?.includePageChrome !== false;
  const tweens: gsap.core.Tween[] = [];
  const ghosts = new Set<HTMLElement>();
  const cracks = new Set<Element>();
  const savedTransform = new Map<HTMLElement, string>();
  let dead = false;
  let sealed = false;
  let lastLanding = 0;
  let crampedHits = 0;
  let tiltSign = 1;
  let frameToken = 0;

  const dialogEl = () => scope.querySelector<HTMLElement>(".story-dialog");
  const noteHost = (node: HTMLElement) => {
    if (!node.closest("[data-ss-strain]") || savedTransform.has(node)) return;
    savedTransform.set(node, node.style.transform);
  };
  const restoreHostTransforms = () => {
    for (const [node, value] of savedTransform) {
      if (node.isConnected) node.style.transform = value;
    }
    savedTransform.clear();
  };
  const unique = (nodes: HTMLElement[]) => [...new Set(nodes)];
  const inView = (node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 1 && rect.bottom > 0 && rect.top < window.innerHeight;
  };
  const pageLetters = () => {
    if (!pageChrome) return [];
    return [...document.querySelectorAll<HTMLElement>(".crew-title .crew-letter")].filter(
      (letter) => LOOSE_WORDS.has(letter.dataset.word ?? "") && inView(letter),
    );
  };
  const hostLetters = () => (options?.hostLetters?.() ?? []).filter(inView);
  const allLetters = () =>
    unique([
      ...root.querySelectorAll<HTMLElement>(".crew-letter"),
      ...(dialogEl()?.querySelectorAll<HTMLElement>(".crew-letter") ?? []),
      ...(pageChrome ? document.querySelectorAll<HTMLElement>(".crew-title .crew-letter") : []),
      ...hostLetters(),
    ]);
  const coveredByWindow = (node: HTMLElement) => {
    const box = windowEl()?.getBoundingClientRect();
    if (!box) return false;
    const rect = node.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return x > box.left && x < box.right && y > box.top && y < box.bottom;
  };
  const activeLetters = () =>
    unique([
      ...(dialogEl()?.querySelectorAll<HTMLElement>(".crew-letter") ?? []),
      ...[...root.querySelectorAll<HTMLElement>(".crew-letter"), ...pageLetters(), ...hostLetters()].filter(
        (letter) => !coveredByWindow(letter),
      ),
    ]);
  const headingNodes = () =>
    unique(
      [
        dialogEl()?.querySelector<HTMLElement>("[data-strain='heading']") ?? null,
        root.querySelector<HTMLElement>("[data-strain='heading']"),
        pageChrome ? document.querySelector<HTMLElement>(".crew-title") : null,
        ...(options?.hostHeadings?.() ?? []),
      ].filter((node): node is HTMLElement => !!node),
    );
  const hanger = () =>
    dialogEl()?.querySelector<HTMLElement>("[data-hanger]") ?? root.querySelector<HTMLElement>("[data-hanger]");
  const windowEl = () => scope.querySelector<HTMLElement>(".story-window");
  const photos = () =>
    unique(
      [root.querySelector<HTMLElement>("[data-strain='photo']"), ...(options?.hostPhotos?.() ?? [])].filter(
        (node): node is HTMLElement => !!node,
      ),
    );
  const frame = () =>
    root.querySelector<HTMLElement>("[data-strain='frame']") ??
    dialogEl()?.querySelector<HTMLElement>("[data-strain='frame']") ??
    null;

  const snapshotLetter = (letter: HTMLElement): GhostSnapshot => {
    const style = getComputedStyle(letter);
    return {
      rect: letter.getBoundingClientRect(),
      text: letter.textContent ?? "",
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      letterSpacing: style.letterSpacing,
      color: style.color,
    };
  };

  const track = (tween: gsap.core.Tween) => {
    tweens.push(tween);
    return tween;
  };

  const stopOwnTweens = () => {
    frameToken += 1;
    for (const tween of tweens) tween.kill();
    tweens.length = 0;
    for (const ghost of ghosts) {
      gsap.killTweensOf(ghost);
      ghost.remove();
    }
    ghosts.clear();
    for (const crack of cracks) crack.remove();
    cracks.clear();
  };

  const restoreLetters = () => {
    for (const letter of allLetters()) {
      gsap.killTweensOf(letter);
      letter.style.visibility = "";
      letter.classList.remove("is-loose", "is-hung", "is-gone");
      gsap.set(letter, { clearProps: "transform" });
    }
  };

  const restoreScene = () => {
    stopOwnTweens();
    for (const title of headingNodes()) {
      gsap.killTweensOf(title);
      gsap.set(title, { clearProps: "transform" });
    }
    for (const picture of photos()) {
      gsap.killTweensOf(picture);
      gsap.set(picture, { clearProps: "transform" });
    }
    const stage = frame();
    if (stage) gsap.set(stage, { clearProps: "borderRadius" });
    const box = windowEl();
    if (box) {
      gsap.killTweensOf(box);
      gsap.set(box, { clearProps: "transform" });
    }
    restoreLetters();
    restoreHostTransforms();
    delete root.dataset.strainTier;
  };

  const joltHeading = (power: number, tier: LandingPulse["tier"]) => {
    if (reduced) return;
    const titles = headingNodes().filter(
      (node) => inView(node) && (node.closest(".story-dialog") !== null || !coveredByWindow(node)),
    );
    if (titles.length === 0) return;
    for (const title of titles) noteHost(title);
    const base = tier === "cramped" || tier === "breakthrough" ? 5 : 3;
    const amp = Math.min(16, base + power * 10);
    for (const title of titles) {
      gsap.killTweensOf(title);
      track(
        gsap.to(title, {
          keyframes: [
            { x: amp, y: amp * 0.3, rotation: amp * 0.25, duration: 0.05 },
            { x: -amp * 0.7, y: -amp * 0.15, rotation: -amp * 0.18, duration: 0.07 },
            { x: amp * 0.35, y: 0, rotation: amp * 0.08, duration: 0.08 },
            { x: 0, rotation: 0, duration: 0.16 },
          ],
          ease: "power2.out",
        }),
      );
    }
  };

  const tiltPhoto = (impact: number) => {
    const pictures = photos();
    if (pictures.length === 0 || reduced) return;
    tiltSign *= -1;
    const angle = tiltSign * Math.min(6, 1.6 + impact * 4.4);
    for (const picture of pictures) {
      noteHost(picture);
      gsap.killTweensOf(picture);
      track(
        gsap.to(picture, {
          rotation: angle,
          scale: 1.08,
          duration: 0.42,
          ease: "power3.out",
          transformOrigin: "50% 42%",
        }),
      );
    }
  };

  const deformFrame = (impact: number) => {
    const stage = frame();
    if (!stage || reduced) return;
    const token = ++frameToken;
    const bulge = 10 + impact * 30;
    track(
      gsap.fromTo(
        stage,
        {
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
          borderBottomLeftRadius: 2,
        },
        {
          borderTopLeftRadius: bulge,
          borderTopRightRadius: 6 + impact * 18,
          borderBottomRightRadius: 8 + impact * 26,
          borderBottomLeftRadius: 6 + impact * 20,
          duration: 0.16,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
          onComplete: () => {
            if (token !== frameToken) return;
            gsap.set(stage, { clearProps: "borderRadius" });
          },
        },
      ),
    );
  };

  const shakeWindow = (power: number) => {
    const box = windowEl();
    if (!box || reduced) return;
    const amp = 2 + power * 9;
    gsap.killTweensOf(box);
    track(
      gsap.to(box, {
        keyframes: [
          { x: -amp, y: amp * 0.6, rotation: -amp * 0.12, duration: 0.05 },
          { x: amp * 0.8, y: -amp * 0.4, rotation: amp * 0.1, duration: 0.06 },
          { x: -amp * 0.45, y: amp * 0.2, rotation: -amp * 0.05, duration: 0.07 },
          { x: amp * 0.2, y: 0, rotation: 0, duration: 0.08 },
          { x: 0, y: 0, rotation: 0, duration: 0.12 },
        ],
        ease: "power2.out",
      }),
    );
  };

  /** A jagged line that grows out from an edge of the game frame. */
  const crack = (impact: number) => {
    const stage = frame();
    if (!stage || cracks.size >= MAX_CRACKS) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (width < 1 || height < 1) return;
    const edge = cracks.size % 4;
    const along = 0.15 + Math.random() * 0.7;
    let x = edge === 1 ? width : edge === 3 ? 0 : width * along;
    let y = edge === 0 ? 0 : edge === 2 ? height : height * along;
    const inward = { x: edge === 1 ? -1 : edge === 3 ? 1 : 0, y: edge === 0 ? 1 : edge === 2 ? -1 : 0 };
    const reach = Math.min(width, height) * (0.22 + impact * 0.3);
    const steps = 6;
    const points = [`${x},${y}`];
    for (let step = 0; step < steps; step += 1) {
      const jag = (Math.random() - 0.5) * reach * 0.35;
      x += inward.x * (reach / steps) + (inward.x === 0 ? jag : 0);
      y += inward.y * (reach / steps) + (inward.y === 0 ? jag : 0);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "strain-crack");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const line = document.createElementNS(SVG_NS, "polyline");
    line.setAttribute("points", points.join(" "));
    svg.appendChild(line);
    stage.appendChild(svg);
    cracks.add(svg);
    if (reduced) return;
    const length = reach * 1.6;
    track(
      gsap.fromTo(
        line,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 0.22, ease: "power3.out" },
      ),
    );
  };

  const loosePool = () =>
    activeLetters().filter((letter) => {
      if (letter.dataset.hanger) return false;
      if (letter.classList.contains("is-loose") || letter.classList.contains("is-gone")) return false;
      return true;
    });

  const loosen = (letter: HTMLElement, impact: number) => {
    if (reduced) return;
    noteHost(letter);
    const index = Number(letter.dataset.letter ?? "0");
    const direction = index % 2 === 0 ? -1 : 1;
    gsap.killTweensOf(letter);
    track(
      gsap.to(letter, {
        rotation: direction * (10 + impact * 14),
        y: 2 + impact * 5,
        duration: 0.28,
        ease: "power2.out",
      }),
    );
    letter.classList.add("is-loose");
  };

  const hang = (letter: HTMLElement, impact: number) => {
    if (reduced) return;
    noteHost(letter);
    gsap.killTweensOf(letter);
    track(
      gsap.to(letter, {
        rotation: 16 + impact * 6,
        y: 4,
        duration: 0.4,
        ease: "power2.out",
      }),
    );
    letter.classList.add("is-loose", "is-hung");
  };

  const spawnGhost = (
    snapshot: GhostSnapshot,
    options: {
      index: number;
      originX: number;
      distance: number;
      duration: number;
      delay: number;
    },
  ) => {
    const ghost = document.createElement("span");
    ghost.className = "letter-debris";
    ghost.textContent = snapshot.text;
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.fontFamily = snapshot.fontFamily;
    ghost.style.fontSize = snapshot.fontSize;
    ghost.style.fontWeight = snapshot.fontWeight;
    ghost.style.letterSpacing = snapshot.letterSpacing;
    ghost.style.color = snapshot.color;
    ghost.style.left = `${snapshot.rect.left}px`;
    ghost.style.top = `${snapshot.rect.top}px`;
    (dialogEl() ?? document.body).appendChild(ghost);
    ghosts.add(ghost);
    const dx = clamp((options.originX - (snapshot.rect.left + snapshot.rect.width / 2)) * 0.18, -36, 36);
    const direction = options.index % 2 === 0 ? -1 : 1;
    track(
      gsap.to(ghost, {
        x: dx,
        y: options.distance,
        rotation: direction * (16 + options.index * 7),
        duration: options.duration,
        delay: options.delay,
        ease: "power2.in",
      }),
    );
    track(
      gsap.to(ghost, {
        opacity: 0,
        duration: 0.28,
        delay: options.delay + Math.max(0.2, options.duration - 0.28),
        ease: "power1.out",
        onComplete: () => {
          ghost.remove();
          ghosts.delete(ghost);
        },
      }),
    );
  };

  const releaseLetter = (letter: HTMLElement, distance: number) => {
    if (reduced) return;
    const snapshot = snapshotLetter(letter);
    letter.style.visibility = "hidden";
    letter.classList.add("is-gone");
    if (reduced || snapshot.rect.width < 1) return;
    spawnGhost(snapshot, { index: 0, originX: snapshot.rect.left, distance, duration: 0.55, delay: 0 });
  };

  const strainCramped = (impact: number) => {
    tiltPhoto(impact);
    deformFrame(impact);
    shakeWindow(0.45 + impact * 0.55);
    crack(impact);
    crampedHits += 1;
    const hung = hanger();
    if (hung && !hung.classList.contains("is-gone")) {
      if (!hung.classList.contains("is-hung") && crampedHits >= 2) {
        hang(hung, impact);
        return;
      }
      if (hung.classList.contains("is-hung") && crampedHits >= 4) {
        releaseLetter(hung, 56);
        return;
      }
    }
    const looseCount = allLetters().filter(
      (letter) => letter.classList.contains("is-loose") || letter.classList.contains("is-gone"),
    ).length;
    const pool = loosePool();
    for (const next of pool.slice(0, Math.max(0, Math.min(2, 10 - looseCount)))) loosen(next, impact);
  };

  const cascade = (originX: number) => {
    if (reduced) return;
    const loose = activeLetters().filter(
      (letter) =>
        !letter.classList.contains("is-gone") &&
        (letter.classList.contains("is-loose") ||
          letter.classList.contains("is-hung") ||
          letter.dataset.hanger === "1"),
    );
    const extra = loosePool().filter((letter) => !loose.includes(letter));
    const chosen = [...loose, ...extra].slice(0, 16);
    chosen.forEach((letter, index) => {
      const snapshot = snapshotLetter(letter);
      letter.style.visibility = "hidden";
      letter.classList.add("is-gone");
      if (reduced || snapshot.rect.width < 1) return;
      const travel = Math.max(36, Math.min(window.innerHeight * 0.62, window.innerHeight - snapshot.rect.bottom - 28));
      spawnGhost(snapshot, {
        index,
        originX,
        distance: travel,
        duration: 0.92,
        delay: 0.08 + index * 0.045,
      });
    });
  };

  return {
    land(pulse: LandingPulse) {
      if (dead || sealed) return;
      root.dataset.strainTier = pulse.tier;
      if (pulse.tier === "still" || pulse.tier === "breakthrough") return;
      const now = performance.now();
      if (now - lastLanding < LANDING_COOLDOWN_MS && pulse.outcome !== "break") return;
      lastLanding = now;
      joltHeading(pulse.impact, pulse.tier);
      if (pulse.tier === "tremble") {
        shakeWindow(0.15 + pulse.impact * 0.3);
        deformFrame(pulse.impact * 0.5);
      }
      if (pulse.tier === "cramped") strainCramped(pulse.impact);
    },
    breakthrough(origin: { x: number; y: number }) {
      if (dead || sealed) return;
      sealed = true;
      root.dataset.strainTier = "breakthrough";
      cascade(origin.x);
      joltHeading(1, "breakthrough");
      deformFrame(1);
      shakeWindow(1.4);
      crack(1);
      crack(1);
    },
    settle() {
      if (dead) return;
      restoreScene();
    },
    reset() {
      if (dead) return;
      sealed = false;
      lastLanding = 0;
      crampedHits = 0;
      tiltSign = 1;
      restoreScene();
    },
    destroy() {
      dead = true;
      restoreScene();
    },
  };
}

export type PageReactions = ReturnType<typeof createPageReactions>;
