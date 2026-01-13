'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { SkillNode } from './SkillNode';
import { SkillConnection } from './SkillConnection';
import { getAllSkills, getSkillById, MAP_CENTER } from '@/data/skills';
import { useSkillTreeStore } from '@/store/skillTreeStore';
import { Skill } from '@/types/skill';

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
const SCALE_STEP = 0.1;

export function SkillTreeCanvas() {
  const baseSkills = useMemo(() => getAllSkills(), []);
  const { selectSkill } = useSkillTreeStore();
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const canvasSize = useMemo(() => {
    if (skills.length === 0) return { width: 1400, height: 1400 };

    const padding = 200;
    const xs = skills.map((s) => s.position.x);
    const ys = skills.map((s) => s.position.y);
    const maxX = Math.max(...xs) + padding;
    const maxY = Math.max(...ys) + padding + 80;

    return {
      width: Math.max(1400, maxX, MAP_CENTER.x * 2 + padding),
      height: Math.max(1400, maxY, MAP_CENTER.y * 2 + padding),
    };
  }, [skills]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto bg-[var(--background)]"
    >
      {/* Scale controls */}
      <div className="fixed bottom-20 left-6 z-20 flex flex-col items-center gap-2 bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm">
        <button
          onClick={handleScaleUp}
          className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="広げる"
        >
          +
        </button>

        {/* スライダー（縦向き） */}
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.05}
          value={scale}
          onChange={handleSliderChange}
          className="w-24 h-2 appearance-none bg-gray-600 rounded-lg cursor-pointer rotate-[-90deg] my-8"
          style={{
            accentColor: '#3b82f6',
          }}
          title={`${Math.round(scale * 100)}%`}
        />

        <button
          onClick={handleScaleReset}
          className="w-10 h-6 flex items-center justify-center text-xs text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="リセット"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleScaleDown}
          className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="縮める"
        >
          -
        </button>
      </div>

      {/* 操作方法 */}
      <div className="fixed top-28 left-4 z-20 bg-gray-800/80 rounded-lg p-3 backdrop-blur-sm text-gray-400 text-xs">
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-1">
            <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">Q</kbd>
            <kbd className="w-5 h-5 flex items-center justify-center bg-gray-700 text-gray-200 rounded text-[10px]">E</kbd>
            <span className="text-gray-500 ml-1">縮小/拡大</span>
          </div>
          <div className="flex items-center gap-1">
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
        className="relative"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          minWidth: '100%',
          minHeight: '100%',
        }}
        onClick={handleCanvasClick}
      >
        {/* SVG for connection lines only */}
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          width={canvasSize.width}
          height={canvasSize.height}
        >
          {connections.map(({ from, to }) => {
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
        {skills.map((skill) => (
          <SkillNode key={skill.id} skill={skill} />
        ))}

      </div>
    </div>
  );
}
