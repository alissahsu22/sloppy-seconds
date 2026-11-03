import { furniturePiece, furnitureThickness, wilburFurniture } from "../../assets/environment/wilburFurniture";
import { wilbur } from "../../content/animals/wilbur";
import { site } from "../../content/site";
import { lerp } from "../../utils/math";
import { BOUNCE_VY, FINALE_HEIGHT, WOBBLE_BOUNCE_SCALE } from "../physics/constants";
import { START_Y, evaluateLanding, stageFromIntegrity } from "../physics/platforms";
import type { LandingPulse, Platform, World } from "../physics/types";
import {
  MILESTONES,
  gameAgeLabel,
  impactForLanding,
  runProgress,
  strainTierAt,
  type AgeMilestone,
} from "../progression/age";
import type { CourseRules, PigVariant } from "./types";

function announcement(milestone: AgeMilestone): string {
  return `${site.ageLabel}: ${gameAgeLabel(milestone)}. ${milestone.label} ${milestone.tagline}`;
}

function wilburFloor(world: World): Platform {
  return {
    id: "floor",
    x: 20,
    y: START_Y,
    width: Math.max(80, world.width - 40),
    thickness: furnitureThickness("sectional"),
    integrity: 4,
    stage: "intact",
    skin: "plank",
    art: "sectional",
    temper: "strain",
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  };
}

/** Furniture from the house he outgrew. Later pieces take less strain before they crack. */
function wilburPlatform(world: World, y: number, t: number, placed: { x: number; width: number }): Platform {
  const kind = wilburFurniture(world.spawnIndex);
  const width = placed.width;
  const piece = furniturePiece(kind);
  const cols = piece.art[0].length;
  const body = piece.art.length - piece.seat;
  const integrity = lerp(1, 0.66, t);
  return {
    id: `p${world.nextId++}`,
    x: placed.x,
    y,
    width,
    thickness: Math.max(16, Math.round((width * body) / cols)),
    integrity,
    stage: stageFromIntegrity(integrity),
    skin: "plank",
    art: kind,
    temper: "strain",
    broken: false,
    wobbleUntil: 0,
    falling: false,
    fellAt: 0,
  };
}

/** Strain is his mass against the plank. Heavy landings wobble, crack, then give way under him. */
function landWilbur(world: World, hit: Platform, progress: number): LandingPulse {
  const pig = world.pig;
  const landing = evaluateLanding(hit, pig.mass);
  const pulse: LandingPulse = {
    outcome: landing.outcome,
    mass: pig.mass,
    progress,
    impact: impactForLanding(pig.mass, hit.integrity, landing.outcome),
    tier: strainTierAt(progress),
  };
  if (landing.outcome === "break") {
    hit.broken = true;
    hit.stage = "broken";
    hit.falling = true;
    hit.fellAt = world.time;
  } else {
    pig.y = hit.y;
    pig.vy = landing.bounceVy;
    pig.landUntil = world.time + 0.16;
    hit.stage = landing.nextStage;
    if (landing.outcome === "wobble") {
      hit.wobbleUntil = world.time + 0.48;
    }
  }
  return pulse;
}

export const wilburCourse: CourseRules = {
  finaleHeight: FINALE_HEIGHT,
  ending: "overshoot",
  // He can finish on the timer, so a wobbly visit still gets the ending.
  progress: (world) => runProgress(world.maxHeight, world.elapsed, world.finaleHeight),
  // His weak bounce still has to land.
  bounceSpeeds: [BOUNCE_VY, BOUNCE_VY * WOBBLE_BOUNCE_SCALE],
  floor: wilburFloor,
  platformWidth: (t) => lerp(168, 136, t),
  platform: wilburPlatform,
  land: landWilbur,
};

/** The existing climb: he grows, the page strains, and the ending breaks through. */
export const wilburVariant: PigVariant = {
  id: "wilbur",
  course: wilburCourse,
  displayName: wilbur.displayName,
  sprite: "wilbur",
  finale: "collapse",
  pageStrain: true,
  awardsGuide: true,
  showGrowthEcho: true,
  milestones: MILESTONES,
  readoutLabel: site.ageLabel,
  readoutSamples: MILESTONES.map(gameAgeLabel),
  readout: gameAgeLabel,
  note: (milestone) => ({ label: milestone.label, tagline: milestone.tagline }),
  announcement,
  startAnnouncement: `${site.ageLabel}: ${gameAgeLabel(MILESTONES[0])}.`,
  windowTitle: `${site.title}.`,
  windowKicker: site.kicker,
  gameLabel: site.gameLabel,
  fellTitle: site.fellTitle,
  fellNote: site.fellNote,
  endingTitle: site.endingTitle,
  endingLead: wilbur.endingLead,
  helpLabel: site.helpLabel,
  helpHref: site.helpHref,
  introLabel: MILESTONES[0].label,
  introTag: MILESTONES[0].tagline,
  danceSeconds: 0,
  scorchFlashMs: 0,
};
