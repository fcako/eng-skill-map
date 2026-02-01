'use client';

import { SkillTreeCanvas } from './SkillTreeCanvas';
import { SkillDetailPanel } from './SkillDetailPanel';
import { PointsDisplay } from './PointsDisplay';
import { CategoryLegend } from './CategoryLegend';

export function SkillTreeContainer() {
  return (
    <div className="h-screen flex flex-col bg-[var(--background)]">
      {/* Header - 固定、セーフエリア対応 */}
      <header
        className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b border-gray-800 bg-[var(--background-secondary)] gap-2 sm:gap-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
      >
        <div className="flex items-center gap-2 sm:gap-8 w-full sm:w-auto justify-between sm:justify-start">
          <h1 className="text-sm sm:text-xl font-bold text-white">
            Engineer Skill Map
          </h1>
          <div className="sm:hidden">
            <PointsDisplay />
          </div>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <CategoryLegend />
          <div className="hidden sm:block">
            <PointsDisplay />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Skill tree canvas */}
        <main className="flex-1 overflow-auto">
          <SkillTreeCanvas />
        </main>

        {/* Detail panel - モバイルではオーバーレイ */}
        <SkillDetailPanel />
      </div>

      {/* Footer hint - デスクトップのみ */}
      <footer className="hidden sm:flex px-6 py-2 border-t border-gray-800 bg-[var(--background-secondary)] text-xs text-gray-500 items-center justify-between">
        <div>
          クリック: 詳細表示 | 修得項目をチェックしてスキルをマスター
        </div>
        <div>
          データはブラウザに保存されます
        </div>
      </footer>
    </div>
  );
}
