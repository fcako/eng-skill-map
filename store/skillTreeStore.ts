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
      visibleCategories: ['frontend', 'backend', 'infrastructure'],
      completedLearningItems: [],

      // Actions
      selectSkill: (skillId: string | null) =>
        set({ selectedSkillId: skillId }),

      toggleCategory: (category: SkillCategory) =>
        set((state) => {
          const isVisible = state.visibleCategories.includes(category);
          if (isVisible && state.visibleCategories.length <= 1) return state;
          return {
            visibleCategories: isVisible
              ? state.visibleCategories.filter((c) => c !== category)
              : [...state.visibleCategories, category],
            selectedSkillId: null,
          };
        }),

      // Computed
      getTotalPoints: () => {
        const { completedLearningItems } = get();
        return completedLearningItems.length;
      },

      getCategoryLevel: (category: SkillCategory) => {
        const { completedLearningItems } = get();
        const categoryItems = SKILLS
          .filter((skill) => skill.category === category)
          .flatMap((skill) => skill.learningItems);
        const points = categoryItems.filter((item) =>
          completedLearningItems.includes(item.id)
        ).length;
        let level = 1;
        let remaining = points;
        while (remaining >= level) {
          remaining -= level;
          level++;
        }
        return level;
      },

      getUnlockedCountByCategory: (category: SkillCategory) => {
        const { unlockedSkills } = get();
        return SKILLS.filter(
          (skill) =>
            skill.category === category && unlockedSkills.includes(skill.id)
        ).length;
      },

      toggleLearningItem: (itemId: string) =>
        set((state) => {
          const newCompleted = state.completedLearningItems.includes(itemId)
            ? state.completedLearningItems.filter((id) => id !== itemId)
            : [...state.completedLearningItems, itemId];

          const unlockedSkills = SKILLS
            .filter((skill) =>
              skill.learningItems.length > 0 &&
              skill.learningItems.every((item) => newCompleted.includes(item.id))
            )
            .map((skill) => skill.id);

          return { completedLearningItems: newCompleted, unlockedSkills };
        }),

      isLearningItemCompleted: (itemId: string) => {
        const { completedLearningItems } = get();
        return completedLearningItems.includes(itemId);
      },

      getSkillProgress: (skillId: string) => {
        const { completedLearningItems } = get();
        const skill = SKILLS.find((s) => s.id === skillId);
        if (!skill || !skill.learningItems || skill.learningItems.length === 0) {
          return { completed: 0, total: 0, percentage: 0 };
        }
        const total = skill.learningItems.length;
        const completed = skill.learningItems.filter((item) =>
          completedLearningItems.includes(item.id)
        ).length;
        const percentage = Math.round((completed / total) * 100);
        return { completed, total, percentage };
      },
    }),
    {
      name: 'skill-tree-storage',
    }
  )
);
