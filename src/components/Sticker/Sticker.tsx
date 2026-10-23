import type { StickerArt } from "../../content/animals/types";

/**
 * Pixel art for the stickers Wilbur turns up. Each row is one pixel row:
 * "#" ink, "p" pink, "y" gold, "o" orange, "w" white, "." empty.
 */
const ART: Record<StickerArt, readonly string[]> = {
  teacup: [
    ".............",
    ".#########...",
    ".#ppppppp####",
    ".#pwppppp#..#",
    ".#pwppppp#..#",
    "..#ppppp#####",
    "...#####.....",
    "#############",
    ".###########.",
  ],
  crown: [
    "#.....#.....#",
    "##...###...##",
    "#y#.#yyy#.#y#",
    "#yy#yyyyy#yy#",
    "#yyyyyyyyyyy#",
    "#yypyypyypyy#",
    "#yyyyyyyyyyy#",
    "#############",
  ],
  sun: [
    "......o......",
    "..o...o...o..",
    "...o.....o...",
    ".....###.....",
    "....#yyy#....",
    "...#ywyyy#...",
    "oo.#yyyyy#.oo",
    "...#yyyyy#...",
    "....#yyy#....",
    ".....###.....",
    "...o.....o...",
    "..o...o...o..",
    "......o......",
  ],
};

const FILL: Record<string, string> = {
  "#": "var(--color-ink)",
  p: "var(--color-sticker-pink)",
  y: "var(--color-sticker-gold)",
  o: "var(--color-sticker-orange)",
  w: "var(--color-surface)",
};

export function StickerIcon({ art }: { art: StickerArt }) {
  const rows = ART[art];
  const width = Math.max(...rows.map((row) => row.length));
  return (
    <svg
      className="sticker-icon"
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {rows.flatMap((row, y) =>
        [...row].map((cell, x) =>
          FILL[cell] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={FILL[cell]} /> : null,
        ),
      )}
    </svg>
  );
}
