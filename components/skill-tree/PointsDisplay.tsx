'use client';

import { useEffect, useState } from 'react';
import { useSkillTreeStore } from '@/store/skillTreeStore';

export function PointsDisplay() {
  const [mounted, setMounted] = useState(false);
  const { getTotalPoints } = useSkillTreeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPoints = mounted ? getTotalPoints() : 0;

  // レベル計算: Lv1→2は1pt、Lv2→3は2pt、...
  let overallLevel = 1;
  let pointsInLevel = totalPoints;
  while (pointsInLevel >= overallLevel) {
    pointsInLevel -= overallLevel;
    overallLevel++;
  }
  const pointsForNext = overallLevel;
  const levelProgress = pointsForNext > 0 ? (pointsInLevel / pointsForNext) * 100 : 0;

  return (
    <div className="flex items-center gap-6">
      {/* User avatar placeholder */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl font-bold text-white border-2 border-purple-400">
          U
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-xs font-bold px-2 py-0.5 rounded-full text-black">
          Lv.{overallLevel}
        </div>
      </div>

      {/* Next level progress */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-amber-400">{pointsInLevel}</span>
          <span className="text-sm text-gray-500">/ {pointsForNext} pt</span>
        </div>

        <div className="w-36 h-2.5 bg-gray-700 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${levelProgress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
