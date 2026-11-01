# Toodles — Pixel Sprite Pack

Extracted from the latest Toodles AI sprite sheet on 2026-11-01. This is intended as a **prototype-ready** art kit for the Sloppy Seconds Toodles experience. No game code was modified.

## Contents
- `frames/trimmed/`: 19 individual transparent PNGs, trimmed to content
- `frames/aligned_192/`: 19 aligned 192×176 PNG frames, with approximately matching foot baseline for frame-to-frame switching
- `animations.json`: animation clips, frame names, FPS, atlas coordinates, shared anchor
- `atlases/toodles_atlas.png`: 960×704 transparent atlas (5 columns)
- `growth/`: 7 growth reference illustrations (optional; NOT canonical rescue timeline)
- `body_parts/`: 11 extracted parts (visual samples, NOT actual SVG rig or independently registered joints)
- `angles/`: 3 optional alternate viewpoints
- `previews/`: checkerboard previews and looping GIFs
- `CURSOR_PROMPT.txt`: ready-to-paste integration instructions

## Setup
Copy this folder into `public/assets/toodles/` in your React project (or let Cursor import it from a folder you specify).

Animation asset example: `/assets/toodles/frames/aligned_192/walk_01.png`.
Atlas asset: `/assets/toodles/atlases/toodles_atlas.png`.
Manifest: `/assets/toodles/animations.json`.

Use CSS `image-rendering: pixelated` and nearest-neighbor scaling. Align animation sprites using the consistent 192×176 source canvases and bottom-based positioning. Some pose differences may still need pixel cleanup.

## Art accuracy warning
The source was generated as a single image, not layered native animation data. These assets were auto-extracted to separate PNGs. There may be slight texture or outline changes between poses, plus tiny antialias artifacts; check with the included GIF previews before final shipping. The visible ear puncture is small and may need manual alignment in a pixel editor in a few frames. The transparent body parts are disconnected visual references rather than a directly functional SVG rig.

**Do not conflate Toodles with Wilbur.** Toodles' lab-to-sanctuary story is different from Wilbur's teacup-pig growth story. Review all educational copy against sanctuary accounts before publishing.
