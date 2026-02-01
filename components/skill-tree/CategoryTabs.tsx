'use client';

import { useSkillTreeStore } from '@/store/skillTreeStore';
import { SkillCategory } from '@/types/skill';
import { CATEGORY_NAMES, SKILLS } from '@/data/skills';

export function CategoryTabs() {
  const { visibleCategories, toggleCategory, unlockedSkills } = useSkillTreeStore();

  const categories: SkillCategory[] = ['frontend', 'backend', 'infrastructure', 'devops'];

  const getCategoryStats = (category: SkillCategory) => {
    const total = SKILLS.filter((s) => s.category === category).length;
    const unlocked = SKILLS.filter(
      (s) => s.category === category && unlockedSkills.includes(s.id)
    ).length;
    return { total, unlocked };
  };

  const categoryColors: Record<SkillCategory, string> = {
    frontend: 'border-blue-500 text-blue-400',
    backend: 'border-purple-500 text-purple-400',
    infrastructure: 'border-amber-500 text-amber-400',
    devops: 'border-green-500 text-green-400',
  };

  const categoryBgColors: Record<SkillCategory, string> = {
    frontend: 'bg-blue-500/20',
    backend: 'bg-purple-500/20',
    infrastructure: 'bg-amber-500/20',
    devops: 'bg-green-500/20',
  };

  return (
    <div className="flex gap-2">
      {categories.map((category) => {
        const isActive = visibleCategories.includes(category);
        const stats = getCategoryStats(category);
        const progress = stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0;

        return (
          <button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`relative px-4 py-2 rounded-lg border-2 transition-all overflow-hidden ${
              isActive
                ? `${categoryColors[category]} ${categoryBgColors[category]}`
                : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {/* Progress bar background */}
            <div
              className={`absolute bottom-0 left-0 h-1 transition-all ${
                isActive ? categoryBgColors[category] : 'bg-gray-700'
              }`}
              style={{ width: `${progress}%` }}
            />

            <div className="flex flex-col items-start">
              <span className="font-medium">{CATEGORY_NAMES[category]}</span>
              <span className="text-xs opacity-70">
                {stats.unlocked}/{stats.total}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
