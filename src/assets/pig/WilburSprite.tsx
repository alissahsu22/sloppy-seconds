import { useEffect, useState } from "react";
import type { PigPose } from "../../model/types";
import { ATLAS_URL, CELL, FOOT, clipForPose, frameFacesLeft, frameRect, isPigPose } from "./atlas";

/**
 * Plays one atlas clip for the pose it is given.
 * Position, facing, and scale stay on the parent: physics for the jumper,
 * GSAP for the pasture walk and the collapse.
 */
export function WilburSprite({
  pose = "idle",
  playing = true,
  reduced = false,
}: {
  pose?: PigPose;
  playing?: boolean;
  reduced?: boolean;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [override, setOverride] = useState<PigPose | null>(null);
  const [seenPose, setSeenPose] = useState(pose);
  const [frame, setFrame] = useState(0);

  if (pose !== seenPose) {
    setSeenPose(pose);
    setOverride(null);
    setFrame(0);
  }

  const livePose = override ?? pose;
  const clip = clipForPose(livePose);
  const index = clip.loop && playing && !reduced ? frame % clip.frames.length : 0;
  const name = clip.frames[index] ?? clip.frames[0];
  const rect = frameRect(name);

  useEffect(() => {
    if (!node) return;
    const observer = new MutationObserver(() => {
      const next = node.dataset.pose;
      if (isPigPose(next)) setOverride(next);
    });
    observer.observe(node, { attributes: true, attributeFilter: ["data-pose"] });
    return () => observer.disconnect();
  }, [node]);

  useEffect(() => {
    setFrame(0);
    if (!clip.loop || !playing || reduced) return;
    const timer = window.setInterval(() => {
      setFrame((current) => current + 1);
    }, 1000 / clip.fps);
    return () => window.clearInterval(timer);
  }, [clip.loop, clip.fps, livePose, playing, reduced]);

  return (
    <div
      ref={setNode}
      className="wilbur-sprite"
      data-pose={livePose}
      data-mirror={frameFacesLeft(name) ? "1" : "0"}
      role="presentation"
      style={{
        width: CELL.width,
        height: CELL.height,
        marginLeft: -FOOT.x,
        bottom: FOOT.y - CELL.height,
        transformOrigin: `${FOOT.x}px ${FOOT.y}px`,
        backgroundImage: `url("${ATLAS_URL}")`,
        backgroundPosition: `-${rect.x}px -${rect.y}px`,
      }}
    />
  );
}
