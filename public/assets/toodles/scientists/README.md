# Scientist Background Sprite Kit

This kit contains 3 monochrome pixel-art lab scientists for Toodles' lab background.

## Included
- `frames/trimmed/` transparent crops
- `frames/full_128/` aligned 128x128 sprites
- `scientists_atlas.png` and `atlas.json`
- `animations.json`
- `previews/scientists_contact.png`

## Suggested use
- Render these scientists in the lab background only, not as gameplay actors.
- Use a low opacity (for example 0.18 to 0.35) or tint them lighter so they feel like background silhouettes.
- Loop the 4-frame walk cycle for each scientist.
- Move them slowly across the lab backdrop at varying depths and speeds.
- Occasionally pause on the idle pose.

## Suggested animation behavior
- Scientist 1: clipboard, slow walk, occasional pause
- Scientist 2: tray of vials, medium walk
- Scientist 3: flask, slow walk, occasional reverse direction

## Rendering recommendations
- `image-rendering: pixelated`
- Keep the game background mostly white.
- Keep scientists behind platforms and behind Toodles.
- Use reduced contrast compared with the foreground platforms so they do not compete with gameplay.
