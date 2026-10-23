import type { CrackStage, Facing } from "../../model/types";

export interface EscapePiece {
  id: string;
  kind: "platform" | "chip" | "cloud";
  x: number;
  y: number;
  width: number;
  height: number;
  stage?: CrackStage;
  label?: string;
  className?: string;
}

export interface EscapePayload {
  footX: number;
  footY: number;
  scale: number;
  facing: Facing;
  tilt: number;
  pieces: EscapePiece[];
  frame: HTMLElement;
}
