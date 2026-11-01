import { ToodlesSprite } from "../../assets/pig/ToodlesSprite";
import { WilburSprite } from "../../assets/pig/WilburSprite";
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
      {sprite === "toodles" ? (
        <ToodlesSprite pose={pose} playing={ambient} reduced={reduced} />
      ) : (
        <WilburSprite pose={pose} playing={ambient} reduced={reduced} />
      )}
    </div>
  );
}
