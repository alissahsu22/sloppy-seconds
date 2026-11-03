# Adding an animal

Each playable animal is one **kit**, registered in one list. The launcher switcher, the game, the pasture, the Field Guide, the standalone site, and the Squarespace widget all read from that list. No shared code checks for an animal by name.

Toodles is the worked example. To add an animal, copy his files and change them.

## The files

For an animal with the id `bella` (lowercase, the same id everywhere):

| Step | File | Copy from | What goes in it |
| --- | --- | --- | --- |
| 1 | `public/assets/bella/…` | `public/assets/toodles/` | Sprite sheets and any scenery images. They deploy with the site; no Squarespace upload is needed. |
| 2 | `src/assets/pig/BellaSprite.tsx` | `WilburSprite.tsx` (simple) or `ToodlesSprite.tsx` (with a dance) | Draws one frame per pose. It must accept the props in `AnimalSpriteProps` (`src/animals/types.ts`) and put a class such as `bella-sprite` on its root. |
| 3 | `src/content/animals/bella.ts` | `toodles.ts` | Pasture personality, speech lines, stickers to dig up, and the ending line. |
| 4 | `src/game/variants/bella.ts` | `toodles.ts` or `wilbur.ts` | The game: captions, window copy, and the `course` rules (see "Making a new game" below). |
| 5 | `src/animals/bella.tsx` | `src/animals/toodles.tsx` | The kit: points at steps 2 to 4 and holds the Field Guide card and pasture sizes. |
| 6 | `src/animals/registry.ts` | — | Add `bellaKit` to `ANIMAL_KITS`. The order there is the switcher order. |
| 7 (optional) | `src/styles/bella.css`, plus one `@import` line in `src/styles/animals.css` | `src/styles/toodles.css` | Stage colors and scenery. Scope every rule to `.stage[data-variant="bella"]`. |

The animal must already have a biography in `src/content/crew.ts`. That's the published Our Animals bio, and the Field Guide takes its photo from there. Keep every fact in the game, the captions, and the Field Guide inside that bio. Don't invent history the sanctuary hasn't published.

## Making a new game

`course` in the variant (`CourseRules` in `src/game/variants/types.ts`) is the whole game. The shared engine handles steering, gravity, the camera, and the guarantee that every platform can be reached. The rules decide everything else:

- `ending: "overshoot"` (Wilbur) keeps placing platforms past the top, and a late landing or a late miss reaches the ending. `"summit"` (Toodles) stops on one top platform that has to be landed.
- `progress` turns height (and optionally time) into 0–1. Captions, growth, and scenery follow it.
- `floor`, `platform`, and `platformWidth` build the course. `skin` and `art` pick the drawing.
- `land` decides what a landing does: bounce, crack, break, or grow something. It returns the pulse the page reacts to.
- `tick` and `caught` are optional per-frame hazards, like Toodles' glass spills.

On the variant itself:

- `finale: "collapse"` breaks out of the window onto the page, like Wilbur's ending.
- `finale: "arrival"` dances, then lowers onto the pasture, like Toodles' ending. It also turns on the "Replay ending" link.
- `pageStrain: true` makes landings shake the real page.

For a new feel, start from the closer of `wilburCourse` and `toodlesCourse` and change one rule at a time. Reusing a skin (`plank`, `tube`, `meadow`, …) works without new art. A new skin needs drawing support in `src/assets/environment/`.

## Check it

```sh
npm test          # src/animals/registry.test.ts checks that the new kit is wired correctly
npm run lint
npm run dev       # play it at http://localhost:5173/ and http://localhost:5173/fixtures/host.html
npm run e2e && npm run e2e:squarespace
```

The registry test fails, with the reason, if:

- an id doesn't match across the kit's parts,
- the animal has no published bio,
- the course doesn't reach its finale, or
- captions are out of order.

## Ship it

1. Open a PR from a branch. CI runs every check above.
2. Merge it. Vercel builds and deploys `https://sloppy-seconds.vercel.app`, including `widget/sanctuary.js` and the new `/assets`.
3. Run `npm run handoff`, then `node scripts/verify-hosted-widget.mjs https://sloppy-seconds.vercel.app handoff/sloppy-seconds-squarespace/release.json`. Wait for READY.
4. Replace the footer snippet in Squarespace Code Injection with the new `handoff/sloppy-seconds-squarespace/01-footer-injection.html`. The snippet pins the script's integrity checksum, so a changed script needs a new snippet. The new animal then shows up in the launcher's switcher. The Code block stays as it is.

To put a story button for the new animal elsewhere on the page, add a button with `data-ss-story="bella"` to any Code block.
