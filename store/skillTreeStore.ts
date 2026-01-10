import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SkillCategory, SkillTreeStore } from '@/types/skill';
import { SKILLS } from '@/data/skills';

export const useSkillTreeStore = create<SkillTreeStore>()(
  persist(
    (set, get) => ({
      // State
      unlockedSkills: [],
      selectedSkillId: null,
      activeCategory: 'frontend',

      // Actions
      toggleSkill: (skillId: string) =>
        set((state) => ({
          unlockedSkills: state.unlockedSkills.includes(skillId)
            ? state.unlockedSkills.filter((id) => id !== skillId)
            : [...state.unlockedSkills, skillId],
        })),

      selectSkill: (skillId: string | null) =>
        set({ selectedSkillId: skillId }),

      setCategory: (category: SkillCategory) =>
        set({ activeCategory: category, selectedSkillId: null }),

      // Computed
      getTotalPoints: () => {
        const { unlockedSkills } = get();
        return SKILLS.filter((skill) => unlockedSkills.includes(skill.id)).reduce(
          (sum, skill) => sum + skill.pointValue,
          0
        );
      },

      getCategoryLevel: (category: SkillCategory) => {
        const { unlockedSkills } = get();
        const categorySkills = SKILLS.filter(
          (skill) =>
            skill.category === category && unlockedSkills.includes(skill.id)
        );
        return Math.floor(categorySkills.length / 3) + 1;
      },

      getUnlockedCountByCategory: (category: SkillCategory) => {
        const { unlockedSkills } = get();
        return SKILLS.filter(
          (skill) =>
            skill.category === category && unlockedSkills.includes(skill.id)
        ).length;
      },
    }),
    {
      name: 'skill-tree-storage',
    }
  )
);
