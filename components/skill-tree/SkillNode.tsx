'use client';

import { useEffect, useState } from 'react';
import { Skill } from '@/types/skill';
import { useSkillTreeStore } from '@/store/skillTreeStore';

interface SkillNodeProps {
  skill: Skill;
}

export function SkillNode({ skill }: SkillNodeProps) {
  const [mounted, setMounted] = useState(false);
  const { unlockedSkills, selectedSkillId, selectSkill, getSkillProgress } =
    useSkillTreeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isUnlocked = mounted && unlockedSkills.includes(skill.id);
  const isSelected = mounted && selectedSkillId === skill.id;
  const progress = mounted ? getSkillProgress(skill.id) : { completed: 0, total: 0, percentage: 0 };
  const isInProgress = mounted && progress.completed > 0 && progress.percentage < 100;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectSkill(skill.id);
  };

  // アンロック時のティアカラー（明るめ）
  const tierColors: Record<number, string> = {
    1: 'bg-gray-500',
    2: 'bg-blue-500',
    3: 'bg-purple-500',
    4: 'bg-amber-500',
    5: 'bg-red-500',
  };

  // ロック時のティアカラー
  const tierColorsLocked: Record<number, string> = {
    1: 'bg-gray-600',
    2: 'bg-blue-700',
    3: 'bg-purple-700',
    4: 'bg-amber-700',
    5: 'bg-red-700',
  };

  const tierBorderColors: Record<number, string> = {
    1: 'border-gray-500',
    2: 'border-blue-500',
    3: 'border-purple-500',
    4: 'border-amber-500',
    5: 'border-red-500',
  };

  // ロック時のボーダーカラー（暗め）
  const tierBorderColorsLocked: Record<number, string> = {
    1: 'border-gray-700',
    2: 'border-blue-800',
    3: 'border-purple-800',
    4: 'border-amber-800',
    5: 'border-red-800',
  };

  // カテゴリカラー（ロック時のボーダー）
  const categoryBorderColors: Record<string, string> = {
    frontend: 'border-blue-600',
    backend: 'border-purple-600',
    infrastructure: 'border-orange-600',
  };

  // カテゴリカラー（未習得）
  const categoryBorderColorsLocked: Record<string, string> = {
    frontend: 'border-blue-600',
    backend: 'border-purple-600',
    infrastructure: 'border-orange-600',
  };

  // カテゴリカラー（進行中 - 元の色を少し明るく）
  const categoryInProgress: Record<string, {
    bg: string; border: string; innerBorder: string;
    text: string; nameText: string; shadow: string;
  }> = {
    frontend: {
      bg: 'bg-blue-900/30', border: 'border-blue-500',
      innerBorder: 'border-blue-500', text: 'text-blue-300',
      nameText: 'text-blue-200',
      shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    },
    backend: {
      bg: 'bg-purple-900/30', border: 'border-purple-500',
      innerBorder: 'border-purple-500', text: 'text-purple-300',
      nameText: 'text-purple-200',
      shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    },
    infrastructure: {
      bg: 'bg-orange-900/30', border: 'border-orange-500',
      innerBorder: 'border-orange-500', text: 'text-orange-300',
      nameText: 'text-orange-200',
      shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]',
    },
  };

  const inProg = categoryInProgress[skill.category];

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{
        left: skill.position.x,
        top: skill.position.y,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
    >
      {/* Main node */}
      <div
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          border-3 transition-all duration-300
          ${isUnlocked
            ? 'bg-[#2e2a0a] border-amber-400'
            : isInProgress
            ? `${inProg.bg} ${inProg.border}`
            : `bg-[#1a1a2e] ${categoryBorderColorsLocked[skill.category]}`
          }
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f0f23] scale-110' : ''}
          ${isUnlocked
            ? 'shadow-[0_0_25px_rgba(251,191,36,0.7)]'
            : isInProgress
            ? inProg.shadow
            : isSelected ? 'opacity-100' : 'opacity-80'
          }
          hover:scale-110 hover:opacity-100
        `}
        style={{ borderWidth: '3px' }}
      >
        {/* Inner circle decoration */}
        <div
          className={`
            absolute inset-2 rounded-full border
            ${isUnlocked
              ? 'border-amber-400 opacity-60'
              : isInProgress
              ? `${inProg.innerBorder} opacity-60`
              : `${categoryBorderColorsLocked[skill.category]} opacity-40`
            }
          `}
        />

        {/* Skill initial or star */}
        <span
          className={`text-xl font-bold z-10 ${
            isUnlocked ? 'text-amber-300' : isInProgress ? inProg.text : 'text-gray-400'
          }`}
        >
          {isUnlocked ? '\u2605' : skill.name.charAt(0)}
        </span>
      </div>

      {/* Skill name */}
      <span
        className={`mt-2 text-xs text-center max-w-20 truncate ${
          isUnlocked ? 'text-amber-200' : isInProgress ? inProg.nameText : 'text-gray-400'
        }`}
      >
        {skill.name}
      </span>
    </div>
  );
}
