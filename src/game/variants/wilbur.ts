import { wilbur } from "../../content/animals/wilbur";
import { site } from "../../content/site";
import { MILESTONES, gameAgeLabel, type AgeMilestone } from "../progression/age";
import type { PigVariant } from "./types";

function announcement(milestone: AgeMilestone): string {
  return `${site.ageLabel}: ${gameAgeLabel(milestone)}. ${milestone.label} ${milestone.tagline}`;
}

/** The existing climb: he grows, the page strains, and the ending breaks through. */
export const wilburVariant: PigVariant = {
  id: "wilbur",
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
