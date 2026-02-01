'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { SkillNode } from './SkillNode';
import { SkillConnection } from './SkillConnection';
import { getAllSkills, getSkillById, MAP_CENTER } from '@/data/skills';
import { useSkillTreeStore } from '@/store/skillTreeStore';
import { Skill } from '@/types/skill';

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.5;
const SCALE_STEP = 0.1;

// 2点間の距離を計算
const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

export function SkillTreeCanvas() {
  const baseSkills = useMemo(() => getAllSkills(), []);
  const { selectSkill, visibleCategories } = useSkillTreeStore();
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPinchDistance = useRef<number | null>(null);

  // スケールに応じてノードの位置を再計算（ノードサイズは固定）
  const skills: Skill[] = useMemo(() => {
    return baseSkills.map((skill) => ({
      ...skill,
      position: {
        x: MAP_CENTER.x + (skill.position.x - MAP_CENTER.x) * scale,
        y: MAP_CENTER.y + (skill.position.y - MAP_CENTER.y) * scale,
      },
    }));
  }, [baseSkills, scale]);

  // 表示カテゴリでフィルタ
  const visibleSkills = useMemo(
    () => skills.filter((s) => visibleCategories.includes(s.category)),
    [skills, visibleCategories]
  );

  const visibleSkillIds = useMemo(
    () => new Set(visibleSkills.map((s) => s.id)),
    [visibleSkills]
  );

  const handleCanvasClick = () => {
    selectSkill(null);
  };

  const handleScaleUp = () => {
    setScale((prev) => Math.min(MAX_SCALE, prev + SCALE_STEP));
  };

  const handleScaleDown = () => {
    setScale((prev) => Math.max(MIN_SCALE, prev - SCALE_STEP));
  };

  const handleScaleReset = () => {
    setScale(1.0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  };

  // 初期表示時にマップ中心を画面中央に配置
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // コンテナサイズを取得
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // MAP_CENTERが画面中央に来るようにスクロール位置を計算
    const scrollX = MAP_CENTER.x - containerWidth / 2;
    const scrollY = MAP_CENTER.y - containerHeight / 2;

    container.scrollTo(scrollX, scrollY);
  }, []);

  // ピンチズーム対応（タッチ + ホイール）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // タッチイベント（2本指ピンチ）
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastPinchDistance.current = getDistance(
          e.touches[0] as unknown as React.Touch,
          e.touches[1] as unknown as React.Touch
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistance.current !== null) {
        e.preventDefault();
        const currentDistance = getDistance(
          e.touches[0] as unknown as React.Touch,
          e.touches[1] as unknown as React.Touch
        );
        const delta = currentDistance - lastPinchDistance.current;

        // 感度調整（距離の変化量に応じてスケールを変更）
        const scaleDelta = delta * 0.005;

        setScale((prev) => {
          const newScale = prev + scaleDelta;
          return Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        });

        lastPinchDistance.current = currentDistance;
      }
    };

    const handleTouchEnd = () => {
      lastPinchDistance.current = null;
    };

    // ホイールイベント（Ctrl/Cmd + スクロールまたはトラックパッドピンチ）
    const handleWheel = (e: WheelEvent) => {
      // ctrlKeyはトラックパッドのピンチジェスチャーでもtrueになる
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const scaleDelta = -e.deltaY * 0.01;
        setScale((prev) => {
          const newScale = prev + scaleDelta;
          return Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        });
      }
    };

    // passive: false でpreventDefaultを有効にする
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // キーボード操作
  useEffect(() => {
    const SCROLL_SPEED = 50;

    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // 入力フィールドにフォーカスがある場合は無視
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        // WASD で移動
        case 'w':
          container.scrollBy({ top: -SCROLL_SPEED, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 's':
          container.scrollBy({ top: SCROLL_SPEED, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'a':
          container.scrollBy({ left: -SCROLL_SPEED, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'd':
          container.scrollBy({ left: SCROLL_SPEED, behavior: 'smooth' });
          e.preventDefault();
          break;
        // Q/E で拡大縮小
        case 'q':
          setScale((prev) => Math.max(MIN_SCALE, prev - SCALE_STEP));
          e.preventDefault();
          break;
        case 'e':
          setScale((prev) => Math.min(MAX_SCALE, prev + SCALE_STEP));
          e.preventDefault();
          break;
        // R でリセット
        case 'r':
          setScale(1.0);
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate connection pairs
  const connections = useMemo(() => {
    const pairs: { from: string; to: string }[] = [];
    baseSkills.forEach((skill) => {
      skill.connections.forEach((targetId) => {
        const targetSkill = getSkillById(targetId);
        if (targetSkill) {
          pairs.push({ from: skill.id, to: targetId });
        }
      });
    });
    return pairs;
  }, [baseSkills]);

  // スケール済みスキルからIDで検索
  const getScaledSkillById = (id: string) => skills.find((s) => s.id === id);

  // Calculate canvas size based on skill positions
  const canvasBounds = useMemo(() => {
    if (skills.length === 0) return { minX: 0, minY: 0, maxX: 1400, maxY: 1400 };

    const padding = 100;
    const xs = skills.map((s) => s.position.x);
    const ys = skills.map((s) => s.position.y);

    return {
      minX: Math.min(...xs) - padding,
      minY: Math.min(...ys) - padding,
      maxX: Math.max(...xs) + padding,
      maxY: Math.max(...ys) + padding + 80,
    };
  }, [skills]);

  const canvasSize = useMemo(() => {
    return {
      width: canvasBounds.maxX,
      height: canvasBounds.maxY,
    };
  }, [canvasBounds]);

  // スクロール範囲を制限
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // スクロール可能な範囲を計算（マップの境界から画面半分のマージン）
      const minScrollX = Math.max(0, canvasBounds.minX - containerWidth / 3);
      const maxScrollX = Math.max(0, canvasBounds.maxX - containerWidth * 2 / 3);
      const minScrollY = Math.max(0, canvasBounds.minY - containerHeight / 3);
      const maxScrollY = Math.max(0, canvasBounds.maxY - containerHeight * 2 / 3);

      let needsCorrection = false;
      let newScrollX = container.scrollLeft;
      let newScrollY = container.scrollTop;

      if (container.scrollLeft < minScrollX) {
        newScrollX = minScrollX;
        needsCorrection = true;
      } else if (container.scrollLeft > maxScrollX) {
        newScrollX = maxScrollX;
        needsCorrection = true;
      }

      if (container.scrollTop < minScrollY) {
        newScrollY = minScrollY;
        needsCorrection = true;
      } else if (container.scrollTop > maxScrollY) {
        newScrollY = maxScrollY;
        needsCorrection = true;
      }

      if (needsCorrection) {
        container.scrollTo(newScrollX, newScrollY);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [canvasBounds]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto bg-[var(--background)]"
    >
      {/* Scale controls */}
      <div className="fixed bottom-4 sm:bottom-20 left-3 sm:left-6 z-20 flex flex-row sm:flex-col items-center gap-2 bg-gray-800/80 rounded-lg p-2 sm:p-3 backdrop-blur-sm">
        <button
          onClick={handleScaleDown}
          className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors sm:order-4"
          title="縮める"
        >
          -
        </button>

        {/* スライダー（モバイル:横向き、デスクトップ:縦向き） */}
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.05}
          value={scale}
          onChange={handleSliderChange}
          className="w-20 sm:w-24 h-2 appearance-none bg-gray-600 rounded-lg cursor-pointer sm:rotate-[-90deg] sm:my-8"
          style={{
            accentColor: '#3b82f6',
          }}
          title={`${Math.round(scale * 100)}%`}
        />

        <button
          onClick={handleScaleReset}
          className="w-10 h-6 flex items-center justify-center text-xs text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors sm:order-2"
          title="リセット"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleScaleUp}
          className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors sm:order-1"
          title="広げる"
        >
          +
        </button>
      </div>

      {/* 操作方法 - デスクトップのみ */}
      <div className="hidden sm:block fixed top-28 left-4 z-20 bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm text-gray-400 text-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">W</kbd>
              <div className="flex gap-px mt-px">
                <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">A</kbd>
                <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">S</kbd>
                <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">D</kbd>
              </div>
            </div>
            <span className="text-gray-500">移動</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">Q</kbd>
            <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">E</kbd>
            <span className="text-gray-500 ml-1">縮小/拡大</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">R</kbd>
            <span className="text-gray-500 ml-1">リセット</span>
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #374151 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Canvas container */}
      <div
        id="skill-map-canvas"
        className="relative"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          minWidth: '100%',
          minHeight: '100%',
          backgroundColor: '#0f0f23',
        }}
        onClick={handleCanvasClick}
      >
        {/* Map Title */}
        <div className="absolute top-8 left-8 z-20 pointer-events-none">
          <h1 className="text-5xl font-bold text-white/80 tracking-wider">
            Engineer Skill Map
          </h1>
        </div>

        {/* SVG for connection lines only */}
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          width={canvasSize.width}
          height={canvasSize.height}
        >
          {connections.map(({ from, to }) => {
            if (!visibleSkillIds.has(from) || !visibleSkillIds.has(to)) return null;
            const fromSkill = getScaledSkillById(from);
            const toSkill = getScaledSkillById(to);
            if (!fromSkill || !toSkill) return null;
            return (
              <SkillConnection
                key={`${from}-${to}`}
                fromSkill={fromSkill}
                toSkill={toSkill}
              />
            );
          })}
        </svg>

        {/* HTML nodes */}
        {visibleSkills.map((skill) => (
          <SkillNode key={skill.id} skill={skill} />
        ))}

      </div>
    </div>
  );
}
