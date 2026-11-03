# Squarespace widget install

Start here to put Wilbur and Toodles on the sanctuary's **Our Animals** page, https://www.sloppysecondsinc.org/animals. This guide covers the whole path: hosting, the Squarespace paste, testing, updates, and troubleshooting. Two companion documents go deeper:

- [squarespace-handoff.md](squarespace-handoff.md): the installer guide shipped inside the handoff zip (as `INSTALL.md`).
- [CLIENT_AI_INSTALL_PROMPT.md](CLIENT_AI_INSTALL_PROMPT.md): a prompt the site owner can give an AI browser assistant to do section 4 for them.
- [squarespace.md](squarespace.md): every script option, the JavaScript API, page reactions, and limits.

**Status on November 2, 2026:** release `cd5cd873eac5` is **deployed** to `https://sloppy-seconds.vercel.app`, and the hosting verifier prints READY. It is **not installed** on Squarespace yet. Only section 4 remains.

## 1. What it is

The widget is one script, `sanctuary.js`. It adds these to the existing Squarespace page:

- A launcher card with a Wilbur/Toodles switcher, a "Play" button, and a Field Guide button.
- Both story games, in a dialog over the page.
- Wilbur's breakout: during his climb, the page's real Wilbur photo tilts and the "Meet the rescued animals" heading drops letters. He then leaves the game window and lands on the page.
- Pigs that roam along the bottom of the page after each ending, and the Field Guide.

Squarespace keeps everything else: the header, biographies, photos, and donation links.

**It is not an iframe.** The breakout and the roaming pigs have to move over the host page itself, and an iframe can't draw outside its own box. The widget uses shadow DOM instead, so Squarespace CSS can't restyle the game and the game's CSS can't restyle the page. It needs no iframe permissions, `postMessage`, or resizing library. It plays no audio or video, so autoplay rules don't apply.

## 2. Where the code lives

| Path | What it is |
| --- | --- |
| `src/animals/registry.ts` | The list of playable animals. Each animal is one kit in `src/animals/`. See [ADDING_AN_ANIMAL.md](ADDING_AN_ANIMAL.md). |
| `src/widget/main.tsx` | Entry point. Reads the `data-*` options, mounts and unmounts, exposes `window.SloppySeconds`, and follows Squarespace navigation. |
| `src/widget/SanctuaryWidget.tsx` | The dialog, the games, the roaming lane, and the Field Guide on a host page. |
| `src/widget/Launcher.tsx` | The card drawn inside the Code block. |
| `src/widget/clearance.ts` | Keeps the pigs and dialog clear of fixed or sticky Squarespace bars. |
| `src/widget/hostStrain.ts` | The photo tilt and falling letters on the host page's own blocks. |
| `src/widget/widget.css`, `css.ts` | Styles that apply only to the embed, injected into the shadow roots. |
| `vite.widget.config.ts` | Builds `dist/widget/sanctuary.js` as one self-contained classic script. |
| `squarespace/install.json` | The live page settings: asset host, path, and Squarespace selectors. |
| `scripts/squarespace-snippets.mjs` | Writes the footer snippet with its version and integrity hash. |
| `scripts/make-squarespace-handoff.mjs` | Builds the handoff zip (`npm run handoff`). |
| `scripts/verify-hosted-widget.mjs` | Checks that the public host serves this exact release. |
| `scripts/check-squarespace-page.mjs` | Injects the local build into the real public page in test browsers. |
| `vercel.json` | Cross-origin headers for `/widget/*` and `/assets/*`. |
| `fixtures/host.html`, `e2e/widget.spec.ts` | A local stand-in host page and its Playwright tests. |

The games themselves are the same code as the standalone site (`src/game`, `src/assets`, `src/page`).

## 3. Hosting and deployment

- **Host:** the existing Vercel project `sloppy-seconds` (team `alissas-projects-a080c4b8`). Its production origin is **https://sloppy-seconds.vercel.app**.
- **The Git integration is live.** Each push or merge to `main` on `github.com/alissahsu22/sloppy-seconds` builds and deploys production. That's how the standalone site and Toodles went out.
- `npm run build` now builds both the standalone site (`dist/`) and the widget (`dist/widget/sanctuary.js`). Images stay at `https://sloppy-seconds.vercel.app/assets/...`. Nothing is copied to Squarespace.
- The widget and assets must stay public. Turn off Vercel Deployment Protection for production if it is ever enabled.

Deploy one of two ways (both need approval and account access):

**A. Merge to `main` (simplest for the repo owner).** Commit the widget work on a branch, open a PR, let CI pass, and merge. Vercel runs `npm run build` on its own servers.

**B. Deploy the prebuilt handoff folder.** Use this when the installer doesn't have repo access, or when option A's build doesn't match the snippet's checksum (see Troubleshooting). Run `npm run handoff`, then from `handoff/sloppy-seconds-squarespace/hosting/`:

```sh
npx vercel link --project sloppy-seconds
npx vercel deploy --prod
```

Either way, check the host before touching Squarespace:

```sh
node scripts/verify-hosted-widget.mjs https://sloppy-seconds.vercel.app handoff/sloppy-seconds-squarespace/release.json
```

From inside the unzipped handoff folder, use `node scripts/verify-hosted-widget.mjs https://sloppy-seconds.vercel.app`. Continue only when it prints **READY**. It downloads every script and image and compares checksums, so a 404, an HTML error page, a stale cache, or a missing CORS header all fail.

## 4. Install on Squarespace

You need a Squarespace login that can edit pages and Code Injection. The site's plan must include Code Injection: current Core, Plus, or Advanced, or legacy Business or Commerce. The live site is Squarespace 7.0.

1. **Open Our Animals in the editor** (the page at `/animals`).
2. **Add a Code block** in the section with "Meet the rescued animals at our sanctuary", above the biographies. Set the mode to **HTML** and turn **Display Source** off. Paste:

   ```html
   <div data-ss-mount></div>
   <noscript>The animal stories need JavaScript. You can still meet the animals on this page.</noscript>
   ```

   Save. Use one Code block and leave the div empty.

3. **Add the script to the site-wide footer.** Go to **Settings → Advanced → Code Injection → Footer** (or search Settings for "Code Injection"). Add the release snippet below any existing code. Don't remove other integrations. Save.

   For release `cd5cd873eac5`, the current release, the snippet is:

   ```html
   <script
     src="https://sloppy-seconds.vercel.app/widget/sanctuary.js?v=cd5cd873eac5"
     defer
     crossorigin="anonymous"
     integrity="sha384-Ppv+l++sFdDRmAwxUR/NGpBYoSO3vt4Di7cENnjb3Uxhi2nel6L9/3e4/E6bEese"
     data-asset-base="https://sloppy-seconds.vercel.app"
     data-only-path="/animals"
     data-help-href="https://www.sloppysecondsinc.org/ways-to-help"
     data-animals="#team"
     data-clearance="#header, .sqs-announcement-bar, .sqs-mobile-info-bar, [data-ss-clearance]"
     data-strain-photos="#block-da733b122b1ccc336d09"
     data-strain-letters="#team h1"
   ></script>
   ```

   If the widget code has changed since, copy `01-footer-injection.html` from a fresh `npm run handoff` instead. **The integrity value must match the deployed file**, or the browser blocks the script.

   Use the **site-wide** footer, not page header injection. This 7.0 template can switch pages without a full reload, and the footer makes the script available whichever page a visitor starts on. `data-only-path="/animals"` keeps the pigs off every other page.

4. **Check as a logged-out visitor** (section 6). Code doesn't always run inside the Squarespace editor preview.

## 5. Position, size, and layout

- **Where the launcher sits:** move the Code block. The card is centered and at most `28rem` (448px) wide. It shrinks to the column width on phones, and its height follows its content. Squarespace's own block spacing applies around it.
- **To make it narrower or wider,** put the Code block in a narrower or wider column. Its width comes from the column.
- **The game window** is a dialog sized to the viewport, not the block. It sits above the page, keeps the stage's aspect ratio, and leaves room for the close button. Nothing needs setting.
- **The roaming lane** is fixed to the bottom of the viewport. To lift it above a sticky bottom bar such as a donate bar, add that bar's selector to `data-clearance`, or put `data-ss-clearance` on HTML you control. Bars in the top 160px push the dialog down, and bars in the bottom 180px lift the lane.
- **Story or guide buttons elsewhere on the page:** add `<button type="button" data-ss-story="wilbur">…</button>`, `data-ss-story="toodles"`, or `data-ss-guide` in any Code block. They keep Squarespace's button styling. To show those buttons without the card, add `data-launcher="off"` to the script tag.
- **Photo and heading reactions** come from `data-strain-photos` and `data-strain-letters`. Change those selectors, not the Squarespace blocks. If a selector matches nothing, the effect stays inside the game window.

Change a script option by editing the footer snippet. That needs no rebuild or redeploy, and the integrity hash covers only the script file, not its attributes. To make the change permanent, also update `squarespace/install.json` so the next `npm run handoff` keeps it.

## 6. Testing that it works

Use a private window on the public site, and test with the cache cleared after each publish.

1. Open the home page, then go to Our Animals through the site navigation. **Exactly one** launcher appears.
2. Play Wilbur. The Wilbur photo should tilt and heading letters should fall as he climbs. He breaks out and lands on the page. Close the dialog.
3. Switch to Toodles and play, or use "Skip to the ending". Both pigs now roam along the bottom.
4. Open the Field Guide. Close it with the × button, then reopen it and close it with Escape. The page should scroll normally afterwards.
5. Reload. The Field Guide progress is still there.
6. Navigate to another page: no pigs. Come back: still one launcher. Open `/animals` directly and hard-refresh.
7. On a real phone, in portrait and landscape: tap to steer, check the close button and the site menu are reachable, and check donation links work after closing the game.
8. Open the browser console on `/animals` and confirm there are no errors that mention `sanctuary.js` or integrity.

For local checks, without Squarespace or a deploy:

```sh
npm run lint && npm run format:check && npm test && npm run build
npm run e2e                        # standalone site and widget on fixtures/host.html, Chromium
npm run e2e:squarespace            # widget in Firefox, WebKit, iPhone portrait/landscape
npm run check:squarespace-page     # local build injected into the real public /animals page
```

Install the browser engines once with `npx playwright install chromium firefox webkit`. `npm run dev` and then `http://localhost:5173/fixtures/host.html` shows the widget on a stand-in host page.

## 7. Updating later

| Change | What to do |
| --- | --- |
| A new animal | Follow [ADDING_AN_ANIMAL.md](ADDING_AN_ANIMAL.md), then do the row below. |
| A script option (selectors, help link, path) | Edit the footer snippet in Squarespace. No deploy. Update `squarespace/install.json` to keep it. |
| Widget or game code, or images | Rebuild and deploy (section 3), run the verifier, then replace the footer snippet with the new `01-footer-injection.html`. |
| Images only | Deploy, then run the verifier. The script and snippet don't change, but the verifier checks the image checksums against the new `release.json`. |
| The Squarespace blocks are rebuilt | Block IDs change. Find the new IDs in the browser inspector, then update `data-strain-photos` and `data-strain-letters` (and `install.json`). |

**Any change to `sanctuary.js` invalidates the integrity value.** Deploy first, then swap the snippet straight away. Until the snippet is swapped, the old one blocks the new file and the launcher stays empty. To keep that gap short, have the Squarespace editor open with the new snippet ready when the deploy finishes. To roll back, redeploy the previous Vercel deployment and paste back its snippet. They go together.

## 8. Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Empty space where the launcher should be | The script didn't load. Open the console. A **404** means it isn't deployed (section 3). An **integrity** error means the snippet is from another release, so paste the current `01-footer-injection.html`. A CORS error means the host is missing `vercel.json`. |
| Verifier says "does not match this release" after a Git deploy | Vercel's build differs from the local one. Deploy with option B, or regenerate the snippet from the code Vercel built. Don't remove `integrity` to get past it. |
| Verifier says "received HTML instead of an asset" | The path is wrong or the host is returning an error or login page. Check that Deployment Protection is off and that the whole `hosting/` folder was deployed, not just the script. |
| Works on a direct load, missing after clicking through the site menu | The script is in Page Header injection. Move it to the site-wide Footer. |
| Pigs show up on other pages | `data-only-path` is missing or wrong. It must be `/animals`. |
| Two launchers | The Code block is on the page twice, or two script tags exist. Keep one of each. A second script tag reuses the first widget, but a second mount div shows a second card. |
| Wilbur's photo doesn't tilt, or letters don't fall | The block was recreated and its ID changed. Update `data-strain-photos` and `data-strain-letters`. |
| Pigs or the guide button hide behind a sticky bar | Add that bar's selector to `data-clearance`. |
| Blank pig images, but the dialog opens | `data-asset-base` is wrong or `/assets` wasn't deployed. It must be exactly `https://sloppy-seconds.vercel.app`, with no trailing slash. |
| The snippet shows as text on the page | It was pasted into a Text block, or Display Source is on. Use a Code block in HTML mode, and put the script in Code Injection. |
| Nothing shows in the Squarespace editor | Squarespace may not run custom code in the editor. Test on the public site in a private window. |
| Field Guide progress is missing | Progress is saved per domain and browser. Vercel and Squarespace progress are separate, and private windows don't keep it. |

To hide the widget fast, delete the script from Footer Code Injection and save. The page goes back to plain Squarespace. Full removal steps are in [squarespace.md](squarespace.md#remove-it).

**Fallback, if Code Injection isn't available on the plan:** a Code block containing `<iframe src="https://sloppy-seconds.vercel.app/" title="Wilbur and Toodles" style="width:100%;height:85vh;border:0"></iframe>` shows the standalone site in a box. It was not set up or tested as part of this work. Inside an iframe the pigs can't leave the box, the Squarespace photo can't react, and the box's height is fixed.

## 9. Who needs what access

| Step | Access needed |
| --- | --- |
| Build, test, `npm run handoff` | This repo and Node 22. No accounts. |
| Deploy, option A | Push or merge rights on `alissahsu22/sloppy-seconds`. |
| Deploy, option B | A Vercel login on the team that owns `sloppy-seconds`. |
| Verifier | None: it reads the public URLs. |
| Code block and Footer Code Injection | A Squarespace contributor who can edit pages and site settings, on a plan with Code Injection. |
| Changing the Squarespace plan, if needed | The Squarespace site owner (billing). |

## What has and hasn't been verified

Verified on November 2, 2026, for release `cd5cd873eac5`:

- Production deploy: the verifier printed READY for all 169 files at `https://sloppy-seconds.vercel.app`.

- The build is reproducible: a rebuild gives the same widget checksum.
- Lint, formatting, unit tests, and Playwright pass across Chromium, Firefox, and WebKit, at desktop, iPhone portrait, and iPhone landscape sizes. The tests ran on the stand-in host page.
- The real public `/animals` page was loaded with the exact snippet injected in test browsers, and passed (`artifacts/squarespace-qa/`).
- The live page still has the selectors the snippet targets.

Not verified, because it needs access this work didn't have:

- The paste and save in the Squarespace editor, on the owner's plan.
- A logged-out visitor run on the published page.
- A physical phone.
