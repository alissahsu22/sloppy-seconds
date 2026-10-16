/** Cursor curiosity is a nearby check, not a follow. The machine still decides whether to look. */
export function pointerIsNearPig(pointerX: number, pointerY: number, pigX: number): boolean {
  if (pointerY < window.innerHeight - 260) return false;
  return Math.abs(pointerX - pigX) < 160;
}
