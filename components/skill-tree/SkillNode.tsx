'use client';

import { useEffect, useState } from 'react';
import { Skill } from '@/types/skill';
import { useSkillTreeStore } from '@/store/skillTreeStore';

interface SkillNodeProps {
  skill: Skill;
}

export function SkillNode({ skill }: SkillNodeProps) {
  const [mounted, setMounted] = useState(false);
  const { selectedSkillId, selectSkill, getSkillProgress } =
    useSkillTreeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSelected = mounted && selectedSkillId === skill.id;
  const progress = mounted ? getSkillProgress(skill.id) : { completed: 0, total: 0, percentage: 0 };
  const isUnlocked = mounted && progress.percentage === 100;
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
    dimBorder: string;
    dimInnerBorder: string;
    dimText: string;
  }>> = {
    frontend: {
      1: {
        border: 'border-sky-300',
        bg: 'bg-sky-900/20',
        innerBorder: 'border-sky-300',
        text: 'text-sky-300',
        nameText: 'text-sky-300',
        shadow: 'shadow-[0_0_8px_rgba(125,211,252,0.3)]',
        dimBorder: 'border-sky-300/40',
        dimInnerBorder: 'border-sky-300/30',
        dimText: 'text-sky-300/50',
      },
      2: {
        border: 'border-sky-400',
        bg: 'bg-sky-800/30',
        innerBorder: 'border-sky-400',
        text: 'text-sky-300',
        nameText: 'text-sky-300',
        shadow: 'shadow-[0_0_10px_rgba(56,189,248,0.35)]',
        dimBorder: 'border-sky-400/40',
        dimInnerBorder: 'border-sky-400/30',
        dimText: 'text-sky-300/50',
      },
      3: {
        border: 'border-blue-500',
        bg: 'bg-blue-800/40',
        innerBorder: 'border-blue-500',
        text: 'text-blue-300',
        nameText: 'text-blue-300',
        shadow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
        dimBorder: 'border-blue-500/40',
        dimInnerBorder: 'border-blue-500/30',
        dimText: 'text-blue-300/50',
      },
      4: {
        border: 'border-blue-400',
        bg: 'bg-blue-700/50',
        innerBorder: 'border-blue-400',
        text: 'text-blue-200',
        nameText: 'text-blue-200',
        shadow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]',
        dimBorder: 'border-blue-400/40',
        dimInnerBorder: 'border-blue-400/30',
        dimText: 'text-blue-200/50',
      },
      5: {
        border: 'border-indigo-400',
        bg: 'bg-indigo-700/60',
        innerBorder: 'border-indigo-400',
        text: 'text-indigo-200',
        nameText: 'text-indigo-200',
        shadow: 'shadow-[0_0_20px_rgba(129,140,248,0.6)]',
        dimBorder: 'border-indigo-400/40',
        dimInnerBorder: 'border-indigo-400/30',
        dimText: 'text-indigo-200/50',
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
        dimBorder: 'border-pink-300/40',
        dimInnerBorder: 'border-pink-300/30',
        dimText: 'text-pink-300/50',
      },
      2: {
        border: 'border-pink-400',
        bg: 'bg-pink-800/30',
        innerBorder: 'border-pink-400',
        text: 'text-pink-300',
        nameText: 'text-pink-300',
        shadow: 'shadow-[0_0_10px_rgba(244,114,182,0.35)]',
        dimBorder: 'border-pink-400/40',
        dimInnerBorder: 'border-pink-400/30',
        dimText: 'text-pink-300/50',
      },
      3: {
        border: 'border-fuchsia-500',
        bg: 'bg-fuchsia-800/40',
        innerBorder: 'border-fuchsia-500',
        text: 'text-fuchsia-300',
        nameText: 'text-fuchsia-300',
        shadow: 'shadow-[0_0_12px_rgba(217,70,239,0.4)]',
        dimBorder: 'border-fuchsia-500/40',
        dimInnerBorder: 'border-fuchsia-500/30',
        dimText: 'text-fuchsia-300/50',
      },
      4: {
        border: 'border-purple-400',
        bg: 'bg-purple-700/50',
        innerBorder: 'border-purple-400',
        text: 'text-purple-200',
        nameText: 'text-purple-200',
        shadow: 'shadow-[0_0_15px_rgba(192,132,252,0.5)]',
        dimBorder: 'border-purple-400/40',
        dimInnerBorder: 'border-purple-400/30',
        dimText: 'text-purple-200/50',
      },
      5: {
        border: 'border-violet-400',
        bg: 'bg-violet-700/60',
        innerBorder: 'border-violet-400',
        text: 'text-violet-200',
        nameText: 'text-violet-200',
        shadow: 'shadow-[0_0_20px_rgba(167,139,250,0.6)]',
        dimBorder: 'border-violet-400/40',
        dimInnerBorder: 'border-violet-400/30',
        dimText: 'text-violet-200/50',
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
        dimBorder: 'border-yellow-300/40',
        dimInnerBorder: 'border-yellow-300/30',
        dimText: 'text-yellow-300/50',
      },
      2: {
        border: 'border-amber-400',
        bg: 'bg-amber-800/30',
        innerBorder: 'border-amber-400',
        text: 'text-amber-300',
        nameText: 'text-amber-300',
        shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.35)]',
        dimBorder: 'border-amber-400/40',
        dimInnerBorder: 'border-amber-400/30',
        dimText: 'text-amber-300/50',
      },
      3: {
        border: 'border-orange-500',
        bg: 'bg-orange-800/40',
        innerBorder: 'border-orange-500',
        text: 'text-orange-300',
        nameText: 'text-orange-300',
        shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
        dimBorder: 'border-orange-500/40',
        dimInnerBorder: 'border-orange-500/30',
        dimText: 'text-orange-300/50',
      },
      4: {
        border: 'border-orange-400',
        bg: 'bg-orange-700/50',
        innerBorder: 'border-orange-400',
        text: 'text-orange-200',
        nameText: 'text-orange-200',
        shadow: 'shadow-[0_0_15px_rgba(251,146,60,0.5)]',
        dimBorder: 'border-orange-400/40',
        dimInnerBorder: 'border-orange-400/30',
        dimText: 'text-orange-200/50',
      },
      5: {
        border: 'border-red-400',
        bg: 'bg-red-700/60',
        innerBorder: 'border-red-400',
        text: 'text-red-200',
        nameText: 'text-red-200',
        shadow: 'shadow-[0_0_20px_rgba(248,113,113,0.6)]',
        dimBorder: 'border-red-400/40',
        dimInnerBorder: 'border-red-400/30',
        dimText: 'text-red-200/50',
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
        dimBorder: 'border-lime-300/40',
        dimInnerBorder: 'border-lime-300/30',
        dimText: 'text-lime-300/50',
      },
      2: {
        border: 'border-lime-400',
        bg: 'bg-lime-800/30',
        innerBorder: 'border-lime-400',
        text: 'text-lime-300',
        nameText: 'text-lime-300',
        shadow: 'shadow-[0_0_10px_rgba(163,230,53,0.35)]',
        dimBorder: 'border-lime-400/40',
        dimInnerBorder: 'border-lime-400/30',
        dimText: 'text-lime-300/50',
      },
      3: {
        border: 'border-green-500',
        bg: 'bg-green-800/40',
        innerBorder: 'border-green-500',
        text: 'text-green-300',
        nameText: 'text-green-300',
        shadow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]',
        dimBorder: 'border-green-500/40',
        dimInnerBorder: 'border-green-500/30',
        dimText: 'text-green-300/50',
      },
      4: {
        border: 'border-green-400',
        bg: 'bg-green-700/50',
        innerBorder: 'border-green-400',
        text: 'text-green-200',
        nameText: 'text-green-200',
        shadow: 'shadow-[0_0_15px_rgba(74,222,128,0.5)]',
        dimBorder: 'border-green-400/40',
        dimInnerBorder: 'border-green-400/30',
        dimText: 'text-green-200/50',
      },
      5: {
        border: 'border-emerald-400',
        bg: 'bg-emerald-700/60',
        innerBorder: 'border-emerald-400',
        text: 'text-emerald-200',
        nameText: 'text-emerald-200',
        shadow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
        dimBorder: 'border-emerald-400/40',
        dimInnerBorder: 'border-emerald-400/30',
        dimText: 'text-emerald-200/50',
      },
    },
  };

  const tierStyle = categoryTierStyles[skill.category]?.[skill.tier] || categoryTierStyles[skill.category]?.[1];

  return (
    <div
      className={`
        absolute flex flex-col items-center cursor-pointer select-none
        transition-all duration-300
        ${!isUnlocked && !isInProgress ? 'opacity-80 hover:opacity-100 active:opacity-100' : ''}
        hover:scale-110 active:scale-110
      `}
      style={{
        left: skill.position.x,
        top: skill.position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
      onClick={handleClick}
    >
      {/* Main node */}
      <div
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          border-3 transition-all duration-300
          ${isUnlocked
            ? 'border-amber-400'
            : isInProgress
            ? `${tierStyle.border}`
            : `${tierStyle.dimBorder}`
          }
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f0f23] scale-110' : ''}
          ${isUnlocked
            ? 'shadow-[0_0_25px_rgba(251,191,36,0.7)]'
            : isInProgress
            ? tierStyle.shadow
            : ''
          }
        `}
        style={{
          borderWidth: '3px',
          backgroundColor: isUnlocked ? 'rgba(46, 42, 10, 0.95)' : 'rgba(15, 15, 35, 0.98)',
        }}
      >
        {/* Inner circle decoration */}
        <div
          className={`
            absolute inset-2 rounded-full border
            ${isUnlocked
              ? 'border-amber-400 opacity-60'
              : isInProgress
              ? `${tierStyle.innerBorder} opacity-60`
              : `${tierStyle.dimInnerBorder}`
            }
          `}
        />

        {/* Skill initial or star */}
        <span
          className={`text-xl font-bold z-10 ${
            isUnlocked ? 'text-amber-300' : isInProgress ? tierStyle.text : `${tierStyle.dimText}`
          }`}
        >
          {isUnlocked ? '\u2605' : skill.name.charAt(0)}
        </span>
      </div>

      {/* Skill name */}
      <span
        className={`mt-2 text-xs text-center max-w-20 truncate ${
          isUnlocked ? 'text-amber-200' : isInProgress ? tierStyle.nameText : 'text-gray-300'
        }`}
      >
        {skill.name}
      </span>
    </div>
  );
}
