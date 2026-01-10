import { Skill, SkillCategory } from '@/types/skill';

// ===========================================
// 配置計算ロジック
// ===========================================

const CENTER_X = 450;
const CENTER_Y = 380;

const TIER_RADIUS: Record<number, number> = {
  1: 50,
  2: 150,
  3: 250,
  4: 350,
  5: 450,
};

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function getPositionFromAngle(tier: number, angleDeg: number): { x: number; y: number } {
  const radius = TIER_RADIUS[tier];
  const angle = toRad(angleDeg - 90);
  return {
    x: Math.round(CENTER_X + radius * Math.cos(angle)),
    y: Math.round(CENTER_Y + radius * Math.sin(angle)),
  };
}

// スキルの生データ（位置なし）
interface SkillData {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  category: SkillCategory;
  description: string;
  icon: string;
  pointValue: number;
  connections: string[]; // 子ノードへの接続
}

// 親ノードを探す（このスキルを子として持つノード）
function findParents(skillId: string, allSkills: SkillData[]): SkillData[] {
  return allSkills.filter((s) => s.connections.includes(skillId));
}

// Tier毎の最小角度間隔（ノードが重ならない間隔）
function getMinAngleGap(tier: number): number {
  const radius = TIER_RADIUS[tier];
  const nodeSize = 80;
  const minGap = (nodeSize / (2 * Math.PI * radius)) * 360;
  return Math.max(minGap, 15);
}

// 角度差を計算（-180〜180の範囲）
function angleDifference(a: number, b: number): number {
  let diff = normalizeAngle(a) - normalizeAngle(b);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// 親の角度を中心に、最も近い空き位置を探す
function findNearestFreeAngle(
  targetAngle: number,
  placedAngles: number[],
  minGap: number
): number {
  // 重なりがなければそのまま返す
  const hasOverlap = placedAngles.some((placed) => {
    const diff = Math.abs(angleDifference(targetAngle, placed));
    return diff < minGap;
  });

  if (!hasOverlap) return targetAngle;

  // 両方向に探索して最も近い空き位置を見つける
  for (let offset = minGap; offset <= 180; offset += 5) {
    // +方向
    const plusAngle = normalizeAngle(targetAngle + offset);
    const plusOverlap = placedAngles.some((placed) => {
      const diff = Math.abs(angleDifference(plusAngle, placed));
      return diff < minGap;
    });
    if (!plusOverlap) return plusAngle;

    // -方向
    const minusAngle = normalizeAngle(targetAngle - offset);
    const minusOverlap = placedAngles.some((placed) => {
      const diff = Math.abs(angleDifference(minusAngle, placed));
      return diff < minGap;
    });
    if (!minusOverlap) return minusAngle;
  }

  return targetAngle;
}

// スキルの角度を計算（親の角度から導出）
function calculateAngles(
  skills: SkillData[],
  positionedAngles: Map<string, number>
): Map<string, number> {
  const angles = new Map(positionedAngles);

  // Tier順に処理（1 → 5）
  for (let tier = 1; tier <= 5; tier++) {
    const tierSkills = skills.filter((s) => s.tier === tier);
    const minGap = getMinAngleGap(tier);

    if (tier === 1) {
      // Tier 1: ルートノードを等間隔で配置
      const angleStep = 360 / tierSkills.length;
      tierSkills.forEach((skill, index) => {
        angles.set(skill.id, index * angleStep);
      });
    } else {
      // 親ごとに子をグループ化
      const childrenByParent = new Map<string, SkillData[]>();
      const orphans: SkillData[] = [];

      tierSkills.forEach((skill) => {
        const parents = findParents(skill.id, skills);
        if (parents.length > 0) {
          // 主要な親（最初に見つかった親）でグループ化
          const primaryParent = parents[0];
          const existing = childrenByParent.get(primaryParent.id) || [];
          existing.push(skill);
          childrenByParent.set(primaryParent.id, existing);
        } else {
          orphans.push(skill);
        }
      });

      // このTierで配置済みの角度
      const placedAngles: number[] = [];

      // 各親の子ノードを配置
      childrenByParent.forEach((children, parentId) => {
        const parentAngle = angles.get(parentId);
        if (parentAngle === undefined) return;

        const count = children.length;
        // 子ノード間の間隔（最小間隔を保証）
        const spreadAngle = Math.max(minGap, 25);
        // 親の角度を中心に扇状に配置
        const totalSpread = (count - 1) * spreadAngle;
        const startAngle = parentAngle - totalSpread / 2;

        children.forEach((child, index) => {
          const idealAngle = normalizeAngle(startAngle + index * spreadAngle);
          // 既存ノードとの重なりを避けつつ、親に近い位置を探す
          const finalAngle = findNearestFreeAngle(idealAngle, placedAngles, minGap);
          angles.set(child.id, finalAngle);
          placedAngles.push(finalAngle);
        });
      });

      // 親がないスキルは空いている場所に配置
      orphans.forEach((skill) => {
        const freeAngle = findFreeAngle(placedAngles, 45);
        angles.set(skill.id, freeAngle);
        placedAngles.push(freeAngle);
      });
    }
  }

  return angles;
}

// 角度を0-360に正規化
function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 360;
  while (angle >= 360) angle -= 360;
  return angle;
}

// 角度の平均を計算（循環を考慮）
function calculateAverageAngle(angles: number[]): number {
  if (angles.length === 1) return angles[0];

  // ベクトルの平均を使用
  let sumX = 0;
  let sumY = 0;
  angles.forEach((angle) => {
    const rad = toRad(angle);
    sumX += Math.cos(rad);
    sumY += Math.sin(rad);
  });

  return normalizeAngle(toDeg(Math.atan2(sumY, sumX)));
}

// 同じ親角度を持つスキルをグループ化
function groupByParentAngle(
  items: { skill: SkillData; parentAngle: number }[]
): { parentAngle: number; skills: SkillData[] }[] {
  const groups: { parentAngle: number; skills: SkillData[] }[] = [];
  const threshold = 20; // 20度以内は同じグループ

  items.forEach((item) => {
    const existingGroup = groups.find(
      (g) => Math.abs(normalizeAngle(g.parentAngle - item.parentAngle)) < threshold ||
             Math.abs(normalizeAngle(g.parentAngle - item.parentAngle)) > 360 - threshold
    );

    if (existingGroup) {
      existingGroup.skills.push(item.skill);
    } else {
      groups.push({ parentAngle: item.parentAngle, skills: [item.skill] });
    }
  });

  return groups;
}

// 空いている角度を探す
function findFreeAngle(usedAngles: number[], preferredStep: number): number {
  for (let angle = 0; angle < 360; angle += preferredStep) {
    const isFree = usedAngles.every(
      (used) => Math.abs(normalizeAngle(used - angle)) > 15
    );
    if (isFree) return angle;
  }
  return Math.random() * 360;
}

// スキルデータに位置を付与
function generateSkillsWithPositions(skillsData: SkillData[]): Skill[] {
  const angles = calculateAngles(skillsData, new Map());

  return skillsData.map((data) => ({
    ...data,
    position: getPositionFromAngle(data.tier, angles.get(data.id) || 0),
  }));
}

// ===========================================
// スキルデータ定義（位置は自動計算）
// ===========================================

const frontendSkillsData: SkillData[] = [
  // Tier 1: ルートノード（3つを等間隔配置 → 0°, 120°, 240°）
  { id: 'html', name: 'HTML', tier: 1, category: 'frontend', description: 'Webページの構造を定義', icon: 'html', pointValue: 10, connections: ['accessibility'] },
  { id: 'css', name: 'CSS', tier: 1, category: 'frontend', description: 'スタイリング', icon: 'css', pointValue: 10, connections: ['flexbox', 'grid', 'sass'] },
  { id: 'javascript', name: 'JavaScript', tier: 1, category: 'frontend', description: 'プログラミング言語', icon: 'javascript', pointValue: 10, connections: ['typescript', 'es6'] },

  // Tier 2: 親の角度から自動計算
  { id: 'accessibility', name: 'アクセシビリティ', tier: 2, category: 'frontend', description: 'WCAG準拠', icon: 'accessibility', pointValue: 15, connections: [] },
  { id: 'flexbox', name: 'Flexbox', tier: 2, category: 'frontend', description: '1次元レイアウト', icon: 'flexbox', pointValue: 10, connections: ['tailwind'] },
  { id: 'grid', name: 'CSS Grid', tier: 2, category: 'frontend', description: '2次元レイアウト', icon: 'grid', pointValue: 10, connections: ['tailwind'] },
  { id: 'sass', name: 'Sass/SCSS', tier: 2, category: 'frontend', description: 'CSSプリプロセッサ', icon: 'sass', pointValue: 10, connections: [] },
  { id: 'typescript', name: 'TypeScript', tier: 2, category: 'frontend', description: '静的型付け', icon: 'typescript', pointValue: 15, connections: ['react', 'vue', 'angular'] },
  { id: 'es6', name: 'ES6+', tier: 2, category: 'frontend', description: 'モダンJS', icon: 'es6', pointValue: 10, connections: ['react', 'vue'] },

  // Tier 3
  { id: 'tailwind', name: 'Tailwind CSS', tier: 3, category: 'frontend', description: 'ユーティリティCSS', icon: 'tailwind', pointValue: 15, connections: [] },
  { id: 'react', name: 'React', tier: 3, category: 'frontend', description: 'UIライブラリ', icon: 'react', pointValue: 20, connections: ['nextjs', 'redux', 'testing-frontend'] },
  { id: 'vue', name: 'Vue.js', tier: 3, category: 'frontend', description: 'フレームワーク', icon: 'vue', pointValue: 20, connections: ['nuxt'] },
  { id: 'angular', name: 'Angular', tier: 3, category: 'frontend', description: 'フルスタックFW', icon: 'angular', pointValue: 20, connections: [] },

  // Tier 4
  { id: 'nextjs', name: 'Next.js', tier: 4, category: 'frontend', description: 'React SSR/SSG', icon: 'nextjs', pointValue: 25, connections: ['performance'] },
  { id: 'redux', name: '状態管理', tier: 4, category: 'frontend', description: 'Redux, Zustand', icon: 'redux', pointValue: 15, connections: [] },
  { id: 'nuxt', name: 'Nuxt.js', tier: 4, category: 'frontend', description: 'Vue SSR/SSG', icon: 'nuxt', pointValue: 25, connections: [] },
  { id: 'testing-frontend', name: 'テスト', tier: 4, category: 'frontend', description: 'Jest, Cypress', icon: 'testing', pointValue: 20, connections: [] },

  // Tier 5
  { id: 'performance', name: 'パフォーマンス', tier: 5, category: 'frontend', description: 'Core Web Vitals', icon: 'performance', pointValue: 25, connections: [] },
];

const backendSkillsData: SkillData[] = [
  // Tier 1
  { id: 'nodejs', name: 'Node.js', tier: 1, category: 'backend', description: 'サーバーサイドJS', icon: 'nodejs', pointValue: 15, connections: ['express', 'nestjs'] },
  { id: 'python', name: 'Python', tier: 1, category: 'backend', description: '汎用言語', icon: 'python', pointValue: 15, connections: ['django', 'fastapi'] },
  { id: 'go', name: 'Go', tier: 1, category: 'backend', description: '高速並行処理', icon: 'go', pointValue: 15, connections: ['gin'] },

  // Tier 2
  { id: 'express', name: 'Express.js', tier: 2, category: 'backend', description: 'Node.js FW', icon: 'express', pointValue: 15, connections: ['rest-api'] },
  { id: 'nestjs', name: 'NestJS', tier: 2, category: 'backend', description: 'Enterprise Node', icon: 'nestjs', pointValue: 20, connections: ['rest-api', 'graphql'] },
  { id: 'django', name: 'Django', tier: 2, category: 'backend', description: 'Python FW', icon: 'django', pointValue: 20, connections: ['rest-api'] },
  { id: 'fastapi', name: 'FastAPI', tier: 2, category: 'backend', description: '高速API', icon: 'fastapi', pointValue: 20, connections: ['rest-api', 'graphql'] },
  { id: 'gin', name: 'Gin', tier: 2, category: 'backend', description: 'Go FW', icon: 'gin', pointValue: 15, connections: ['rest-api'] },
  { id: 'sql', name: 'SQL', tier: 2, category: 'backend', description: 'DB言語', icon: 'sql', pointValue: 15, connections: ['postgresql', 'mysql'] },

  // Tier 3
  { id: 'rest-api', name: 'REST API', tier: 3, category: 'backend', description: 'RESTful設計', icon: 'api', pointValue: 15, connections: ['authentication'] },
  { id: 'graphql', name: 'GraphQL', tier: 3, category: 'backend', description: 'クエリAPI', icon: 'graphql', pointValue: 20, connections: ['authentication'] },
  { id: 'postgresql', name: 'PostgreSQL', tier: 3, category: 'backend', description: '高機能RDB', icon: 'postgresql', pointValue: 15, connections: ['orm'] },
  { id: 'mysql', name: 'MySQL', tier: 3, category: 'backend', description: '人気RDB', icon: 'mysql', pointValue: 15, connections: ['orm'] },

  // Tier 4
  { id: 'authentication', name: '認証・認可', tier: 4, category: 'backend', description: 'JWT, OAuth', icon: 'auth', pointValue: 20, connections: ['security'] },
  { id: 'orm', name: 'ORM', tier: 4, category: 'backend', description: 'Prisma, TypeORM', icon: 'orm', pointValue: 15, connections: [] },
  { id: 'mongodb', name: 'MongoDB', tier: 4, category: 'backend', description: 'NoSQL', icon: 'mongodb', pointValue: 15, connections: [] },
  { id: 'redis', name: 'Redis', tier: 4, category: 'backend', description: 'KVS', icon: 'redis', pointValue: 15, connections: [] },

  // Tier 5
  { id: 'security', name: 'セキュリティ', tier: 5, category: 'backend', description: 'OWASP対策', icon: 'security', pointValue: 25, connections: [] },
  { id: 'testing-backend', name: 'テスト', tier: 5, category: 'backend', description: 'ユニット/統合', icon: 'testing', pointValue: 20, connections: [] },
];

const infrastructureSkillsData: SkillData[] = [
  // Tier 1
  { id: 'linux', name: 'Linux', tier: 1, category: 'infrastructure', description: 'OS基礎', icon: 'linux', pointValue: 15, connections: ['shell', 'networking'] },
  { id: 'git', name: 'Git', tier: 1, category: 'infrastructure', description: 'バージョン管理', icon: 'git', pointValue: 15, connections: ['github'] },

  // Tier 2
  { id: 'shell', name: 'シェル', tier: 2, category: 'infrastructure', description: 'Bash/Zsh', icon: 'shell', pointValue: 10, connections: ['docker'] },
  { id: 'networking', name: 'ネットワーク', tier: 2, category: 'infrastructure', description: 'TCP/IP', icon: 'networking', pointValue: 15, connections: ['nginx'] },
  { id: 'github', name: 'GitHub', tier: 2, category: 'infrastructure', description: 'Git hosting', icon: 'github', pointValue: 10, connections: ['cicd'] },

  // Tier 3
  { id: 'docker', name: 'Docker', tier: 3, category: 'infrastructure', description: 'コンテナ', icon: 'docker', pointValue: 20, connections: ['kubernetes'] },
  { id: 'nginx', name: 'Nginx', tier: 3, category: 'infrastructure', description: 'Webサーバー', icon: 'nginx', pointValue: 15, connections: ['aws'] },
  { id: 'cicd', name: 'CI/CD', tier: 3, category: 'infrastructure', description: 'Actions', icon: 'cicd', pointValue: 20, connections: ['aws', 'gcp'] },

  // Tier 4
  { id: 'kubernetes', name: 'Kubernetes', tier: 4, category: 'infrastructure', description: 'オーケストレーション', icon: 'kubernetes', pointValue: 30, connections: ['helm'] },
  { id: 'aws', name: 'AWS', tier: 4, category: 'infrastructure', description: 'Amazon Cloud', icon: 'aws', pointValue: 25, connections: ['terraform', 'monitoring'] },
  { id: 'gcp', name: 'GCP', tier: 4, category: 'infrastructure', description: 'Google Cloud', icon: 'gcp', pointValue: 25, connections: ['terraform'] },

  // Tier 5
  { id: 'helm', name: 'Helm', tier: 5, category: 'infrastructure', description: 'K8sパッケージ', icon: 'helm', pointValue: 15, connections: [] },
  { id: 'terraform', name: 'Terraform', tier: 5, category: 'infrastructure', description: 'IaC', icon: 'terraform', pointValue: 25, connections: [] },
  { id: 'monitoring', name: '監視', tier: 5, category: 'infrastructure', description: 'Prometheus', icon: 'monitoring', pointValue: 20, connections: [] },
];

// 各カテゴリごとに位置を計算
export const SKILLS: Skill[] = [
  ...generateSkillsWithPositions(frontendSkillsData),
  ...generateSkillsWithPositions(backendSkillsData),
  ...generateSkillsWithPositions(infrastructureSkillsData),
];

export const CATEGORY_NAMES: Record<string, string> = {
  frontend: 'フロントエンド',
  backend: 'バックエンド',
  infrastructure: 'インフラ',
};

export const getSkillsByCategory = (category: string) =>
  SKILLS.filter((skill) => skill.category === category);

export const getSkillById = (id: string) =>
  SKILLS.find((skill) => skill.id === id);
