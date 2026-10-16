import { WilburSprite } from "../../assets/pig/WilburSprite";
import type { PigPose } from "../../model/types";

export function PigCharacter({
  pose,
  ambient = false,
  reduced = false,
}: {
  pose: PigPose;
  ambient?: boolean;
  reduced?: boolean;
}) {
  return (
    <div className="pig-character">
      <WilburSprite pose={pose} playing={ambient} reduced={reduced} />
    </div>
  );
}
