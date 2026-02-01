'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSkillTreeStore } from '@/store/skillTreeStore';
import { getAllSkills, MAP_CENTER } from '@/data/skills';

export function PointsDisplay() {
  const [mounted, setMounted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { getTotalPoints, unlockedSkills, completedLearningItems } = useSkillTreeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPoints = mounted ? getTotalPoints() : 0;
  const allSkills = getAllSkills();
  const totalSkillCount = allSkills.length;
  const masteredSkillCount = mounted ? unlockedSkills.length : 0;
  const totalLearningItems = allSkills.reduce((sum, skill) => sum + skill.learningItems.length, 0);
  const completedItemCount = mounted ? completedLearningItems.length : 0;

  // レベル計算: Lv1→2は1pt、Lv2→3は2pt、...
  let overallLevel = 1;
  let pointsInLevel = totalPoints;
  while (pointsInLevel >= overallLevel) {
    pointsInLevel -= overallLevel;
    overallLevel++;
  }
  const pointsForNext = overallLevel;
  const levelProgress = pointsForNext > 0 ? (pointsInLevel / pointsForNext) * 100 : 0;
  const pointsNeeded = pointsForNext - pointsInLevel;

  // マップ画像をダウンロード/共有
  const handleDownloadMap = useCallback(async () => {
    if (isDownloading) return;

    const canvas = document.getElementById('skill-map-canvas') as HTMLElement;
    if (!canvas) return;

    setIsDownloading(true);
    try {
      // ベースのスキル位置からマップサイズを計算（スケール前の値）
      const skills = getAllSkills();
      const padding = 150;
      const xs = skills.map((s) => s.position.x);
      const ys = skills.map((s) => s.position.y);
      const mapWidth = Math.max(...xs) + padding;
      const mapHeight = Math.max(...ys) + padding;

      // modern-screenshotを使用（lab()カラーに対応）
      const { domToBlob } = await import('modern-screenshot');
      const blob = await domToBlob(canvas, {
        backgroundColor: '#0f0f23',
        scale: 1,
        width: mapWidth,
        height: mapHeight,
        style: {
          transform: 'none',
        },
      });

      if (!blob) {
        throw new Error('画像の生成に失敗しました');
      }

      const fileName = `skill-map-${new Date().toISOString().split('T')[0]}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Web Share APIで共有シートを表示（iOS/Android）
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'スキルマップ',
        });
        return;
      }

      // フォールバック: ダウンロードリンク（デスクトップブラウザ）
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      // ユーザーがキャンセルした場合は無視
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to download map:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`画像の保存に失敗しました: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading]);

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-6">
        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => setShowStats(true)}
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border-2 border-gray-500 overflow-hidden hover:border-gray-400 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400 translate-y-1"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M12 14c-6 0-8 3-8 6v1h16v-1c0-3-2-6-8-6z" />
            </svg>
          </button>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full text-black pointer-events-none">
            Lv.{overallLevel}
          </div>
        </div>

        {/* Next level progress - デスクトップのみ詳細表示 */}
        <div className="hidden sm:flex flex-col">
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

      {/* Stats Modal */}
      {showStats && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setShowStats(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[320px] sm:w-[380px] bg-[var(--background-secondary)] border border-gray-700 rounded-2xl p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowStats(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border-2 border-gray-500 overflow-hidden">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-12 h-12 text-gray-400 translate-y-1"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M12 14c-6 0-8 3-8 6v1h16v-1c0-3-2-6-8-6z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Level {overallLevel}</div>
                <div className="text-gray-400 text-sm">エンジニア見習い</div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              {/* Total Points */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">獲得ポイント</span>
                  <span className="text-amber-400 font-bold text-lg">{totalPoints} pt</span>
                </div>
              </div>

              {/* Mastered Skills */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">マスタースキル</span>
                  <span className="text-green-400 font-bold">
                    {masteredSkillCount} / {totalSkillCount}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{ width: `${(masteredSkillCount / totalSkillCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Completed Learning Items */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">修得項目</span>
                  <span className="text-blue-400 font-bold">
                    {completedItemCount} / {totalLearningItems}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${(completedItemCount / totalLearningItems) * 100}%` }}
                  />
                </div>
              </div>

              {/* Next Level */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="text-amber-400 text-sm mb-2">次のレベルまで</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-amber-400">{pointsNeeded}</span>
                  <span className="text-gray-400">ポイント</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <div className="text-gray-500 text-xs mt-2">
                  修得項目をチェックしてポイントを獲得しよう
                </div>
              </div>

              {/* Download Map Button */}
              <button
                onClick={handleDownloadMap}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 disabled:text-gray-500 rounded-lg px-4 py-3 text-white text-sm transition-colors mt-4"
              >
                {isDownloading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>マップを画像として保存</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
