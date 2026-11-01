import type { CrackStage } from "../../model/types";
import type { PlatformSkin } from "../../game/physics/types";
import { CourseArt } from "./courseArt";
import { FurnitureArt } from "./furniture";

/** Wilbur's furniture, or Toodles' course. `stage` still drives the cracks. */
export function PlatformArt({ stage, skin = "plank", art }: { stage: CrackStage; skin?: PlatformSkin; art?: string }) {
  if (skin !== "plank") return <CourseArt stage={stage} skin={skin} art={art} />;
  return <FurnitureArt stage={stage} kind={art} />;
}
