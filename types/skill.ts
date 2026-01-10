export type SkillCategory = 'frontend' | 'backend' | 'infrastructure';

export type SkillTier = 1 | 2 | 3 | 4 | 5;

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  tier: SkillTier;
  icon: string;
  position: {
    x: number;
    y: number;
  };
  connections: string[];
  pointValue: number;
}

export interface SkillTreeState {
  unlockedSkills: string[];
  selectedSkillId: string | null;
  activeCategory: SkillCategory;
}

export interface SkillTreeActions {
  toggleSkill: (skillId: string) => void;
  selectSkill: (skillId: string | null) => void;
  setCategory: (category: SkillCategory) => void;
  getTotalPoints: () => number;
  getCategoryLevel: (category: SkillCategory) => number;
  getUnlockedCountByCategory: (category: SkillCategory) => number;
}

export type SkillTreeStore = SkillTreeState & SkillTreeActions;
