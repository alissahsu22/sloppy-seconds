import { AnimalSprite } from "../../animals/AnimalSprite";
import type { SpriteId } from "../../game/variants/types";
import type { PigPose } from "../../model/types";

export function PigCharacter({
  pose,
  sprite = "wilbur",
  ambient = false,
  reduced = false,
}: {
  pose: PigPose;
  sprite?: SpriteId;
  ambient?: boolean;
  reduced?: boolean;
}) {
  return (
    <div className="pig-character">
      <AnimalSprite id={sprite} pose={pose} playing={ambient} reduced={reduced} />
    </div>
  );
}
