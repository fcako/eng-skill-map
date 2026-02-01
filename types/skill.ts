export type SkillCategory = 'frontend' | 'backend' | 'infrastructure' | 'devops';

export type SkillTier = 1 | 2 | 3 | 4 | 5;

export interface LearningItem {
  id: string;
  content: string;
}

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
  learningItems: LearningItem[];
}

export interface SkillTreeState {
  unlockedSkills: string[];
  selectedSkillId: string | null;
  visibleCategories: SkillCategory[];
  completedLearningItems: string[];
}

export interface SkillTreeActions {
  selectSkill: (skillId: string | null) => void;
  toggleCategory: (category: SkillCategory) => void;
  getTotalPoints: () => number;
  getCategoryLevel: (category: SkillCategory) => number;
  getUnlockedCountByCategory: (category: SkillCategory) => number;
  toggleLearningItem: (itemId: string) => void;
  isLearningItemCompleted: (itemId: string) => boolean;
  getSkillProgress: (skillId: string) => { completed: number; total: number; percentage: number };
}

export type SkillTreeStore = SkillTreeState & SkillTreeActions;
