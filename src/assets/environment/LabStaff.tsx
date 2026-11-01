import { useEffect, useLayoutEffect, useRef } from "react";
import {
  LAB_AMBIENT,
  SCIENTIST_SIZE,
  activeActors,
  advanceActor,
  createActorState,
  exitSpan,
  frameFor,
  motionRate,
  scientistFrameNames,
  scientistFrameUrl,
  type LabActorState,
} from "./labScientists";

/**
 * Screen-space walkers behind the course. The frame loop writes transforms
 * on the nodes, so the game does not re-render to move them.
 */
export function LabScientists({ reduced = false }: { reduced?: boolean }) {
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const rootRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const actors = activeActors();

  useEffect(() => {
    for (const name of scientistFrameNames()) {
      const image = new Image();
      image.src = scientistFrameUrl(name);
    }
  }, []);

  useLayoutEffect(() => {
    const band = bandRef.current;
    if (!band) return;

    let states: LabActorState[] = activeActors().map(createActorState);
    let frameId = 0;
    let last = performance.now();

    const paint = () => {
      const width = band.clientWidth || 1;
      const frozen = motionRate(reducedRef.current) === 0;
      states.forEach((state, index) => {
        const node = nodesRef.current[index];
        if (!node) return;
        const drawn = frameFor(state, frozen);
        if (node.dataset.frame !== drawn.name) {
          node.dataset.frame = drawn.name;
          node.style.backgroundImage = `url("${scientistFrameUrl(drawn.name)}")`;
        }
        const draw = SCIENTIST_SIZE * state.spec.scale;
        node.style.transform = `translate3d(${state.x * width - draw / 2}px, 0, 0) scaleX(${drawn.flip ? -1 : 1})`;
      });
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        const width = band.clientWidth || 1;
        const reducedNow = reducedRef.current;
        states = states.map((state) => advanceActor(state, dt, exitSpan(state.spec.scale, width), reducedNow));
      }
      paint();
      frameId = requestAnimationFrame(loop);
    };

    paint();
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className="lab-scientists"
      ref={rootRef}
      aria-hidden="true"
      style={{
        ["--scientist-hold" as string]: LAB_AMBIENT.fade.holdUntil,
        ["--scientist-gone" as string]: LAB_AMBIENT.fade.goneAt,
      }}
    >
      <div className="lab-scientist-band" ref={bandRef}>
        {actors.map((spec, index) => (
          <div
            key={spec.id}
            className="lab-scientist"
            data-scientist={spec.sprite}
            style={{
              top: `${spec.y}%`,
              marginTop: -SCIENTIST_SIZE * spec.scale,
              opacity: spec.opacity,
              width: SCIENTIST_SIZE * spec.scale,
              height: SCIENTIST_SIZE * spec.scale,
            }}
            ref={(node) => {
              nodesRef.current[index] = node;
            }}
          />
        ))}
      </div>
    </div>
  );
}
