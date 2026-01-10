'use client';

import { useMemo } from 'react';
import { SkillNode } from './SkillNode';
import { SkillConnection } from './SkillConnection';
import { useSkillTreeStore } from '@/store/skillTreeStore';
import { getSkillsByCategory, getSkillById } from '@/data/skills';

export function SkillTreeCanvas() {
  const { activeCategory } = useSkillTreeStore();

  const skills = useMemo(
    () => getSkillsByCategory(activeCategory),
    [activeCategory]
  );

  // Generate connection pairs
  const connections = useMemo(() => {
    const pairs: { from: string; to: string }[] = [];
    skills.forEach((skill) => {
      skill.connections.forEach((targetId) => {
        const targetSkill = getSkillById(targetId);
        if (targetSkill && targetSkill.category === activeCategory) {
          pairs.push({ from: skill.id, to: targetId });
        }
      });
    });
    return pairs;
  }, [skills, activeCategory]);

  // Calculate canvas size based on skill positions
  const canvasSize = useMemo(() => {
    if (skills.length === 0) return { width: 900, height: 600 };

    const padding = 100;
    const xs = skills.map((s) => s.position.x);
    const ys = skills.map((s) => s.position.y);
    const maxX = Math.max(...xs) + padding;
    const maxY = Math.max(...ys) + padding + 60;

    return { width: Math.max(900, maxX), height: Math.max(600, maxY) };
  }, [skills]);

  return (
    <div className="relative w-full h-full overflow-auto bg-[var(--background)]">
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
      >
        {/* SVG for connection lines only */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
        >
          {connections.map(({ from, to }) => {
            const fromSkill = getSkillById(from);
            const toSkill = getSkillById(to);
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
