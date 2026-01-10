'use client';

import { Skill } from '@/types/skill';
import { useSkillTreeStore } from '@/store/skillTreeStore';

interface SkillNodeProps {
  skill: Skill;
}

export function SkillNode({ skill }: SkillNodeProps) {
  const { unlockedSkills, selectedSkillId, toggleSkill, selectSkill } =
    useSkillTreeStore();

  const isUnlocked = unlockedSkills.includes(skill.id);
  const isSelected = selectedSkillId === skill.id;

  const handleClick = () => {
    selectSkill(skill.id);
  };

  const handleDoubleClick = () => {
    toggleSkill(skill.id);
  };

  const tierColors: Record<number, string> = {
    1: 'bg-gray-500',
    2: 'bg-blue-500',
    3: 'bg-purple-500',
    4: 'bg-amber-500',
    5: 'bg-red-500',
  };

  const tierBorderColors: Record<number, string> = {
    1: 'border-gray-500',
    2: 'border-blue-500',
    3: 'border-purple-500',
    4: 'border-amber-500',
    5: 'border-red-500',
  };

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{
        left: skill.position.x,
        top: skill.position.y,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Main node */}
      <div
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          border-3 transition-all duration-300
          ${isUnlocked
            ? 'bg-[#16213e] border-green-500'
            : `bg-[#1a1a2e] ${tierBorderColors[skill.tier]}`
          }
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f0f23]' : ''}
          ${isUnlocked ? 'shadow-[0_0_20px_rgba(34,197,94,0.5)]' : ''}
          hover:scale-110
        `}
        style={{ borderWidth: '3px' }}
      >
        {/* Inner circle decoration */}
        <div
          className={`
            absolute inset-2 rounded-full border opacity-50
            ${isUnlocked ? 'border-green-500' : tierBorderColors[skill.tier]}
          `}
        />

        {/* Skill initial */}
        <span
          className={`text-xl font-bold z-10 ${
            isUnlocked ? 'text-green-400' : 'text-gray-400'
          }`}
        >
          {skill.name.charAt(0)}
        </span>

        {/* Tier badge */}
        <div
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${tierColors[skill.tier]}`}
        >
          {skill.tier}
        </div>
      </div>

      {/* Skill name */}
      <span
        className={`mt-2 text-xs text-center max-w-20 truncate ${
          isUnlocked ? 'text-gray-200' : 'text-gray-500'
        }`}
      >
        {skill.name}
      </span>

      {/* Point badge */}
      <span
        className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isUnlocked ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        +{skill.pointValue}pt
      </span>
    </div>
  );
}
