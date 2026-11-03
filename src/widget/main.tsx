import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { isAnimalId } from "../animals/registry";
import { setAssetBase } from "../assets/base";
import characterCss from "../styles/character-slider.css?inline";
import globalCss from "../styles/global.css?inline";
import sanctuaryCss from "../styles/sanctuary.css?inline";
import storyCss from "../styles/story.css?inline";
import animalsCss from "../styles/animals.css?inline";
import {
  optionsFromDataset,
  resolveOptions,
  shouldMount,
  type ResolvedOptions,
  type SanctuaryApi,
  type SanctuaryHandle,
  type SanctuaryOptions,
} from "./config";
import { prepareWidgetCss } from "./css";
import { markHostStrain, splitHostLetters } from "./hostStrain";
import { killShadowMotion } from "./motion";
import { SanctuaryWidget, type WidgetApiBridge } from "./SanctuaryWidget";
import widgetCss from "./widget.css?inline";

gsap.registerPlugin(useGSAP);

const SLOT = "__sloppySecondsApi";
const FONT_ID = "ss-sanctuary-fonts";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&family=Silkscreen:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap";

const WIDGET_CSS = [globalCss, sanctuaryCss, storyCss, animalsCss, characterCss, widgetCss].join("\n");

interface ActiveEmbed {
  engine: HTMLElement;
  launcherHost: HTMLElement | null;
  root: Root;
  restoreLetters: () => void;
  handle: SanctuaryHandle;
  fontsAdded: boolean;
}

interface ApiState {
  booted: boolean;
  watching: boolean;
  suspended: boolean;
  held: boolean;
  creating: boolean;
  frame: number;
  options: ResolvedOptions | null;
  active: ActiveEmbed | null;
  bridge: WidgetApiBridge;
  sheet: CSSStyleSheet | null;
  mount: (options?: SanctuaryOptions) => SanctuaryHandle;
  unmount: () => void;
  openStory: SanctuaryApi["openStory"];
  openGuide: SanctuaryApi["openGuide"];
  sync: () => void;
  watch: () => void;
  onClick: (event: MouseEvent) => void;
}

declare global {
  interface Window {
    SloppySeconds?: SanctuaryApi;
    [SLOT]?: ApiState;
  }
}

function widgetCssText(assetBase: string): string {
  return prepareWidgetCss(WIDGET_CSS, assetBase);
}

function attachCss(shadow: ShadowRoot, css: string, api: ApiState) {
  try {
    if (typeof CSSStyleSheet !== "undefined") {
      if (!api.sheet) api.sheet = new CSSStyleSheet();
      api.sheet.replaceSync(css);
      shadow.adoptedStyleSheets = [api.sheet];
      return;
    }
  } catch {
    // The style element keeps the same rules inside this shadow root.
  }
  const style = document.createElement("style");
  style.textContent = css;
  shadow.append(style);
}

function openShadow(host: HTMLElement): ShadowRoot | null {
  if (host.shadowRoot) return host.shadowRoot;
  try {
    return host.attachShadow({ mode: "open" });
  } catch {
    return null;
  }
}

function ensureFonts(): boolean {
  if (document.getElementById(FONT_ID)) return false;
  const link = document.createElement("link");
  link.id = FONT_ID;
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.append(link);
  return true;
}

function destroyEmbed(api: ApiState) {
  const active = api.active;
  if (!active) return;
  api.active = null;
  document.removeEventListener("click", api.onClick, true);
  try {
    active.root.unmount();
  } catch {
    // React cleanup can throw if a popover is already gone. The nodes below still leave.
  }
  try {
    killShadowMotion(active.engine.shadowRoot);
  } catch {
    // Leftover tweens are best-effort. Removing the host is the teardown that matters.
  }
  active.engine.remove();
  if (active.launcherHost?.shadowRoot) active.launcherHost.shadowRoot.replaceChildren();
  try {
    active.restoreLetters();
  } catch {
    // Letter markup is restored when it can be. A failed restore must not keep the engine.
  }
  document.querySelector("[data-ss-spacer]")?.remove();
  if (active.fontsAdded) document.getElementById(FONT_ID)?.remove();
}

function createEmbed(api: ApiState): ActiveEmbed | null {
  if (api.creating || api.active || !api.options || !document.body) return api.active;
  api.creating = true;
  try {
    const options = api.options;
    setAssetBase(options.assetBase);
    const css = widgetCssText(options.assetBase);
    const restoreMarkers = markHostStrain(options.strainPhotos, options.strainLetters);
    const restoreSplit = splitHostLetters(document);
    const restoreLetters = () => {
      restoreSplit();
      restoreMarkers();
    };

    let launcherSlot: HTMLElement | null = null;
    let launcherHost: HTMLElement | null = null;
    if (options.launcher) {
      let mount: Element | null = null;
      try {
        mount = document.querySelector(options.mount);
      } catch {
        mount = null;
      }
      if (mount instanceof HTMLElement) {
        const shadow = openShadow(mount);
        if (shadow) {
          const slot = document.createElement("div");
          slot.className = "ss-launcher-root";
          shadow.replaceChildren(slot);
          attachCss(shadow, css, api);
          launcherHost = mount;
          launcherSlot = slot;
        }
      }
    }

    const engine = document.createElement("div");
    engine.setAttribute("data-ss-engine", "");
    engine.style.cssText =
      "position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:20;pointer-events:none;margin:0;padding:0;border:0;";
    const engineShadow = engine.attachShadow({ mode: "open" });
    const engineSlot = document.createElement("div");
    engineSlot.className = "ss-engine-root";
    engineShadow.append(engineSlot);
    attachCss(engineShadow, css, api);

    const spacer = document.createElement("div");
    spacer.setAttribute("data-ss-spacer", "");
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.cssText = "height:0;pointer-events:none;";

    document.body.append(engine, spacer);
    const root = createRoot(engineSlot);
    // Publish the bridge before mount() returns so an immediate openStory() works.
    flushSync(() =>
      root.render(
        <SanctuaryWidget
          bridge={api.bridge}
          helpHref={options.helpHref}
          launcherSlot={launcherSlot}
          animalsSelector={options.animals}
          clearanceSelector={options.clearance}
        />,
      ),
    );
    document.addEventListener("click", api.onClick, true);

    const handle: SanctuaryHandle = {
      openStory: (id, opener) => api.bridge.openStory(id, opener ?? null),
      openGuide: (opener) => api.bridge.openGuide(opener ?? null),
      unmount: () => api.unmount(),
    };
    const embed = { engine, launcherHost, root, restoreLetters, handle, fontsAdded: ensureFonts() };
    api.active = embed;
    return embed;
  } finally {
    api.creating = false;
  }
}

function createApi(): ApiState {
  const api = {
    booted: false,
    watching: false,
    suspended: false,
    held: false,
    creating: false,
    frame: 0,
    options: null,
    active: null,
    sheet: null,
    bridge: {
      openStory: () => {},
      openGuide: () => {},
    },
  } as unknown as ApiState;

  api.onClick = (event: MouseEvent) => {
    if (!api.active) return;
    const origin = event.composedPath()[0];
    if (!(origin instanceof Element)) return;
    const story = origin.closest("[data-ss-story]");
    if (story instanceof HTMLElement) {
      const id = story.getAttribute("data-ss-story");
      if (isAnimalId(id)) {
        event.preventDefault();
        api.active.handle.openStory(id, story);
      }
      return;
    }
    const guide = origin.closest("[data-ss-guide]");
    if (guide instanceof HTMLElement) {
      event.preventDefault();
      api.active.handle.openGuide(guide);
    }
  };

  api.mount = (options) => {
    api.suspended = false;
    api.held = false;
    if (api.active) return api.active.handle;
    api.options = resolveOptions(options, api.options);
    if (!document.body) throw new Error("SloppySeconds.mount needs a document body.");
    const created = createEmbed(api);
    if (!created) throw new Error("SloppySeconds.mount could not start.");
    api.watch();
    return created.handle;
  };

  api.unmount = () => {
    api.suspended = true;
    destroyEmbed(api);
  };

  api.openStory = (id, opener) => {
    const handle = api.active?.handle ?? api.mount();
    handle.openStory(id, opener ?? null);
  };

  api.openGuide = (opener) => {
    const handle = api.active?.handle ?? api.mount();
    handle.openGuide(opener ?? null);
  };

  api.sync = () => {
    if (api.suspended || api.held || api.creating) return;
    const options = api.options ?? resolveOptions();
    api.options = options;
    if (!document.body || !shouldMount(options, document, location.pathname)) {
      destroyEmbed(api);
      return;
    }
    // Squarespace can replace a Code block without changing the page pathname.
    const launcherHost = api.active?.launcherHost;
    if (launcherHost && (!launcherHost.isConnected || document.querySelector(options.mount) !== launcherHost)) {
      destroyEmbed(api);
    }
    if (!api.active) createEmbed(api);
  };

  api.watch = () => {
    if (api.watching || !document.body) return;
    api.watching = true;
    const schedule = () => {
      if (api.frame) return;
      api.frame = window.requestAnimationFrame(() => {
        api.frame = 0;
        api.sync();
      });
    };
    document.addEventListener("mercury:load", () => {
      api.held = false;
      schedule();
    });
    document.addEventListener("mercury:unload", () => {
      api.held = true;
      destroyEmbed(api);
    });
    window.addEventListener("popstate", schedule);
    window.addEventListener("pageshow", () => {
      api.held = false;
      api.sync();
    });
    window.addEventListener("pagehide", () => {
      api.held = true;
      destroyEmbed(api);
    });
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  return api;
}

function slot(): ApiState {
  const existing = window[SLOT];
  if (existing) return existing;
  const created = createApi();
  window[SLOT] = created;
  return created;
}

function boot() {
  const api = slot();
  if (api.booted) return;
  api.booted = true;
  const script = document.currentScript instanceof HTMLScriptElement ? document.currentScript : null;
  api.options = resolveOptions(
    script
      ? {
          ...optionsFromDataset(script.dataset),
          assetBase: script.dataset.assetBase ?? (script.src ? new URL(script.src).origin : ""),
        }
      : undefined,
  );
  if (script?.dataset.auto === "off") return;
  const start = () => {
    api.watch();
    api.sync();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

export function mount(options?: SanctuaryOptions): SanctuaryHandle {
  return slot().mount(options);
}

export function unmount(): void {
  slot().unmount();
}

export function openStory(id: string, opener?: HTMLElement | null): void {
  if (!isAnimalId(id)) return;
  slot().openStory(id, opener);
}

export function openGuide(opener?: HTMLElement | null): void {
  slot().openGuide(opener);
}

// A script-tag build tree-shakes unused exports. Assigning the API is what
// puts mount/unmount on the page; the IIFE wrapper must not replace this.
window.SloppySeconds = { mount, unmount, openStory, openGuide };

boot();
