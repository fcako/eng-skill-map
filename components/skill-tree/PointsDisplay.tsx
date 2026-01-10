'use client';

import { useSkillTreeStore } from '@/store/skillTreeStore';
import { SKILLS } from '@/data/skills';

export function PointsDisplay() {
  const { unlockedSkills, getTotalPoints, getCategoryLevel, activeCategory } =
    useSkillTreeStore();

  const totalPoints = getTotalPoints();
  const currentLevel = getCategoryLevel(activeCategory);
  const totalSkills = SKILLS.length;
  const unlockedCount = unlockedSkills.length;

  // Calculate max possible points
  const maxPoints = SKILLS.reduce((sum, skill) => sum + skill.pointValue, 0);
  const pointsProgress = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

  return (
    <div className="flex items-center gap-6">
      {/* User avatar placeholder */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl font-bold text-white border-2 border-purple-400">
          U
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-xs font-bold px-2 py-0.5 rounded-full text-black">
          Lv.{currentLevel}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-400">{totalPoints}</span>
          <span className="text-sm text-gray-500">/ {maxPoints} pt</span>
        </div>

        {/* Progress bar */}
        <div className="w-40 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${pointsProgress}%` }}
          />
        </div>

        <div className="text-xs text-gray-500 mt-1">
          {unlockedCount} / {totalSkills} スキル習得
        </div>
      </div>
    </div>
  );
}
