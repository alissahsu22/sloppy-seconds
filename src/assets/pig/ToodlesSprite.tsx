import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { PigPose } from "../../model/types";
import { TOODLES_HOP_PX, playToodlesCelebration } from "../../animations/toodlesCelebration";
import { assetUrl } from "../base";
import { isPigPose } from "./atlas";
import {
  TOODLES_ATLAS,
  TOODLES_ATLAS_URL,
  TOODLES_DANCE_ATLAS,
  TOODLES_DANCE_ATLAS_URL,
  TOODLES_DANCE_FIT,
  TOODLES_DANCE_FOOT,
  TOODLES_DANCE_FRAME,
  TOODLES_FOOT,
  TOODLES_FRAME,
  clipForToodlesPose,
  scheduleToodlesEnding,
  toodlesDanceCell,
  toodlesEndingSteps,
  toodlesFrameCell,
  type ToodlesEndingEvent,
  type ToodlesFrame,
} from "./toodles";

/**
 * Plays one aligned frame for the pose it is given.
 * Gameplay is one atlas image. Changing pose slides that image; it does not
 * swap the URL, which was blanking him for a frame on every jump.
 * The ending slides a second, always-mounted dance sheet the same way, then returns to the atlas.
 * Canvases share a foot anchor, so changing pose does not slide him on the ground.
 * The parent owns position and facing. Frames face right; facing left flips the parent.
 */
export function ToodlesSprite({
  pose = "idle",
  playing = true,
  reduced = false,
  dancing = false,
  danceRun = 0,
  holdFrame,
  onDanceComplete,
}: {
  pose?: PigPose;
  playing?: boolean;
  reduced?: boolean;
  /** Sanctuary ending. Plays rise, the dance loop, then settle. */
  dancing?: boolean;
  /** Bumps to replay the ending without remounting the sprite. */
  danceRun?: number;
  /** Dance-sheet frame kept until a pose override, so the drop continues the settle. */
  holdFrame?: string;
  onDanceComplete?: () => void;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDanceComplete);
  const [override, setOverride] = useState<PigPose | null>(null);
  const [seenPose, setSeenPose] = useState(pose);
  const [frame, setFrame] = useState(0);
  const [danceSeen, setDanceSeen] = useState(danceRun);
  const [shown, setShown] = useState<ToodlesEndingEvent | null>(null);

  onDoneRef.current = onDanceComplete;

  if (pose !== seenPose) {
    setSeenPose(pose);
    setOverride(null);
    setFrame(0);
  }

  if (dancing && danceRun !== danceSeen) {
    setDanceSeen(danceRun);
    setShown(scheduleToodlesEnding(reduced).events[0] ?? null);
  }

  const livePose = override ?? pose;
  const clip = clipForToodlesPose(livePose);
  const held = !override && holdFrame ? { frame: holdFrame, sheet: "dance" as const } : null;
  const sequenced = held ?? (dancing && shown ? shown : null);
  const index = clip.loop && playing && !reduced && !sequenced ? frame % clip.frames.length : 0;
  const name = sequenced?.frame ?? clip.frames[index] ?? clip.frames[0];
  const sheet = sequenced?.sheet ?? "game";
  const danceSheet = sheet === "dance";
  const box = danceSheet ? TOODLES_DANCE_FRAME : TOODLES_FRAME;
  const footX = danceSheet ? TOODLES_DANCE_FOOT.x : TOODLES_FOOT.x;
  const footY = danceSheet ? TOODLES_DANCE_FOOT.y : TOODLES_FOOT.y;
  const cell = toodlesFrameCell((danceSheet ? "idle_01" : name) as ToodlesFrame);
  const danceCell = toodlesDanceCell(danceSheet ? name : "");

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
    if (dancing) return;
    setFrame(0);
    if (!clip.loop || !playing || reduced || clip.fps <= 0) return;
    const timer = window.setInterval(() => {
      setFrame((current) => current + 1);
    }, 1000 / clip.fps);
    return () => window.clearInterval(timer);
  }, [clip.loop, clip.fps, livePose, playing, reduced, dancing]);

  useEffect(() => {
    if (!dancing) return;
    const { events, doneAt } = scheduleToodlesEnding(reduced);
    let cancelled = false;
    const timers = events.map((event) =>
      window.setTimeout(() => {
        if (!cancelled) setShown(event);
      }, event.at * 1000),
    );
    const done = window.setTimeout(() => {
      if (!cancelled) onDoneRef.current?.();
    }, doneAt * 1000);
    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
      window.clearTimeout(done);
    };
  }, [dancing, danceRun, reduced]);

  useEffect(() => {
    const motion = motionRef.current;
    if (!motion) return;
    gsap.killTweensOf(motion);
    gsap.set(motion, { y: 0, rotation: 0 });
    if (!dancing || reduced || TOODLES_HOP_PX <= 0) return;
    const dance = toodlesEndingSteps(false).find((step) => step.id === "dance");
    const { events } = scheduleToodlesEnding(false);
    const loop = events.filter((event) => event.step === "dance");
    if (!dance || dance.fps <= 0 || loop.length === 0) return;
    const start = loop[0].at;
    const seconds = loop[loop.length - 1].at + 1 / dance.fps - start;
    let stop: () => void = () => undefined;
    const delay = window.setTimeout(() => {
      stop = playToodlesCelebration(motion, seconds, false);
    }, start * 1000);
    return () => {
      window.clearTimeout(delay);
      stop();
      gsap.killTweensOf(motion);
      gsap.set(motion, { y: 0, rotation: 0 });
    };
  }, [dancing, danceRun, reduced]);

  return (
    <div
      ref={setNode}
      className="toodles-sprite"
      data-pose={livePose}
      data-frame={name}
      data-sheet={sheet}
      role="presentation"
      style={{
        width: box.width,
        height: box.height,
        marginLeft: -footX,
        bottom: footY - box.height,
        transformOrigin: `${footX}px ${footY}px`,
        ...(danceSheet ? { ["--toodles-fit" as string]: String(TOODLES_DANCE_FIT) } : {}),
      }}
    >
      <div ref={motionRef} className="toodles-frame" style={{ transformOrigin: `${footX}px ${footY}px` }}>
        <img
          className="toodles-atlas"
          alt=""
          src={assetUrl(TOODLES_ATLAS_URL)}
          width={TOODLES_ATLAS.width}
          height={TOODLES_ATLAS.height}
          draggable={false}
          data-on={danceSheet ? "0" : "1"}
          style={{
            width: TOODLES_ATLAS.width,
            height: TOODLES_ATLAS.height,
            transform: `translate(${-cell.x}px, ${-cell.y}px)`,
          }}
        />
        <img
          className="toodles-atlas"
          alt=""
          src={assetUrl(TOODLES_DANCE_ATLAS_URL)}
          width={TOODLES_DANCE_ATLAS.width}
          height={TOODLES_DANCE_ATLAS.height}
          draggable={false}
          data-on={danceSheet ? "1" : "0"}
          style={{
            width: TOODLES_DANCE_ATLAS.width,
            height: TOODLES_DANCE_ATLAS.height,
            transform: `translate(${-danceCell.x}px, ${-danceCell.y}px)`,
          }}
        />
      </div>
    </div>
  );
}
