# Squarespace embed

For the end-to-end install, deploy, and troubleshooting steps, start with [SQUARESPACE_WIDGET_INSTALL.md](SQUARESPACE_WIDGET_INSTALL.md). This file is the option and API reference.

For the ready-to-send package, run **`npm run handoff`** and send `handoff/sloppy-seconds-squarespace.zip`. Start with [the installer guide](squarespace-handoff.md). The archive includes the compiled site and assets, exact versioned snippets with integrity checking, source, a public hosting verifier, and browser evidence. No credentials are included.

The real page is **https://www.sloppysecondsinc.org/animals**. Its current template is Squarespace 7.0. Use site-wide Footer Code Injection with `data-only-path="/animals"` so navigation from another page works. The public widget URL returned 404 during preparation on November 2, 2026; deploy the packaged files and pass the hosting verifier before installing the snippet.

The Our Animals page on Squarespace keeps its own header, footer, animal biographies, photos, and donation links. `dist/widget/sanctuary.js` adds Wilbur and Toodles: the story buttons, both games, the Field Guide, the breakout, and the pigs along the bottom of the page.

Wilbur is not inside an iframe. The game window is a dialog on the Squarespace page, and the landing lane is `position: fixed` at the bottom of that same page.

The standalone site (`npm run dev`, `/`) is unchanged. This file is the install guide for the embed.

## Build

```sh
npm run build
```

That type-checks, builds the standalone site to `dist/`, then builds the widget to `dist/widget/sanctuary.js`.

`npm run build:widget` rebuilds only the script.

Deploy the existing Vercel project the same way as the standalone site. The script is then available at:

```text
https://sloppy-seconds.vercel.app/widget/sanctuary.js
```

Pictures and atlases stay at `https://sloppy-seconds.vercel.app/assets/...`. The embed does not copy those files onto Squarespace. `data-asset-base` must be that origin, with no trailing slash.

After a widget change, regenerate the handoff and replace its footer snippet along with the deployment. The generated version and integrity checksum must match the new script. `vercel.json` supplies the cross-origin header needed by the integrity-checked script.

## What Squarespace needs

The page needs two things:

- A **Code block** for the launcher (and any optional buttons).
- **Code injection** for the script in the site-wide footer. The plan must permit Code Injection (current Core/Plus/Advanced or legacy Business/Commerce).

If the plan does not show Code Injection or a Code block, this embed cannot be installed. Do not paste the script into a text block that strips tags.

Use the site-wide footer with `data-only-path` set to the page's pathname, so other pages do not grow a pasture. Page Header Code Injection can work on a direct load, but this site's older Ajax navigation may not execute it on arrival from another page. The prepared handoff uses the footer.

This repository does not change the live Squarespace site. Publishing these snippets is a separate step.

## Snippets

### Script

Generic site-wide footer example, limited to the real Animals path. For installation, prefer `01-footer-injection.html` from the handoff: it also includes the release version, integrity checksum, and this site's current selectors.

```html
<script
  src="https://sloppy-seconds.vercel.app/widget/sanctuary.js"
  defer
  data-asset-base="https://sloppy-seconds.vercel.app"
  data-help-href="https://www.sloppysecondsinc.org/ways-to-help"
  data-only-path="/animals"
></script>
```

`data-help-href` is the Ways to Help link on both endings. `data-asset-base` is the origin that serves `/assets`; if omitted, it defaults to the script's origin. `data-launcher="off"` hides the character card and leaves only the buttons below. `data-auto="off"` loads the API without mounting; call `SloppySeconds.mount()` yourself after the script loads.

### Launcher

Code block, where the character selector should sit. Leave the div empty. The script draws the pigs, the switcher, and the Field Guide button inside it. Anything placed inside the div is hidden, because the widget attaches a shadow root there.

```html
<div data-ss-mount></div>
```

### Optional buttons

These can sit anywhere in a Code block. They use Squarespace's own button styling. The script does not restyle them.

```html
<button type="button" data-ss-story="wilbur">Play Wilbur's story</button>
<button type="button" data-ss-story="toodles">Play Toodles's story</button>
<button type="button" data-ss-guide>Open the Field Guide</button>
```

`data-ss-story` accepts `wilbur` or `toodles`.

### Optional page reactions

Wilbur's landings shake a photo and drop letters only from elements explicitly selected. For native Squarespace blocks, use `data-strain-photos` and `data-strain-letters` on the script; these accept CSS selectors. The prepared snippet uses `#block-da733b122b1ccc336d09` (Wilbur's current photo block) and `#team h1` (the crew heading). This avoids editing native block HTML. If a block is recreated, update its selector in `squarespace/install.json` and regenerate the handoff.

You may also mark HTML you own directly:

```html
<img data-ss-strain="photo" src="YOUR_IMAGE_URL" alt="Wilbur" />
<h2 data-ss-strain="letters">The rescued animals at the sanctuary</h2>
```

Put `data-ss-strain="photo"` on the image, or on the frame that should tilt. Put `data-ss-strain="letters"` on a heading whose text may fall. The original heading markup is put back when the widget is removed.

### Navigation and donation buttons

Pigs and the Field Guide button sit at the bottom of the viewport. `data-clearance` on the script accepts a CSS selector for fixed/sticky controls. The prepared snippet includes the current `#header`, announcement bar and mobile info bar, plus `[data-ss-clearance]`. These controls are tracked as they scroll, resize, or appear. The current Donate link is in normal page flow; it needs no marker.

For custom HTML, mark the element that is actually `position: fixed` or `sticky`, not a normal link in the biography:

```html
<header data-ss-clearance><!-- existing nav --></header>
<a data-ss-clearance href="https://www.sloppysecondsinc.org/ways-to-help">Donate</a>
```

The lane and the guide button move above a marked bar in the bottom 180px of the screen, and the game window's top padding clears a marked bar in the top 160px. A static donate link in the footer scrolls with the page and does not need the attribute.

The empty lane does not take clicks. Only the pig's body and a dropped sticker do, so a heading or button behind the grass still works. On a short screen the pig is tall enough to stand over content in that bottom band. Scroll that content up to use it; the lane stays put.

### Where "Meet the other animals" scrolls

```html
<div data-ss-animals><!-- biographies --></div>
```

Alternatively set `data-animals` to a selector on the script. The prepared snippet uses `#team`. If neither target exists, the button only closes the window.

### Calling it from the page

The script assigns `window.SloppySeconds`. Mounting twice does not create a second widget.

```html
<script>
  SloppySeconds.openStory("wilbur");
  SloppySeconds.openGuide();
  SloppySeconds.unmount();
  SloppySeconds.mount({
    assetBase: "https://sloppy-seconds.vercel.app",
    helpHref: "https://www.sloppysecondsinc.org/ways-to-help",
  });
</script>
```

`mount()` options, when you pass them, use the same names as the data attributes: `assetBase`, `helpHref`, `mount`, `launcher`, `onlyPath`, `animals`, `clearance`, `strainPhotos`, `strainLetters`. A second `mount()` while one widget is already on the page returns the existing one and ignores new options. `unmount()` first if the settings need to change.

The script also listens for Squarespace's older `mercury:load` / `mercury:unload` events, `popstate`, page restoration, and for the mount node appearing, disappearing, or being replaced. Leaving the Animals page removes the pigs, game listeners, and any letters it split. The lightweight navigation watcher stays available to mount once on return. An explicit `unmount()` suspends automatic mounting until `mount()` is called again.

## Saved progress

Discoveries and which pigs are out are stored in `localStorage` under `little-pig-big-world.v1`. The character switcher uses `sloppy-seconds.character.v1`.

That storage belongs to the origin of the page. Progress saved on `https://sloppy-seconds.vercel.app` does not show up on the Squarespace domain, and progress on Squarespace does not show up on the Vercel site. Each browser profile on Squarespace has its own Field Guide.

Keyboard, touch, reduced motion, and "Skip to the ending" behave as they do on the standalone site.

## Remove it

1. Delete the script tag from code injection.
2. Delete the `data-ss-mount` block and any `data-ss-story`, `data-ss-guide`, `data-ss-strain`, `data-ss-clearance`, and `data-ss-animals` attributes you added.
3. Publish the Squarespace page.
4. Reload. A refresh drops the widget even if a visit was mid-game when the script was removed.

Nothing is written into Squarespace's content store. To forget the Field Guide on that domain, clear site data for the Squarespace origin, or remove the `little-pig-big-world.v1` key. Republishing Squarespace does not clear it. The Vercel deploy can stay up; the standalone site does not depend on the Squarespace page.

## What was checked here

Checked in this repo, against a local host page that is not Squarespace (`fixtures/host.html`, served only by the dev and preview servers):

- The host page keeps its own type, button shape, header, and donate link.
- The script mounts once. `unmount()` removes the pigs and puts split headings back. `mount()` again works, and a second `mount()` does not add another copy.
- Wilbur's story, Toodles's story, skip, the Field Guide, and focus returning to the button that opened the window.
- A marked photo tilts during Wilbur's climb, then he leaves the window and lands along the bottom of the host page.
- Saved progress is still there after a reload on that same origin.
- Arrow keys and a tap on the stage still steer.
- Reduced motion still reaches the ending.
- The guide button and the pig sit above a marked donate bar and below a marked header.

The standalone Playwright journey still runs against `/`. `npm run e2e:squarespace` additionally checks the embed in Firefox and WebKit (desktop, iPhone portrait, iPhone landscape); install those engines with `npx playwright install firefox webkit` first.

`npm run check:squarespace-page` loads the real public `/animals` page in isolated Chrome, Firefox, and WebKit browsers and temporarily injects the local build using intercepted asset requests. It checks the real template, both story endings, Field Guide, roaming pigs, current selectors, close control, and removal, with screenshots under `artifacts/squarespace-qa`. It performs no CMS writes or deployment. Phone WebKit emulation is not a physical-device check.

## Not checked on Squarespace

The live Squarespace site was not edited and the widget was not published there. Still to confirm on the real Our Animals page:

- Authenticated access to Code Injection and a Code block is available on the owner's subscription.
- The packaged script and assets are deployed publicly; the hosting verifier prints READY.
- The exact snippets are saved in the owner's Squarespace editor, with Display Source off in the Code block.
- A private visitor session navigates from home to Animals, opens both stories and the guide, then navigates away and back without duplication.
- A physical phone check and a hard refresh after publish load the correct release from Vercel.

## Limits

- The dialog locks scroll by setting inline styles on `document.body` and putting them back when it closes. If a template scrolls an inner container instead of the page, that container can still move.
- Falling letters and photo tilts use only explicit selectors or markers. If neither matches, those effects stay inside the game window.
- Marked photos and headings are animated with GSAP while Wilbur climbs. On teardown their inline transforms are restored. A GSAP tween the host page had already put on that same element is stopped for the climb. CSS animations on the host page are not paused.
- Hiding the browser tab pauses the game and the embed's own tweens. It does not pause the global GSAP timeline, so unrelated host animations keep their own clock.
- The pasture is a fixed lane at the bottom of the viewport. A host bar with a higher z-index can paint over the pigs; `data-ss-clearance` moves the lane above a marked bottom bar instead.
- The mount node, the engine, and the dialog live in open shadow roots so Squarespace rules like `.btn` do not restyle the game, and the game's reset does not restyle the page. Host buttons keep whatever styles Squarespace gave them.
- The embed expects current Chrome, Firefox, or Safari (shadow DOM, `<dialog>`, popover, and constructable stylesheets).
- Load the script once. A second tag reuses the first widget instead of starting another.
