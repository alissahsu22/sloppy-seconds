import type { CrackStage } from "../../model/types";
import { COUCH_ARM, COUCH_BAY, PX, furniturePiece, type FurniturePiece } from "./wilburFurniture";

const FILL: Record<string, string> = {
  "#": "var(--color-ink)",
  b: "var(--color-sofa)",
  B: "var(--color-sofa-deep)",
  w: "var(--color-wood)",
  o: "var(--color-wood-mid)",
  d: "var(--color-wood-deep)",
  c: "var(--color-surface)",
  m: "var(--color-mattress)",
  p: "var(--color-chair)",
  P: "var(--color-chair-deep)",
  g: "var(--color-moss)",
  G: "var(--color-moss-deep)",
  y: "var(--color-sticker-gold)",
  s: "var(--color-surface)",
  k: "var(--color-ink-muted)",
};

/**
 * Front-facing pixel furniture. The seat row sits on the top of the platform box.
 * Backs and headboards hang above it. Same crack stages as the old planks.
 */
export function FurnitureArt({ stage, kind }: { stage: CrackStage; kind?: string }) {
  if (kind === "sectional") return <Sectional stage={stage} />;
  return <PixelSprite piece={furniturePiece(kind ?? "couch")} stage={stage} fit />;
}

function Sectional({ stage }: { stage: CrackStage }) {
  return (
    <div className="furniture-piece">
      <div className="furniture-arm left">
        <PixelSprite piece={COUCH_ARM} stage={stage} />
      </div>
      <div className="furniture-sofa">
        {Array.from({ length: 16 }, (_, index) => (
          <div className="sofa-bay" key={index} style={{ width: COUCH_BAY.art[0].length * PX }}>
            <PixelSprite piece={COUCH_BAY} stage={stage} />
          </div>
        ))}
      </div>
      <div className="furniture-arm right">
        <PixelSprite piece={{ art: mirror(COUCH_ARM.art), seat: COUCH_ARM.seat }} stage={stage} />
      </div>
    </div>
  );
}

function PixelSprite({ piece, stage, fit = false }: { piece: FurniturePiece; stage: CrackStage; fit?: boolean }) {
  const { art, seat } = piece;
  const cols = art[0].length;
  const body = art.length - seat;
  return (
    <svg
      className="pixel-furniture"
      viewBox={`0 0 ${cols} ${art.length}`}
      shapeRendering="crispEdges"
      data-stage={stage}
      aria-hidden="true"
      style={
        fit ? { width: "100%", height: `${(art.length / body) * 100}%` } : { width: cols * PX, height: art.length * PX }
      }
    >
      {art.flatMap((row, y) =>
        [...row].map((cell, x) =>
          FILL[cell] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={FILL[cell]} /> : null,
        ),
      )}
      <Strain cols={cols} seat={seat} />
    </svg>
  );
}

function Strain({ cols, seat }: { cols: number; seat: number }) {
  const y = Math.min(seat + 2, seat + 3);
  const left = Math.max(1, Math.round(cols * 0.32));
  const mid = Math.max(1, Math.round(cols * 0.5));
  const right = Math.max(1, Math.round(cols * 0.68));
  return (
    <g className="strain">
      <rect className="hair" x={left} y={y} width={3} height={1} />
      <rect className="major" x={right} y={y} width={1} height={3} />
      <rect className="major" x={right} y={y + 1} width={3} height={1} />
      <rect className="break" x={mid} y={seat} width={1} height={4} />
    </g>
  );
}

function mirror(rows: readonly string[]): string[] {
  return rows.map((row) => [...row].reverse().join(""));
}
