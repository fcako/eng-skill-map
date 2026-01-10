'use client';

import { useSkillTreeStore } from '@/store/skillTreeStore';
import { getSkillById, CATEGORY_NAMES } from '@/data/skills';

export function SkillDetailPanel() {
  const { selectedSkillId, unlockedSkills, toggleSkill, selectSkill } =
    useSkillTreeStore();

  const skill = selectedSkillId ? getSkillById(selectedSkillId) : null;
  const isUnlocked = skill ? unlockedSkills.includes(skill.id) : false;

  if (!skill) {
    return (
      <div className="w-80 bg-[var(--background-secondary)] border-l border-gray-700 p-6 flex flex-col items-center justify-center text-center">
        <div className="text-gray-500 text-sm">
          スキルをクリックして詳細を表示
          <br />
          ダブルクリックでアンロック/ロック
        </div>
      </div>
    );
  }

  const tierLabels: Record<number, string> = {
    1: '入門',
    2: '初級',
    3: '中級',
    4: '上級',
    5: 'マスター',
  };

  const tierColors: Record<number, string> = {
    1: 'bg-gray-500',
    2: 'bg-blue-500',
    3: 'bg-purple-500',
    4: 'bg-amber-500',
    5: 'bg-red-500',
  };

  return (
    <div className="w-80 bg-[var(--background-secondary)] border-l border-gray-700 p-6 flex flex-col">
      {/* Close button */}
      <button
        onClick={() => selectSkill(null)}
        className="self-end text-gray-500 hover:text-white mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Skill icon and name */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
            isUnlocked
              ? 'bg-green-900/50 border-2 border-green-500 text-green-400'
              : 'bg-gray-800 border-2 border-gray-600 text-gray-400'
          }`}
        >
          {skill.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{skill.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${tierColors[skill.tier]} text-white`}
            >
              Tier {skill.tier} - {tierLabels[skill.tier]}
            </span>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="mb-4">
        <span className="text-xs text-gray-500">カテゴリ</span>
        <div className="text-sm text-gray-300">
          {CATEGORY_NAMES[skill.category]}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <span className="text-xs text-gray-500">説明</span>
        <p className="text-sm text-gray-300 mt-1">{skill.description}</p>
      </div>

      {/* Point value */}
      <div className="mb-6">
        <span className="text-xs text-gray-500">ポイント</span>
        <div className="text-2xl font-bold text-amber-400">
          +{skill.pointValue} pt
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <span className="text-xs text-gray-500">ステータス</span>
        <div
          className={`text-sm font-medium mt-1 ${isUnlocked ? 'text-green-400' : 'text-gray-400'}`}
        >
          {isUnlocked ? '習得済み' : '未習得'}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => toggleSkill(skill.id)}
        className={`mt-auto py-3 px-6 rounded-lg font-medium transition-all ${
          isUnlocked
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : 'bg-green-600 hover:bg-green-500 text-white'
        }`}
      >
        {isUnlocked ? 'スキルをロック' : 'スキルをアンロック'}
      </button>
    </div>
  );
}
