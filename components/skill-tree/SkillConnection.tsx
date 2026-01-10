'use client';

import { Skill } from '@/types/skill';
import { useSkillTreeStore } from '@/store/skillTreeStore';

interface SkillConnectionProps {
  fromSkill: Skill;
  toSkill: Skill;
}

export function SkillConnection({ fromSkill, toSkill }: SkillConnectionProps) {
  const { unlockedSkills } = useSkillTreeStore();

  const isFromUnlocked = unlockedSkills.includes(fromSkill.id);
  const isToUnlocked = unlockedSkills.includes(toSkill.id);
  const isBothUnlocked = isFromUnlocked && isToUnlocked;

  const x1 = fromSkill.position.x;
  const y1 = fromSkill.position.y;
  const x2 = toSkill.position.x;
  const y2 = toSkill.position.y;

  // Calculate control points for curved line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Add a slight curve
  const curvature = 0.2;
  const controlX = midX - dy * curvature;
  const controlY = midY + dx * curvature;

  const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;

  return (
    <g>
      {/* Background line (wider, for glow effect) */}
      {isBothUnlocked && (
        <path
          d={pathD}
          fill="none"
          stroke="#22c55e"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.3"
          className="connection-unlocked"
        />
      )}

      {/* Main connection line */}
      <path
        d={pathD}
        fill="none"
        stroke={isBothUnlocked ? '#22c55e' : '#374151'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={isBothUnlocked ? 'none' : '5,5'}
        opacity={isBothUnlocked ? 1 : 0.5}
        className={isBothUnlocked ? 'connection-unlocked' : ''}
      />

      {/* Arrow indicator at the end */}
      <circle
        cx={x2}
        cy={y2}
        r="4"
        fill={isBothUnlocked ? '#22c55e' : '#374151'}
        opacity={0.5}
      />
    </g>
  );
}
