'use client';

import { CATEGORY_NAMES } from '@/data/skills';
import { SkillCategory } from '@/types/skill';
import { useSkillTreeStore } from '@/store/skillTreeStore';

const categoryStyles: Record<string, { active: string; dot: string }> = {
  frontend: {
    active: 'border-blue-500/60 bg-blue-500/15 text-blue-300',
    dot: 'bg-blue-500',
  },
  backend: {
    active: 'border-purple-500/60 bg-purple-500/15 text-purple-300',
    dot: 'bg-purple-500',
  },
  infrastructure: {
    active: 'border-orange-500/60 bg-orange-500/15 text-orange-300',
    dot: 'bg-orange-500',
  },
};

export function CategoryLegend() {
  const { visibleCategories, toggleCategory } = useSkillTreeStore();

  return (
    <div className="flex items-center gap-2">
      {Object.entries(CATEGORY_NAMES).map(([key, name]) => {
        const isVisible = visibleCategories.includes(key as SkillCategory);
        const style = categoryStyles[key];
        return (
          <button
            key={key}
            onClick={() => toggleCategory(key as SkillCategory)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${
              isVisible
                ? `${style.active} hover:brightness-125`
                : 'border-gray-700 bg-gray-800/50 text-gray-500 hover:border-gray-600 hover:text-gray-400'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full transition-opacity ${style.dot} ${
              isVisible ? 'opacity-100' : 'opacity-30'
            }`} />
            {name}
          </button>
        );
      })}
    </div>
  );
}
