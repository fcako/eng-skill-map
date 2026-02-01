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

  // カテゴリ × Tier の色定義（内側Tier 1が薄く、外側Tier 5が濃い）
  // フロントエンド: 薄い水色 → 鮮やかな青
  // バックエンド: 薄いピンク → 鮮やかな紫
  // インフラ: 薄い黄色 → 鮮やかなオレンジ/赤
  const categoryTierStyles: Record<string, Record<number, {
    border: string;
    bg: string;
    innerBorder: string;
    text: string;
    nameText: string;
    shadow: string;
  }>> = {
    frontend: {
      1: {
        border: 'border-sky-300',
        bg: 'bg-sky-900/20',
        innerBorder: 'border-sky-300',
        text: 'text-sky-300',
        nameText: 'text-sky-300',
        shadow: 'shadow-[0_0_8px_rgba(125,211,252,0.3)]',
      },
      2: {
        border: 'border-sky-400',
        bg: 'bg-sky-800/30',
        innerBorder: 'border-sky-400',
        text: 'text-sky-300',
        nameText: 'text-sky-300',
        shadow: 'shadow-[0_0_10px_rgba(56,189,248,0.35)]',
      },
      3: {
        border: 'border-blue-500',
        bg: 'bg-blue-800/40',
        innerBorder: 'border-blue-500',
        text: 'text-blue-300',
        nameText: 'text-blue-300',
        shadow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
      },
      4: {
        border: 'border-blue-400',
        bg: 'bg-blue-700/50',
        innerBorder: 'border-blue-400',
        text: 'text-blue-200',
        nameText: 'text-blue-200',
        shadow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]',
      },
      5: {
        border: 'border-indigo-400',
        bg: 'bg-indigo-700/60',
        innerBorder: 'border-indigo-400',
        text: 'text-indigo-200',
        nameText: 'text-indigo-200',
        shadow: 'shadow-[0_0_20px_rgba(129,140,248,0.6)]',
      },
    },
    backend: {
      1: {
        border: 'border-pink-300',
        bg: 'bg-pink-900/20',
        innerBorder: 'border-pink-300',
        text: 'text-pink-300',
        nameText: 'text-pink-300',
        shadow: 'shadow-[0_0_8px_rgba(249,168,212,0.3)]',
      },
      2: {
        border: 'border-pink-400',
        bg: 'bg-pink-800/30',
        innerBorder: 'border-pink-400',
        text: 'text-pink-300',
        nameText: 'text-pink-300',
        shadow: 'shadow-[0_0_10px_rgba(244,114,182,0.35)]',
      },
      3: {
        border: 'border-fuchsia-500',
        bg: 'bg-fuchsia-800/40',
        innerBorder: 'border-fuchsia-500',
        text: 'text-fuchsia-300',
        nameText: 'text-fuchsia-300',
        shadow: 'shadow-[0_0_12px_rgba(217,70,239,0.4)]',
      },
      4: {
        border: 'border-purple-400',
        bg: 'bg-purple-700/50',
        innerBorder: 'border-purple-400',
        text: 'text-purple-200',
        nameText: 'text-purple-200',
        shadow: 'shadow-[0_0_15px_rgba(192,132,252,0.5)]',
      },
      5: {
        border: 'border-violet-400',
        bg: 'bg-violet-700/60',
        innerBorder: 'border-violet-400',
        text: 'text-violet-200',
        nameText: 'text-violet-200',
        shadow: 'shadow-[0_0_20px_rgba(167,139,250,0.6)]',
      },
    },
    infrastructure: {
      1: {
        border: 'border-yellow-300',
        bg: 'bg-yellow-900/20',
        innerBorder: 'border-yellow-300',
        text: 'text-yellow-300',
        nameText: 'text-yellow-300',
        shadow: 'shadow-[0_0_8px_rgba(253,224,71,0.3)]',
      },
      2: {
        border: 'border-amber-400',
        bg: 'bg-amber-800/30',
        innerBorder: 'border-amber-400',
        text: 'text-amber-300',
        nameText: 'text-amber-300',
        shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.35)]',
      },
      3: {
        border: 'border-orange-500',
        bg: 'bg-orange-800/40',
        innerBorder: 'border-orange-500',
        text: 'text-orange-300',
        nameText: 'text-orange-300',
        shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
      },
      4: {
        border: 'border-orange-400',
        bg: 'bg-orange-700/50',
        innerBorder: 'border-orange-400',
        text: 'text-orange-200',
        nameText: 'text-orange-200',
        shadow: 'shadow-[0_0_15px_rgba(251,146,60,0.5)]',
      },
      5: {
        border: 'border-red-400',
        bg: 'bg-red-700/60',
        innerBorder: 'border-red-400',
        text: 'text-red-200',
        nameText: 'text-red-200',
        shadow: 'shadow-[0_0_20px_rgba(248,113,113,0.6)]',
      },
    },
    devops: {
      1: {
        border: 'border-lime-300',
        bg: 'bg-lime-900/20',
        innerBorder: 'border-lime-300',
        text: 'text-lime-300',
        nameText: 'text-lime-300',
        shadow: 'shadow-[0_0_8px_rgba(190,242,100,0.3)]',
      },
      2: {
        border: 'border-lime-400',
        bg: 'bg-lime-800/30',
        innerBorder: 'border-lime-400',
        text: 'text-lime-300',
        nameText: 'text-lime-300',
        shadow: 'shadow-[0_0_10px_rgba(163,230,53,0.35)]',
      },
      3: {
        border: 'border-green-500',
        bg: 'bg-green-800/40',
        innerBorder: 'border-green-500',
        text: 'text-green-300',
        nameText: 'text-green-300',
        shadow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]',
      },
      4: {
        border: 'border-green-400',
        bg: 'bg-green-700/50',
        innerBorder: 'border-green-400',
        text: 'text-green-200',
        nameText: 'text-green-200',
        shadow: 'shadow-[0_0_15px_rgba(74,222,128,0.5)]',
      },
      5: {
        border: 'border-emerald-400',
        bg: 'bg-emerald-700/60',
        innerBorder: 'border-emerald-400',
        text: 'text-emerald-200',
        nameText: 'text-emerald-200',
        shadow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
      },
    },
  };

  const tierStyle = categoryTierStyles[skill.category]?.[skill.tier] || categoryTierStyles[skill.category]?.[1];

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
            ? `${tierStyle.bg} ${tierStyle.border}`
            : `bg-[#1a1a2e] ${tierStyle.border} opacity-60`
          }
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f0f23] scale-110' : ''}
          ${isUnlocked
            ? 'shadow-[0_0_25px_rgba(251,191,36,0.7)]'
            : isInProgress
            ? tierStyle.shadow
            : isSelected ? 'opacity-100' : ''
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
              ? `${tierStyle.innerBorder} opacity-60`
              : `${tierStyle.innerBorder} opacity-40`
            }
          `}
        />

        {/* Skill initial or star */}
        <span
          className={`text-xl font-bold z-10 ${
            isUnlocked ? 'text-amber-300' : isInProgress ? tierStyle.text : 'text-gray-500'
          }`}
        >
          {isUnlocked ? '\u2605' : skill.name.charAt(0)}
        </span>
      </div>

      {/* Skill name */}
      <span
        className={`mt-2 text-xs text-center max-w-20 truncate ${
          isUnlocked ? 'text-amber-200' : isInProgress ? tierStyle.nameText : 'text-gray-500'
        }`}
      >
        {skill.name}
      </span>
    </div>
  );
}
