import { Skill, SkillCategory } from '@/types/skill';

// ===========================================
// 配置計算ロジック（統合マップ用）
// ===========================================

const CENTER_X = 700;
const CENTER_Y = 700;

// Tier毎の半径（ノードが重ならないよう十分に広く）
const TIER_RADIUS: Record<number, number> = {
  1: 150,
  2: 300,
  3: 470,
  4: 640,
  5: 810,
};

// カテゴリごとの角度範囲（120度ずつ）
const CATEGORY_ANGLE_RANGE: Record<SkillCategory, { start: number; end: number }> = {
  frontend: { start: 210, end: 330 },      // 下部
  backend: { start: 330, end: 450 },       // 右上部（450 = 90）
  infrastructure: { start: 90, end: 210 }, // 左上部
};

// ノード間の最小距離（ピクセル）
const MIN_NODE_DISTANCE = 130;

const toRad = (deg: number) => (deg * Math.PI) / 180;

function getPositionFromAngle(tier: number, angleDeg: number): { x: number; y: number } {
  const radius = TIER_RADIUS[tier];
  const angle = toRad(angleDeg - 90);
  return {
    x: Math.round(CENTER_X + radius * Math.cos(angle)),
    y: Math.round(CENTER_Y + radius * Math.sin(angle)),
  };
}

// 2点間の距離を計算
function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
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
  connections: string[];
}

// 親ノードを探す
function findParents(skillId: string, allSkills: SkillData[]): SkillData[] {
  return allSkills.filter((s) => s.connections.includes(skillId));
}

// 角度を0-360に正規化
function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 360;
  while (angle >= 360) angle -= 360;
  return angle;
}

// 角度差を計算
function angleDifference(a: number, b: number): number {
  let diff = normalizeAngle(a) - normalizeAngle(b);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// 配置済みノードとの重なりをチェック（座標距離ベース）
function hasOverlapWithPlaced(
  pos: { x: number; y: number },
  placedPositions: { x: number; y: number }[]
): boolean {
  return placedPositions.some((placed) => getDistance(pos, placed) < MIN_NODE_DISTANCE);
}

// 空いている角度を探す（座標距離ベース）
function findFreeAngle(
  tier: number,
  targetAngle: number,
  placedPositions: { x: number; y: number }[],
  categoryRange: { start: number; end: number }
): number {
  const targetPos = getPositionFromAngle(tier, targetAngle);

  if (!hasOverlapWithPlaced(targetPos, placedPositions)) {
    return targetAngle;
  }

  // カテゴリ範囲内で空き位置を探す
  const rangeSize = categoryRange.end - categoryRange.start;

  for (let offset = 5; offset <= rangeSize / 2; offset += 3) {
    // +方向
    const plusAngle = normalizeAngle(targetAngle + offset);
    const plusPos = getPositionFromAngle(tier, plusAngle);
    if (!hasOverlapWithPlaced(plusPos, placedPositions)) {
      return plusAngle;
    }

    // -方向
    const minusAngle = normalizeAngle(targetAngle - offset);
    const minusPos = getPositionFromAngle(tier, minusAngle);
    if (!hasOverlapWithPlaced(minusPos, placedPositions)) {
      return minusAngle;
    }
  }

  // 範囲外も探索
  for (let offset = rangeSize / 2; offset <= 180; offset += 3) {
    const plusAngle = normalizeAngle(targetAngle + offset);
    const plusPos = getPositionFromAngle(tier, plusAngle);
    if (!hasOverlapWithPlaced(plusPos, placedPositions)) {
      return plusAngle;
    }

    const minusAngle = normalizeAngle(targetAngle - offset);
    const minusPos = getPositionFromAngle(tier, minusAngle);
    if (!hasOverlapWithPlaced(minusPos, placedPositions)) {
      return minusAngle;
    }
  }

  return targetAngle;
}

// すべてのスキルに位置を付与
function generateAllSkillsWithPositions(allSkillsData: SkillData[]): Skill[] {
  const angles = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();

  // 全ての配置済み位置を管理（Tier間の重なりも防ぐ）
  const allPlacedPositions: { x: number; y: number }[] = [];

  // Tier 1から順に配置
  for (let tier = 1; tier <= 5; tier++) {
    const tierSkills = allSkillsData.filter((s) => s.tier === tier);

    // カテゴリごとにグループ化
    const skillsByCategory = new Map<SkillCategory, SkillData[]>();
    (['frontend', 'backend', 'infrastructure'] as SkillCategory[]).forEach((cat) => {
      skillsByCategory.set(cat, tierSkills.filter((s) => s.category === cat));
    });

    // 各カテゴリのスキルを配置
    skillsByCategory.forEach((skills, category) => {
      const range = CATEGORY_ANGLE_RANGE[category];

      if (tier === 1) {
        // Tier 1: カテゴリ範囲内に等間隔で配置
        const rangeSize = range.end - range.start;
        const step = rangeSize / (skills.length + 1);

        skills.forEach((skill, index) => {
          const targetAngle = normalizeAngle(range.start + step * (index + 1));
          const finalAngle = findFreeAngle(tier, targetAngle, allPlacedPositions, range);
          const pos = getPositionFromAngle(tier, finalAngle);

          angles.set(skill.id, finalAngle);
          positions.set(skill.id, pos);
          allPlacedPositions.push(pos);
        });
      } else {
        // Tier 2以降: 親の角度を基準に配置
        skills.forEach((skill) => {
          const parents = findParents(skill.id, allSkillsData);
          let targetAngle: number;

          if (parents.length > 0) {
            // 親の角度の平均を計算
            const parentAngles = parents
              .map((p) => angles.get(p.id))
              .filter((a): a is number => a !== undefined);

            if (parentAngles.length > 0) {
              // ベクトル平均で角度を計算（循環を考慮）
              let sumX = 0, sumY = 0;
              parentAngles.forEach((a) => {
                sumX += Math.cos(toRad(a));
                sumY += Math.sin(toRad(a));
              });
              targetAngle = normalizeAngle((Math.atan2(sumY, sumX) * 180 / Math.PI));
            } else {
              targetAngle = (range.start + range.end) / 2;
            }
          } else {
            targetAngle = (range.start + range.end) / 2;
          }

          const finalAngle = findFreeAngle(tier, targetAngle, allPlacedPositions, range);
          const pos = getPositionFromAngle(tier, finalAngle);

          angles.set(skill.id, finalAngle);
          positions.set(skill.id, pos);
          allPlacedPositions.push(pos);
        });
      }
    });
  }

  return allSkillsData.map((data) => ({
    ...data,
    position: positions.get(data.id) || { x: CENTER_X, y: CENTER_Y },
  }));
}

// ===========================================
// 統合スキルデータ定義
// ===========================================

const allSkillsData: SkillData[] = [
  // ===========================================
  // Frontend スキル
  // ===========================================
  { id: 'html', name: 'HTML', tier: 1, category: 'frontend', description: 'Webページの構造を定義', icon: 'html', pointValue: 10, connections: ['accessibility'] },
  { id: 'css', name: 'CSS', tier: 1, category: 'frontend', description: 'スタイリング', icon: 'css', pointValue: 10, connections: ['flexbox', 'grid', 'sass'] },
  { id: 'javascript', name: 'JavaScript', tier: 1, category: 'frontend', description: 'プログラミング言語', icon: 'javascript', pointValue: 10, connections: ['typescript', 'es6'] },

  { id: 'accessibility', name: 'アクセシビリティ', tier: 2, category: 'frontend', description: 'WCAG準拠', icon: 'accessibility', pointValue: 15, connections: [] },
  { id: 'flexbox', name: 'Flexbox', tier: 2, category: 'frontend', description: '1次元レイアウト', icon: 'flexbox', pointValue: 10, connections: ['tailwind'] },
  { id: 'grid', name: 'CSS Grid', tier: 2, category: 'frontend', description: '2次元レイアウト', icon: 'grid', pointValue: 10, connections: ['tailwind'] },
  { id: 'sass', name: 'Sass/SCSS', tier: 2, category: 'frontend', description: 'CSSプリプロセッサ', icon: 'sass', pointValue: 10, connections: [] },
  { id: 'typescript', name: 'TypeScript', tier: 2, category: 'frontend', description: '静的型付け', icon: 'typescript', pointValue: 15, connections: ['react', 'vue', 'angular', 'nodejs'] },
  { id: 'es6', name: 'ES6+', tier: 2, category: 'frontend', description: 'モダンJS', icon: 'es6', pointValue: 10, connections: ['react', 'vue'] },

  { id: 'tailwind', name: 'Tailwind CSS', tier: 3, category: 'frontend', description: 'ユーティリティCSS', icon: 'tailwind', pointValue: 15, connections: [] },
  { id: 'react', name: 'React', tier: 3, category: 'frontend', description: 'UIライブラリ', icon: 'react', pointValue: 20, connections: ['nextjs', 'redux', 'testing-frontend'] },
  { id: 'vue', name: 'Vue.js', tier: 3, category: 'frontend', description: 'フレームワーク', icon: 'vue', pointValue: 20, connections: ['nuxt'] },
  { id: 'angular', name: 'Angular', tier: 3, category: 'frontend', description: 'フルスタックFW', icon: 'angular', pointValue: 20, connections: [] },

  { id: 'nextjs', name: 'Next.js', tier: 4, category: 'frontend', description: 'React SSR/SSG', icon: 'nextjs', pointValue: 25, connections: ['performance', 'rest-api'] },
  { id: 'redux', name: '状態管理', tier: 4, category: 'frontend', description: 'Redux, Zustand', icon: 'redux', pointValue: 15, connections: [] },
  { id: 'nuxt', name: 'Nuxt.js', tier: 4, category: 'frontend', description: 'Vue SSR/SSG', icon: 'nuxt', pointValue: 25, connections: [] },
  { id: 'testing-frontend', name: 'テスト(FE)', tier: 4, category: 'frontend', description: 'Jest, Cypress', icon: 'testing', pointValue: 20, connections: [] },

  { id: 'performance', name: 'パフォーマンス', tier: 5, category: 'frontend', description: 'Core Web Vitals', icon: 'performance', pointValue: 25, connections: [] },

  // ===========================================
  // Backend スキル
  // ===========================================
  { id: 'nodejs', name: 'Node.js', tier: 1, category: 'backend', description: 'サーバーサイドJS', icon: 'nodejs', pointValue: 15, connections: ['express', 'nestjs'] },
  { id: 'python', name: 'Python', tier: 1, category: 'backend', description: '汎用言語', icon: 'python', pointValue: 15, connections: ['django', 'fastapi'] },
  { id: 'go', name: 'Go', tier: 1, category: 'backend', description: '高速並行処理', icon: 'go', pointValue: 15, connections: ['gin'] },

  { id: 'express', name: 'Express.js', tier: 2, category: 'backend', description: 'Node.js FW', icon: 'express', pointValue: 15, connections: ['rest-api'] },
  { id: 'nestjs', name: 'NestJS', tier: 2, category: 'backend', description: 'Enterprise Node', icon: 'nestjs', pointValue: 20, connections: ['rest-api', 'graphql'] },
  { id: 'django', name: 'Django', tier: 2, category: 'backend', description: 'Python FW', icon: 'django', pointValue: 20, connections: ['rest-api'] },
  { id: 'fastapi', name: 'FastAPI', tier: 2, category: 'backend', description: '高速API', icon: 'fastapi', pointValue: 20, connections: ['rest-api', 'graphql'] },
  { id: 'gin', name: 'Gin', tier: 2, category: 'backend', description: 'Go FW', icon: 'gin', pointValue: 15, connections: ['rest-api'] },
  { id: 'sql', name: 'SQL', tier: 2, category: 'backend', description: 'DB言語', icon: 'sql', pointValue: 15, connections: ['postgresql', 'mysql'] },

  { id: 'rest-api', name: 'REST API', tier: 3, category: 'backend', description: 'RESTful設計', icon: 'api', pointValue: 15, connections: ['authentication'] },
  { id: 'graphql', name: 'GraphQL', tier: 3, category: 'backend', description: 'クエリAPI', icon: 'graphql', pointValue: 20, connections: ['authentication'] },
  { id: 'postgresql', name: 'PostgreSQL', tier: 3, category: 'backend', description: '高機能RDB', icon: 'postgresql', pointValue: 15, connections: ['orm'] },
  { id: 'mysql', name: 'MySQL', tier: 3, category: 'backend', description: '人気RDB', icon: 'mysql', pointValue: 15, connections: ['orm'] },

  { id: 'authentication', name: '認証・認可', tier: 4, category: 'backend', description: 'JWT, OAuth', icon: 'auth', pointValue: 20, connections: ['security'] },
  { id: 'orm', name: 'ORM', tier: 4, category: 'backend', description: 'Prisma, TypeORM', icon: 'orm', pointValue: 15, connections: [] },
  { id: 'mongodb', name: 'MongoDB', tier: 4, category: 'backend', description: 'NoSQL', icon: 'mongodb', pointValue: 15, connections: [] },
  { id: 'redis', name: 'Redis', tier: 4, category: 'backend', description: 'KVS', icon: 'redis', pointValue: 15, connections: [] },

  { id: 'security', name: 'セキュリティ', tier: 5, category: 'backend', description: 'OWASP対策', icon: 'security', pointValue: 25, connections: [] },
  { id: 'testing-backend', name: 'テスト(BE)', tier: 5, category: 'backend', description: 'ユニット/統合', icon: 'testing', pointValue: 20, connections: [] },

  // ===========================================
  // Infrastructure スキル
  // ===========================================
  { id: 'linux', name: 'Linux', tier: 1, category: 'infrastructure', description: 'OS基礎', icon: 'linux', pointValue: 15, connections: ['shell', 'networking'] },
  { id: 'git', name: 'Git', tier: 1, category: 'infrastructure', description: 'バージョン管理', icon: 'git', pointValue: 15, connections: ['github'] },

  { id: 'shell', name: 'シェル', tier: 2, category: 'infrastructure', description: 'Bash/Zsh', icon: 'shell', pointValue: 10, connections: ['docker'] },
  { id: 'networking', name: 'ネットワーク', tier: 2, category: 'infrastructure', description: 'TCP/IP', icon: 'networking', pointValue: 15, connections: ['nginx'] },
  { id: 'github', name: 'GitHub', tier: 2, category: 'infrastructure', description: 'Git hosting', icon: 'github', pointValue: 10, connections: ['cicd'] },

  { id: 'docker', name: 'Docker', tier: 3, category: 'infrastructure', description: 'コンテナ', icon: 'docker', pointValue: 20, connections: ['kubernetes'] },
  { id: 'nginx', name: 'Nginx', tier: 3, category: 'infrastructure', description: 'Webサーバー', icon: 'nginx', pointValue: 15, connections: ['aws'] },
  { id: 'cicd', name: 'CI/CD', tier: 3, category: 'infrastructure', description: 'Actions', icon: 'cicd', pointValue: 20, connections: ['aws', 'gcp', 'testing-frontend', 'testing-backend'] },

  { id: 'kubernetes', name: 'Kubernetes', tier: 4, category: 'infrastructure', description: 'オーケストレーション', icon: 'kubernetes', pointValue: 30, connections: ['helm'] },
  { id: 'aws', name: 'AWS', tier: 4, category: 'infrastructure', description: 'Amazon Cloud', icon: 'aws', pointValue: 25, connections: ['terraform', 'monitoring'] },
  { id: 'gcp', name: 'GCP', tier: 4, category: 'infrastructure', description: 'Google Cloud', icon: 'gcp', pointValue: 25, connections: ['terraform'] },

  { id: 'helm', name: 'Helm', tier: 5, category: 'infrastructure', description: 'K8sパッケージ', icon: 'helm', pointValue: 15, connections: [] },
  { id: 'terraform', name: 'Terraform', tier: 5, category: 'infrastructure', description: 'IaC', icon: 'terraform', pointValue: 25, connections: [] },
  { id: 'monitoring', name: '監視', tier: 5, category: 'infrastructure', description: 'Prometheus', icon: 'monitoring', pointValue: 20, connections: [] },
];

export const SKILLS: Skill[] = generateAllSkillsWithPositions(allSkillsData);

export const CATEGORY_NAMES: Record<string, string> = {
  frontend: 'フロントエンド',
  backend: 'バックエンド',
  infrastructure: 'インフラ',
};

export const getSkillsByCategory = (category: string) =>
  SKILLS.filter((skill) => skill.category === category);

export const getAllSkills = () => SKILLS;

export const getSkillById = (id: string) =>
  SKILLS.find((skill) => skill.id === id);

// マップ中心座標をエクスポート
export const MAP_CENTER = { x: CENTER_X, y: CENTER_Y };
