'use client';

import { SkillTreeCanvas } from './SkillTreeCanvas';
import { SkillDetailPanel } from './SkillDetailPanel';
import { CategoryTabs } from './CategoryTabs';
import { PointsDisplay } from './PointsDisplay';

export function SkillTreeContainer() {
  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[var(--background-secondary)]">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-6 h-6 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Eng Skill Map
          </h1>
          <CategoryTabs />
        </div>
        <PointsDisplay />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Skill tree canvas */}
        <main className="flex-1 overflow-auto">
          <SkillTreeCanvas />
        </main>

        {/* Detail panel */}
        <SkillDetailPanel />
      </div>

      {/* Footer hint */}
      <footer className="px-6 py-2 border-t border-gray-800 bg-[var(--background-secondary)] text-xs text-gray-500 flex items-center justify-between">
        <div>
          クリック: 詳細表示 | ダブルクリック: アンロック/ロック切替
        </div>
        <div>
          データはブラウザに保存されます
        </div>
      </footer>
    </div>
  );
}
