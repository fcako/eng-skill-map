'use client';

import { CATEGORY_NAMES } from '@/data/skills';

const categoryColors: Record<string, string> = {
  frontend: 'bg-blue-500',
  backend: 'bg-purple-500',
  infrastructure: 'bg-orange-500',
};

export function CategoryLegend() {
  return (
    <div className="flex items-center gap-4">
      {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
        <div key={key} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${categoryColors[key]}`} />
          <span className="text-sm text-gray-400">{name}</span>
        </div>
      ))}
    </div>
  );
}
