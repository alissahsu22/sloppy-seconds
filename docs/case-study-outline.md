# The Not-So-Teacup Pig — case study outline

A skeleton for the portfolio write-up. Facts pulled from the build are filled in.
Every `[YOU: …]` is something only you can write: your reasoning, your process, your voice.
Aim for 600–900 words and 4–6 images or clips when done.

---

## 1. One-line summary

A concept redesign of a real animal sanctuary's "Our Animals" page. A short game about a "teacup" pig
literally outgrows the website, so visitors *feel* why teacup pigs end up in sanctuaries.

[YOU: rewrite this in your own words. Say "concept project, not affiliated", up front.]

## 2. The problem

- "Teacup" is a sales label, not a breed. Piglets sold that way keep growing like any other pig.
  Wilbur was sold as one, reached about 175 lbs, and was given up after three years.
- The original page is a long scroll of 13 bios. The facts are there, but nothing makes them land.

[YOU: why this sanctuary, why this animal, what made you want to do it. Any research
(talking to the sanctuary, reading about surrender rates) goes here.]

## 3. The idea: the pig breaks the page

- Wilbur jumps automatically; you only steer. Age stands in for a score:
  piglet → a few months → still growing → not so teacup → 175 lbs later.
- Progress is whichever comes first, height climbed or time spent (max 16 seconds), so a
  clumsy player still reaches the ending. *Everyone gets the message.*
- As he gets heavier, landings escalate in tiers: the frame trembles, then the heading
  jolts, photos tilt, cracks grow from the window edge, and letters of the page title
  shake loose. At the end he breaks through the window and lands on the real page.
- After the game he lives at the bottom of the page: wandering, napping, rooting,
  and digging up three facts that go into a Field Guide.

[YOU: how you got here. Sketches, rejected ideas (what else did you try?), the moment
it clicked. One early sketch next to the final is a strong image.]

## 4. Design decisions worth calling out

Pick 3–4, each with *what / why / what you traded off*.

- **Two visual worlds on purpose.** The sanctuary site stays soft (Jost, Source Sans);
  the game is 1-bit pixel (Silkscreen, Plex Mono). Shared ink and cream tokens and the
  pixel offset shadow carry the game style into the page (hero button, launch button, ground bar).
- **The ending asks for something.** The main button is "Help pigs like Wilbur" (Ways to Help),
  not "replay". The emotional peak is where the click is most likely.
- **The game is above the fold.** A teaser in the hero, because the only playable card was
  a full screen down.
- **The pasture has a goal.** Three finds per animal, shown as locked slots in the Field
  Guide, so wandering around the page has a payoff.
- **Respecting the page.** The pig gets a ground lane with a fade instead of covering text,
  and a "Let Wilbur nap" switch.

[YOU: which of these were hardest to decide, and what feedback changed them.]

## 5. Accessibility (most portfolios skip this, so give it a heading)

- One native `<dialog>` for the game and the guide; focus moves in, and returns to the
  button that opened it; the page behind is `inert`.
- Age changes are announced through a polite live region.
- "Skip to the ending" lets anyone get the story without playing.
- Reduced motion: no shakes, falling letters or hop animations; cracks appear without
  animating, and age changes snap.
- Touch: "Tap to start", hold either side to steer.
- Alt text names the species, since bios don't always (an iguana, a bearded dragon, a squirrel).

[YOU: how you tested: keyboard only? VoiceOver? A real phone?]

## 6. Engineering notes (for design-engineering roles)

- React + TypeScript + GSAP, built with Vite. Physics run on a fixed loop outside React;
  React only re-renders when a plank's crack state changes. Position is written straight to transforms.
- Page reactions (shakes, cracks, falling letters) live outside the physics loop and are
  tracked so replay and skip restore the page exactly.
- Wilbur's roaming is a weighted state machine (idle, walking, rooting, sleeping, curious,
  reacting) set per animal in data, so new animals are configuration, not code.
- Design tokens: one palette, semantic colour names, pixel border and shadow tokens,
  a 6-step type scale (nothing under 12px), a 4px spacing scale.
- Unit tests for physics, age progression, sprite atlas, saved progress and Field Guide content.

[YOU: one bug or constraint that taught you something, e.g. lifting the pig into the
browser's top layer so he can appear above the open dialog.]

## 7. Outcome and next steps

[YOU: any feedback, from the sanctuary, users or peers. Even 3 people playing it and what they said.]

Next:
- Stories for more animals (Toodles, the lab pig; Blanche, the turtle kept in sand for 18 years).
- Self-host and resize photos; trim to two font families.
- Measure: do people who finish the game click "Help" more than those who skip?

## Assets to capture

- [ ] 10-second clip: a heavy landing (heading shakes, cracks)
- [ ] Clip: the breakthrough and landing on the page
- [ ] Before/after: original page and this one, same viewport
- [ ] Field Guide with one find unlocked
- [ ] Phone screenshot showing the ground lane
- [ ] Your early sketches
