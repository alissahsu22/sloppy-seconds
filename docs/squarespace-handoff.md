# Sloppy Seconds — Squarespace handoff

This folder is ready for a Squarespace site manager or web developer. They can install the games, Field Guide, breakout, and roaming pigs on **https://www.sloppysecondsinc.org/animals**. The existing biographies, photos, navigation, and donation links stay on Squarespace.

**Hosting must happen first.** The widget is included in this package. The expected public script address returned 404 during preparation on November 2, 2026, so pasting the snippet before hosting this release will leave the launcher empty. This package does not claim a production deployment or an installed Squarespace widget.

## What to send

Send the entire `sloppy-seconds-squarespace.zip`. The recipient needs access to the existing Vercel project **sloppy-seconds** and permission to edit Squarespace Code Injection and the Animals page. No accounts or passwords are inside the archive.

- `01-footer-injection.html` — exact script snippet for this release.
- `02-launcher-code-block.html` — exact Animals page Code block.
- `hosting/` — the complete built site, widget, and images; ready to host without rebuilding.
- `source/` — editable project and locked dependency versions, for future maintenance.
- `release.json` — release identifier and checksums for the widget and every image/data asset.
- `scripts/verify-hosted-widget.mjs` — checks the public release before installation.
- `qa/` — browser results and screenshots, when present.
- `DEVELOPER-GUIDE.md` — API, configuration, optional buttons, and detailed removal information.

## 1. Host the included release

Use the **existing** Vercel project, not a new project with a different address. The public origin in both snippets is `https://sloppy-seconds.vercel.app`. Keep it publicly accessible without Vercel login protection.

The `hosting/` folder contains the same standalone site alongside `widget/sanctuary.js` and all `/assets`. Deploy the contents of that folder as static files at the project root. Do not upload only the script: its pig sprites and backgrounds also need the assets folder. Retain `vercel.json`; it enables the cross-origin script with integrity checking.

If using the Vercel CLI, from `hosting/`:

```sh
npx vercel link --project sloppy-seconds
npx vercel deploy --prod
```

Choose the account/team that already owns that project. The CLI requires the recipient's own Vercel sign-in. This publishes the included standalone site as well as the widget. If building from source instead, use Node 22, run `npm ci` and `npm run build`, and deploy `dist/` using the included `vercel.json` headers.

Before editing Squarespace, from the top of the unzipped handoff folder run:

```sh
node scripts/verify-hosted-widget.mjs https://sloppy-seconds.vercel.app
```

Continue only when it prints **READY**. It checks the actual file contents, public access, script type, and cross-origin header. A 200 response containing an HTML error page does not pass. If using a different host, change both URL origins in the footer snippet to that host, preserve the integrity value, and run the check against its origin.

## 2. Add the launcher to Our Animals

1. Open the Squarespace **Our Animals** page whose public address is `/animals`.
2. In the section with “Meet the rescued animals at our sanctuary,” add one **Code block**, near the introduction and before the biographies.
3. Choose **HTML** and switch **Display Source off**.
4. Paste the complete contents of `02-launcher-code-block.html` and save.

Keep the mount div empty and add it only once. Do not replace the page, paste the entire built site, or use an iframe.

## 3. Add the script once

Open the site's **Code Injection → Footer** area (search Settings for “Code Injection”; the navigation label varies by editor). Append the complete contents of `01-footer-injection.html` underneath any existing code, then save. Do not delete other integrations.

Use the **site-wide footer**, even though this feature is only for Our Animals. This site's Squarespace 7.0 navigation can load pages without a full refresh; the footer makes the loader available when visitors arrive from another page. `data-only-path="/animals"` keeps the widget off other pages.

The snippet already identifies the current header, Wilbur photo, crew heading, and animal section. The installer does not need to edit those blocks' HTML. If those Squarespace blocks are recreated later, update their selectors as described in `DEVELOPER-GUIDE.md`. Optional extra story buttons are not required.

The site needs a plan with **Code Injection** access: current Core/Plus/Advanced plans or legacy Business/Commerce plans. If Code Injection is missing, the site owner must enable an eligible plan before installation. Confirm access before changing billing.

## 4. Verify as a visitor

Use a private/logged-out browser window on the public site; embedded code can be disabled in the Squarespace editor.

- Open the home page first, then use its navigation to reach Our Animals. One launcher should appear.
- Play Wilbur and Toodles, or use “Skip to the ending.” Close the window and confirm both pigs roam along the bottom of the actual page.
- Open the Field Guide. Close it using the close button and Escape. The page should scroll normally again.
- Reload Our Animals and confirm the local Field Guide progress remains.
- Check a phone in portrait and landscape: the close control and the site's navigation should be reachable. Existing donation links should work after closing the game.
- Navigate away and back: no pigs on other pages; one launcher when returning. Also open `/animals` directly and hard-refresh it.

Mark the install complete only after the public hosting check and these visitor checks pass. Send the site owner the final public Animals URL and the release identifier in `release.json`.

## Removal and updates

To remove: delete just the Sloppy Seconds script from Code Injection and the launcher Code block; save and refresh. The biographies and donations remain. A fresh visit no longer loads the widget. To end an existing browser session immediately, a developer can call `window.SloppySeconds.unmount()` there.

To update: rebuild and regenerate the handoff with `npm run handoff` in `source/`. Deploy the new built files, rerun the hosting check, and replace the old footer snippet with the new one. The snippet has a version and an integrity checksum; **do not reuse an old integrity value with a changed script**. Keep a copy of the prior release to roll back both hosting and snippet together.

## What was verified

The production build was tested on a separate host fixture in Chrome, Firefox, and WebKit (Safari's browser engine), including phone sizes. Checks cover both stories, Field Guide, real Wilbur climb and breakout, touch, keyboard, reduced motion, saved progress, duplicate scripts, replacing a Code block, navigation cleanup, and dynamic control clearance.

The real public `/animals` page was also loaded in isolated browsers, and the local build was temporarily injected into those browser sessions. This checks the real template, current photo/heading/header selectors, both stories' endings, roaming pigs, guide, and removal. See `qa/` for the recorded results and screenshots. It does not change the Squarespace content store or publish anything. WebKit phone emulation is not a physical iPhone test.

The owner's Squarespace subscription, authenticated editor, actual paste/save step, production hosting, and final visitor verification remain with the installer. No Squarespace account was used during preparation.

## Operating notes

Progress is stored per browser and per domain. A Field Guide saved on Vercel does not transfer to Squarespace. If storage is blocked, the games still run but progress may reset. A normal Squarespace publish does not clear saved discoveries.

The empty pasture lets page clicks through; the pigs themselves can be clicked. Pigs occupy the bottom band of the screen. Scroll page content upward if a pig stands over a link. The modal makes background links temporarily unavailable until it closes. Host CSS animations remain active; an existing GSAP animation on a specifically selected photo/heading may be interrupted during the story.

Fonts load from Google Fonts. Pig images load from the configured public asset host. The widget adds no analytics, accounts, forms, or backend service. Keep that static host online for the stories to keep working.

Squarespace references: [Code Injection](https://support.squarespace.com/hc/en-us/articles/205815908-Using-code-injection), [Code blocks](https://support.squarespace.com/hc/en-us/articles/206543167-Code-blocks), [Current plan features](https://support.squarespace.com/hc/en-us/articles/206536797-Choose-the-right-Squarespace-plan).
