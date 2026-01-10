'use client';

import { Skill } from '@/types/skill';
import { useSkillTreeStore } from '@/store/skillTreeStore';

interface SkillConnectionProps {
  fromSkill: Skill;
  toSkill: Skill;
}

export function SkillConnection({ fromSkill, toSkill }: SkillConnectionProps) {
  const { unlockedSkills, selectedSkillId } = useSkillTreeStore();

  const isFromUnlocked = unlockedSkills.includes(fromSkill.id);
  const isToUnlocked = unlockedSkills.includes(toSkill.id);
  const isBothUnlocked = isFromUnlocked && isToUnlocked;

  // 選択されたスキルへの接続（親→選択）
  const isToSelected = selectedSkillId === toSkill.id;
  // 選択されたスキルからの接続（選択→子）
  const isFromSelected = selectedSkillId === fromSkill.id;
  // この接続線が選択に関連しているか
  const isHighlighted = isToSelected || isFromSelected;

  // 円の中心のY座標オフセット
  // SkillNode.tsxでは translate(-50%, -50%) が要素全体に適用されるため
  // 円の中心は position.y より上にある
  const CIRCLE_CENTER_OFFSET_Y = -22;

  // 円の実際の中心座標
  const centerX1 = fromSkill.position.x;
  const centerY1 = fromSkill.position.y + CIRCLE_CENTER_OFFSET_Y;
  const centerX2 = toSkill.position.x;
  const centerY2 = toSkill.position.y + CIRCLE_CENTER_OFFSET_Y;

  // ノードの半径（w-16 = 64px、半径32px）
  const nodeRadius = 32;

  // 2つのノード間の方向ベクトルを計算
  const dx = centerX2 - centerX1;
  const dy = centerY2 - centerY1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 距離が短すぎる場合は描画しない
  if (dist < nodeRadius * 2) {
    return null;
  }

  // 方向ベクトルを正規化
  const dirX = dx / dist;
  const dirY = dy / dist;

  // fromSkillの円周上の点（toSkill方向）
  const x1 = centerX1 + dirX * nodeRadius;
  const y1 = centerY1 + dirY * nodeRadius;

  // toSkillの円周上の点（fromSkill方向）
  const x2 = centerX2 - dirX * nodeRadius;
  const y2 = centerY2 - dirY * nodeRadius;

  // Calculate control points for curved line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const lineDx = x2 - x1;
  const lineDy = y2 - y1;

  const curvature = 0.2;
  const controlX = midX - lineDy * curvature;
  const controlY = midY + lineDx * curvature;

  const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;

  // 線の色を決定
  let strokeColor = '#1f2937'; // デフォルト（暗いグレー）
  let glowColor = '#1f2937';
  let strokeWidth = 2;
  let opacity = 0.25; // 未習得は暗く

  if (isHighlighted) {
    // 選択されたスキルに関連する線（黄色でハイライト）
    strokeColor = '#fbbf24';
    glowColor = '#fbbf24';
    strokeWidth = 3;
    opacity = 1;
  } else if (isBothUnlocked) {
    // 両方アンロック済み（明るい緑で目立つ）
    strokeColor = '#22c55e';
    glowColor = '#22c55e';
    opacity = 1;
  } else if (isFromUnlocked || isToUnlocked) {
    // 片方だけアンロック（やや明るい）
    strokeColor = '#374151';
    opacity = 0.4;
  }

  return (
    <g>
      {/* Glow effect for highlighted or unlocked connections */}
      {(isHighlighted || isBothUnlocked) && (
        <path
          d={pathD}
          fill="none"
          stroke={glowColor}
          strokeWidth={isHighlighted ? 10 : 6}
          strokeLinecap="round"
          opacity={isHighlighted ? 0.4 : 0.3}
          className={isHighlighted ? '' : 'connection-unlocked'}
        />
      )}

      {/* Main connection line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={isBothUnlocked || isHighlighted ? 'none' : '5,5'}
        opacity={opacity}
        className={isBothUnlocked && !isHighlighted ? 'connection-unlocked' : ''}
      />

      {/* Arrow indicator at the end */}
      <circle
        cx={x2}
        cy={y2}
        r={isHighlighted ? 6 : 4}
        fill={strokeColor}
        opacity={isHighlighted ? 1 : isBothUnlocked ? 0.8 : 0.3}
      />

      {/* Arrow indicator at the start for highlighted */}
      {isHighlighted && (
        <circle
          cx={x1}
          cy={y1}
          r={5}
          fill={strokeColor}
          opacity={0.8}
        />
      )}
    </g>
  );
}
