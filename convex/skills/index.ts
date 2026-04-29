import { returnenoSkill } from "./returneno";

export const skills = {
  returneno: returnenoSkill,
} as const;

export type SkillId = keyof typeof skills;

