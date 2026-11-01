import { LabScientists } from "./LabStaff";

const SET = "/assets/toodles/environment/backdrops";

/** Background drawing. It never joins the course, so it cannot be landed on. */
function Piece({ name, className }: { name: string; className: string }) {
  return <img className={`set-piece ${className}`} src={`${SET}/${name}.png`} alt="" draggable={false} />;
}

/**
 * Screen-space set behind the course. It does not scroll with the camera.
 * Every piece stands on one floor line and shares one pixel scale (--px in toodles.css),
 * so each stage reads as one place. The layers crossfade on --climb:
 *   lab      the room, observation window, and furniture along the back wall
 *   crack    the same room with a split wall and broken glass
 *   growth   vines and grass taking the room over
 *   outside  hills and a field, revealed as the lab fades
 *   sanctuary the sun up, bushes and flowers along the field
 * The scientists are distant staff seen through the observation window, walking
 * one corridor floor: no animals, no handling, no needles. They are not part of the course, so they never collide with Toodles.
 */
export function LabBackdrop({ reduced = false }: { reduced?: boolean }) {
  return (
    <div className="biome">
      <div className="scene scene-outside">
        <Piece name="sun" className="meadow-sun" />
        <Piece name="hill" className="set-hill set-hill-far" />
        <Piece name="hill" className="set-hill set-hill-near" />
        <Piece name="bush" className="set-bush set-bush-field" />
        <Piece name="pebbles" className="set-pebbles set-pebbles-path" />
        <div className="field" />
      </div>
      <div className="scene scene-sanctuary">
        <Piece name="sanctuary_bushes" className="set-bushes set-bushes-left" />
        <Piece name="sanctuary_bushes" className="set-bushes set-bushes-right" />
        <Piece name="bush" className="set-bush" />
        <Piece name="flower" className="set-flower set-flower-a" />
        <Piece name="flower" className="set-flower set-flower-b" />
        <Piece name="flower" className="set-flower set-flower-c" />
        <Piece name="flower" className="set-flower set-flower-d" />
        <Piece name="pebbles" className="set-pebbles set-pebbles-field" />
      </div>
      <div className="scene scene-lab">
        <div className="lab-wall" />
        <div className="lab-floor" />
        <div className="lab-pipe" />
        <Piece name="lab_light" className="set-lamp set-lamp-a" />
        <Piece name="lab_light" className="set-lamp set-lamp-b" />
        <div className="lab-band">
          <div className="lab-corridor-floor" />
          <LabScientists reduced={reduced} />
          <div className="lab-frost" />
        </div>
        <p className="subject-stamp">#47</p>
        <Piece name="note" className="set-note" />
        <Piece name="door" className="set-door" />
        <Piece name="lab_workbench" className="set-bench" />
        <Piece name="cabinet" className="set-cabinet" />
        <Piece name="lab_tube_rack" className="set-rack" />
        <Piece name="lab_tank" className="set-tank" />
        <div className="scene scene-crack">
          <svg className="lab-cracks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {/* Wall split above the door, running down toward the floor. */}
            <polyline points="9,22 11,30 9,36 12,44 11,52" />
            <polyline points="11,30 13,32" />
            {/* Broken pane in the observation window. */}
            <polyline points="22,22 25,28 23,33 27,40" />
            <polyline points="25,28 29,27" />
          </svg>
          <Piece name="pebbles" className="set-pebbles set-pebbles-a" />
          <Piece name="crate" className="set-crate" />
        </div>
        <div className="scene scene-growth">
          <Piece name="vine" className="set-vine set-vine-a" />
          <Piece name="vine" className="set-vine set-vine-b" />
          <Piece name="vine" className="set-vine set-vine-c" />
          <Piece name="vine" className="set-vine set-vine-d" />
          <div className="lab-grass" />
          <Piece name="flower" className="set-flower set-flower-lab" />
        </div>
      </div>
    </div>
  );
}
