'use client';

import { useEffect } from 'react';
import { useSkillTreeStore } from '@/store/skillTreeStore';
import { getSkillById, CATEGORY_NAMES } from '@/data/skills';
import { ResourceType } from '@/types/skill';

export function SkillDetailPanel() {
  const {
    selectedSkillId,
    selectSkill,
    toggleLearningItem,
    isLearningItemCompleted,
    getSkillProgress,
  } = useSkillTreeStore();

  const skill = selectedSkillId ? getSkillById(selectedSkillId) : null;
  const progress = skill ? getSkillProgress(skill.id) : { completed: 0, total: 0, percentage: 0 };

  // モバイルでスキル選択時は背景スクロールを無効化
  useEffect(() => {
    if (skill) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [skill]);

  // モバイルでスキル未選択時は非表示
  if (!skill) {
    return (
      <div className="hidden sm:flex w-80 bg-[var(--background-secondary)] border-l border-gray-700 p-6 flex-col items-center justify-center text-center">
        <div className="text-gray-500 text-sm">
          スキルをクリックして詳細を表示
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

  const categoryColors: Record<string, string> = {
    frontend: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    backend: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    infrastructure: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
    devops: 'bg-green-500/20 text-green-300 border border-green-500/40',
  };

  const resourceTypeConfig: Record<ResourceType, { icon: string; label: string }> = {
    book: { icon: '\u{1F4DA}', label: '書籍' },
    tutorial: { icon: '\u{1F310}', label: 'チュートリアル' },
    documentation: { icon: '\u{1F4D6}', label: '公式ドキュメント' },
    course: { icon: '\u{1F393}', label: 'コース' },
    video: { icon: '\u{1F3AC}', label: '動画' },
  };

  return (
    <>
      {/* モバイル用オーバーレイ背景 */}
      <div
        className="sm:hidden fixed inset-0 bg-black/60 z-40 touch-none"
        onClick={() => selectSkill(null)}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 sm:relative sm:inset-auto sm:w-80 bg-[var(--background-secondary)] border-t sm:border-t-0 sm:border-l border-gray-700 flex flex-col max-h-[80vh] sm:max-h-none sm:h-full rounded-t-2xl sm:rounded-none">
        {/* Fixed header: close button + skill name */}
        <div className="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4">
          <button
            onClick={() => selectSkill(null)}
            className="float-right text-gray-500 hover:text-white p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 sm:h-5 sm:w-5"
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

          {/* モバイル用ドラッグハンドル */}
          <div className="sm:hidden flex justify-center mb-3">
            <div className="w-10 h-1 bg-gray-600 rounded-full" />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all ${
                progress.percentage === 100
                  ? 'bg-amber-900/50 border-2 border-amber-400 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : progress.completed > 0
                  ? 'bg-blue-900/50 border-2 border-blue-400 text-blue-400'
                  : 'bg-gray-800 border-2 border-gray-600 text-gray-400'
              }`}
            >
              {progress.percentage === 100 ? (
                <span>&#9733;</span>
              ) : (
                skill.name.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">{skill.name}</h2>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[skill.category]}`}>
                  {CATEGORY_NAMES[skill.category]}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${tierColors[skill.tier]} text-white`}
              >
                Tier {skill.tier} - {tierLabels[skill.tier]}
              </span>
            </div>
          </div>
        </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6">
        {/* Description */}
        <div className="mb-4">
          <span className="text-xs text-gray-500">説明</span>
          <p className="text-sm text-gray-300 mt-1">{skill.description}</p>
        </div>

        {/* Point value + Status */}
        <div className="flex items-end gap-4 mb-6">
          <div>
            <span className="text-xs text-gray-500">獲得ポイント</span>
            <div className="text-2xl font-bold text-amber-400">
              {progress.completed} / {progress.total} pt
            </div>
          </div>
          <div className="flex items-center gap-1.5 pb-1">
            {progress.percentage === 100 ? (
              <>
                <span className="text-amber-400">&#9733;</span>
                <span className="text-sm font-medium text-amber-400">マスター</span>
              </>
            ) : progress.completed > 0 ? (
              <>
                <span className="text-blue-400">&#9654;</span>
                <span className="text-sm font-medium text-blue-400">進行中</span>
              </>
            ) : (
              <>
                <span className="text-gray-500">&#9711;</span>
                <span className="text-sm font-medium text-gray-400">未着手</span>
              </>
            )}
          </div>
        </div>

        {/* Learning Items */}
        {skill.learningItems && skill.learningItems.length > 0 && (
          <div>
            {/* Checklist */}
            <ul className="space-y-2">
              {skill.learningItems.map((item) => {
                const isCompleted = isLearningItemCompleted(item.id);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleLearningItem(item.id)}
                      className={`w-full flex items-start gap-3 p-2 rounded-lg transition-all text-left ${
                        isCompleted
                          ? 'bg-green-900/20 hover:bg-green-900/30'
                          : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                            : 'border-gray-500 hover:border-gray-400 hover:shadow-[0_0_8px_rgba(156,163,175,0.3)]'
                        }`}
                      >
                        {isCompleted && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-sm transition-colors ${
                          isCompleted ? 'text-green-400' : 'text-gray-300'
                        }`}
                      >
                        {item.content}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Resources */}
        {skill.resources && skill.resources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h3 className="text-xs text-gray-500 mb-3">参考リソース</h3>
            <ul className="space-y-2">
              {skill.resources.map((resource, index) => {
                const config = resourceTypeConfig[resource.type];
                return (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 text-sm">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-gray-500">{config.label}</span>
                      {resource.url ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-400 hover:text-blue-300 hover:underline truncate"
                        >
                          {resource.title}
                          <svg
                            className="inline-block w-3 h-3 ml-1 opacity-60"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ) : (
                        <span className="block text-sm text-gray-300">{resource.title}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
