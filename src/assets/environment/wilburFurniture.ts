/**
 * Pixel furniture for Wilbur, in the chunky outlined style of the reference icons.
 * `seat` is the row he lands on. Rows above it are backs, headboards, and screens.
 * One art pixel is PX screen pixels, so the drawing is not stretched.
 */
export const PX = 3;

export interface FurniturePiece {
  art: readonly string[];
  seat: number;
}

const COUCH_H = 18;
const COUCH_SEAT = 6;
const BAY_W = 20;
const ARM_W = 6;

function board(w: number, h: number) {
  const cells = Array.from({ length: h }, () => Array.from({ length: w }, () => "."));
  const set = (x: number, y: number, color: string) => {
    if (x >= 0 && y >= 0 && x < w && y < h) cells[y][x] = color;
  };
  const fill = (x: number, y: number, rw: number, rh: number, color: string) => {
    for (let yy = 0; yy < rh; yy += 1) for (let xx = 0; xx < rw; xx += 1) set(x + xx, y + yy, color);
  };
  const box = (x: number, y: number, rw: number, rh: number, color: string) => {
    fill(x, y, rw, rh, "#");
    if (rw > 2 && rh > 2) fill(x + 1, y + 1, rw - 2, rh - 2, color);
  };
  const roundTop = (x: number, y: number, rw: number) => {
    set(x, y, ".");
    set(x + rw - 1, y, ".");
  };
  return {
    box,
    fill,
    roundTop,
    rows: () => cells.map((line) => line.join("")),
  };
}

function join(parts: string[][]): string[] {
  return parts[0].map((_, y) => parts.map((part) => part[y]).join(""));
}

function mirror(rows: string[]): string[] {
  return rows.map((row) => [...row].reverse().join(""));
}

/** One cushion of the long floor sofa. Same height as a standalone couch. */
function couchBay(): string[] {
  const g = board(BAY_W, COUCH_H);
  g.box(0, 0, BAY_W, 8, "b");
  g.roundTop(0, 0, BAY_W);
  g.fill(3, 2, 6, 1, "c");
  g.fill(12, 2, 5, 1, "c");
  g.box(0, 6, BAY_W, 7, "b");
  g.fill(9, 7, 2, 5, "#");
  g.fill(2, 8, 6, 1, "c");
  g.fill(12, 8, 6, 1, "c");
  g.box(0, 13, BAY_W, 3, "w");
  g.fill(2, 16, 3, 2, "d");
  g.fill(15, 16, 3, 2, "d");
  return g.rows();
}

function couchArm(): string[] {
  const g = board(ARM_W, COUCH_H);
  g.box(0, 3, ARM_W, 12, "b");
  g.roundTop(0, 3, ARM_W);
  g.fill(1, 15, 4, 1, "w");
  g.fill(1, 16, 2, 2, "d");
  g.fill(3, 16, 2, 2, "d");
  return g.rows();
}

export const COUCH_BAY: FurniturePiece = { art: couchBay(), seat: COUCH_SEAT };
export const COUCH_ARM: FurniturePiece = { art: couchArm(), seat: COUCH_SEAT };

function couch(): FurniturePiece {
  const arm = couchArm();
  const bay = couchBay();
  return { art: join([arm, bay, bay, mirror(arm)]), seat: COUCH_SEAT };
}

function bed(): FurniturePiece {
  const g = board(52, 18);
  g.box(0, 0, 9, 16, "w");
  g.roundTop(0, 0, 9);
  g.fill(2, 3, 5, 1, "o");
  g.box(7, 10, 40, 6, "w");
  g.box(9, 6, 34, 8, "m");
  g.box(11, 7, 8, 5, "c");
  g.box(44, 6, 8, 10, "w");
  g.fill(10, 16, 3, 2, "d");
  g.fill(40, 16, 3, 2, "d");
  return { art: g.rows(), seat: 6 };
}

function table(): FurniturePiece {
  const g = board(48, 14);
  g.box(0, 0, 48, 4, "w");
  g.fill(3, 1, 42, 1, "o");
  g.box(4, 4, 5, 10, "w");
  g.box(39, 4, 5, 10, "w");
  return { art: g.rows(), seat: 0 };
}

function chair(): FurniturePiece {
  const g = board(36, 20);
  g.box(8, 0, 20, 10, "w");
  g.roundTop(8, 0, 20);
  g.fill(11, 2, 14, 1, "o");
  g.box(8, 8, 5, 10, "w");
  g.box(23, 8, 5, 10, "w");
  g.box(4, 9, 28, 4, "w");
  g.fill(6, 10, 24, 2, "b");
  g.fill(9, 18, 4, 2, "d");
  g.fill(23, 18, 4, 2, "d");
  return { art: g.rows(), seat: 9 };
}

function bookcase(): FurniturePiece {
  const g = board(44, 14);
  g.box(0, 0, 44, 14, "w");
  g.fill(2, 1, 40, 1, "o");
  g.fill(2, 3, 40, 4, "c");
  g.fill(2, 8, 40, 4, "c");
  g.fill(1, 7, 42, 1, "d");
  const spines = ["b", "p", "y", "g", "B", "m", "P", "w"];
  spines.forEach((color, index) => {
    const x = 3 + index * 5;
    const height = 3 + (index % 3);
    g.fill(x, 7 - height, 3, height, color);
    g.fill(x, 12 - height, 3, height, color);
  });
  return { art: g.rows(), seat: 0 };
}

function dresser(): FurniturePiece {
  const g = board(44, 14);
  g.box(0, 0, 44, 3, "w");
  g.fill(2, 1, 40, 1, "o");
  g.box(2, 3, 40, 11, "w");
  g.fill(4, 6, 36, 1, "#");
  g.fill(4, 10, 36, 1, "#");
  g.fill(20, 4, 4, 2, "y");
  g.fill(20, 8, 4, 2, "y");
  g.fill(20, 11, 4, 2, "y");
  return { art: g.rows(), seat: 0 };
}

function armchair(): FurniturePiece {
  const g = board(46, 18);
  g.box(8, 0, 30, 9, "p");
  g.roundTop(8, 0, 30);
  g.fill(12, 2, 8, 1, "c");
  g.fill(26, 2, 8, 1, "c");
  g.box(6, 7, 34, 6, "p");
  g.fill(10, 9, 10, 1, "c");
  g.fill(26, 9, 10, 1, "c");
  g.box(0, 5, 8, 10, "p");
  g.roundTop(0, 5, 8);
  g.box(38, 5, 8, 10, "p");
  g.roundTop(38, 5, 8);
  g.box(4, 13, 38, 3, "w");
  g.fill(6, 16, 3, 2, "d");
  g.fill(37, 16, 3, 2, "d");
  return { art: g.rows(), seat: 7 };
}

function television(): FurniturePiece {
  const g = board(48, 20);
  g.fill(22, 0, 1, 2, "#");
  g.fill(26, 0, 1, 2, "#");
  g.box(6, 1, 36, 11, "s");
  g.fill(9, 3, 30, 7, "k");
  g.fill(34, 8, 2, 1, "c");
  g.box(2, 12, 44, 3, "w");
  g.fill(4, 13, 40, 1, "o");
  g.box(0, 15, 48, 3, "w");
  g.fill(4, 18, 4, 2, "d");
  g.fill(40, 18, 4, 2, "d");
  return { art: g.rows(), seat: 12 };
}

function nightstand(): FurniturePiece {
  const g = board(40, 18);
  g.fill(26, 0, 1, 4, "G");
  g.fill(23, 1, 7, 2, "g");
  g.fill(22, 2, 3, 2, "g");
  g.fill(28, 2, 3, 2, "g");
  g.box(24, 4, 5, 3, "o");
  g.box(0, 6, 40, 3, "w");
  g.fill(2, 7, 36, 1, "o");
  g.box(2, 9, 36, 7, "w");
  g.fill(4, 12, 32, 1, "#");
  g.fill(18, 10, 4, 2, "y");
  g.fill(18, 13, 4, 2, "y");
  g.fill(4, 16, 3, 2, "d");
  g.fill(33, 16, 3, 2, "d");
  return { art: g.rows(), seat: 6 };
}

const PIECES = {
  couch: couch(),
  bed: bed(),
  table: table(),
  chair: chair(),
  bookcase: bookcase(),
  dresser: dresser(),
  armchair: armchair(),
  tv: television(),
  nightstand: nightstand(),
} as const satisfies Record<string, FurniturePiece>;

export type WilburFurniture = keyof typeof PIECES;

/** Jumping platforms cycle through these. The opening floor is the couch. */
export const WILBUR_COURSE = [
  "bed",
  "chair",
  "table",
  "bookcase",
  "armchair",
  "dresser",
  "nightstand",
  "tv",
  "couch",
] as const satisfies readonly WilburFurniture[];

export function wilburFurniture(index: number): WilburFurniture {
  return WILBUR_COURSE[index % WILBUR_COURSE.length];
}

export function furniturePiece(kind: string): FurniturePiece {
  if (Object.prototype.hasOwnProperty.call(PIECES, kind)) return PIECES[kind as WilburFurniture];
  return PIECES.couch;
}

export function furnitureWidth(kind: string): number {
  return furniturePiece(kind).art[0].length * PX;
}

export function furnitureThickness(kind: string): number {
  const piece = kind === "sectional" ? furniturePiece("couch") : furniturePiece(kind);
  return (piece.art.length - piece.seat) * PX;
}
