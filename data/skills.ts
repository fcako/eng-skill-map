import { Skill, SkillCategory, LearningItem } from '@/types/skill';

// ===========================================
// 配置計算ロジック（統合マップ用）
// ===========================================

const CENTER_X = 1400;
const CENTER_Y = 1400;

// Tier毎の半径（カテゴリ120°内にノードが収まるよう十分に広く）
// 必要半径 ≥ 3 × maxNodesPerCategory × MIN_NODE_DISTANCE / (2π)
const TIER_RADIUS: Record<number, number> = {
  1: 180,
  2: 500,
  3: 780,
  4: 1000,
  5: 1200,
};

// カテゴリごとの角度範囲（スキル数に比例して配分）
// Backend(31), Frontend(25), Infrastructure(18), DevOps(16) = 90スキル
// 大きいカテゴリを対角に配置してバランスを取る
const CATEGORY_ANGLE_RANGE: Record<SkillCategory, { start: number; end: number }> = {
  frontend: { start: 225, end: 325 },      // 下部 (100°) - 25スキル
  infrastructure: { start: 325, end: 397 }, // 右部 (72°) - 18スキル
  devops: { start: 37, end: 101 },         // 上部 (64°) - 16スキル
  backend: { start: 101, end: 225 },       // 左部 (124°) - 31スキル
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
  learningItems: LearningItem[];
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
    (['frontend', 'backend', 'infrastructure', 'devops'] as SkillCategory[]).forEach((cat) => {
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
  {
    id: 'html', name: 'HTML', tier: 1, category: 'frontend', description: 'Webページの骨格となるマークアップ言語。セマンティックな要素を使って文書構造を定義し、アクセシビリティやSEOの基盤となる', icon: 'html', pointValue: 10, connections: ['accessibility'],
    learningItems: [
      { id: 'html-1', content: 'セマンティックHTML（header, main, article等）を理解する' },
      { id: 'html-2', content: 'フォーム要素とバリデーション属性を使いこなす' },
      { id: 'html-3', content: 'メタタグとSEO基礎を理解する' },
      { id: 'html-4', content: 'HTML5のマルチメディア要素を使用できる' },
      { id: 'html-5', content: 'WAI-ARIAの基本属性を理解する' },
      { id: 'html-6', content: 'iframeとembedの適切な使用法を理解する' },
      { id: 'html-7', content: 'Webコンポーネントの基礎を理解する' },
    ]
  },
  {
    id: 'css', name: 'CSS', tier: 1, category: 'frontend', description: 'Webページの見た目を定義するスタイルシート言語。レイアウト、色、フォント、アニメーションなど視覚的な表現を制御する', icon: 'css', pointValue: 10, connections: ['flexbox', 'grid', 'sass', 'responsive'],
    learningItems: [
      { id: 'css-1', content: 'ボックスモデルを完全に理解する' },
      { id: 'css-2', content: 'セレクタの優先度（詳細度）を理解する' },
      { id: 'css-3', content: 'positionプロパティを使いこなす' },
      { id: 'css-4', content: 'CSS変数（カスタムプロパティ）を活用できる' },
      { id: 'css-5', content: 'トランジションとアニメーションを実装できる' },
      { id: 'css-6', content: ' 擬似クラス・擬似要素を理解する' },
      { id: 'css-7', content: 'BEMやCSS設計手法を理解する' },
      { id: 'css-8', content: 'メディアクエリの基礎を理解する' },
    ]
  },
  {
    id: 'javascript', name: 'JavaScript', tier: 1, category: 'frontend', description: 'Webブラウザ上で動作するスクリプト言語。動的なUIやユーザーインタラクション、非同期処理を実現するフロントエンドの中核技術', icon: 'javascript', pointValue: 10, connections: ['typescript', 'es6', 'browser-api'],
    learningItems: [
      { id: 'js-1', content: '変数スコープとホイスティングを理解する' },
      { id: 'js-2', content: 'クロージャを理解し活用できる' },
      { id: 'js-3', content: 'プロトタイプチェーンを理解する' },
      { id: 'js-4', content: 'イベントループと非同期処理を理解する' },
      { id: 'js-5', content: 'thisキーワードの挙動を理解する' },
      { id: 'js-6', content: '配列の高階関数（map, filter, reduce）を使いこなす' },
      { id: 'js-7', content: 'エラーハンドリングを適切に実装できる' },
      { id: 'js-8', content: 'モジュールシステム（import/export）を理解する' },
    ]
  },

  {
    id: 'accessibility', name: 'アクセシビリティ', tier: 2, category: 'frontend', description: '障害を持つユーザーを含む全ての人がWebを利用できるようにする技術。WCAG基準に準拠したUI設計やスクリーンリーダー対応を行う', icon: 'accessibility', pointValue: 15, connections: [],
    learningItems: [
      { id: 'a11y-1', content: 'WCAG 2.1のガイドラインを理解する' },
      { id: 'a11y-2', content: 'スクリーンリーダーでの動作確認ができる' },
      { id: 'a11y-3', content: 'キーボードナビゲーションを実装できる' },
      { id: 'a11y-4', content: 'ARIAラベルとロールを適切に使用できる' },
      { id: 'a11y-5', content: 'カラーコントラスト比を確認・調整できる' },
      { id: 'a11y-6', content: 'フォーカス管理を実装できる' },
      { id: 'a11y-7', content: 'アクセシビリティテストツールを使用できる' },
      { id: 'a11y-8', content: 'ライブリージョンを実装できる' },
    ]
  },
  {
    id: 'flexbox', name: 'Flexbox', tier: 2, category: 'frontend', description: '1次元レイアウト', icon: 'flexbox', pointValue: 10, connections: ['tailwind'],
    learningItems: [
      { id: 'flex-1', content: 'flex-direction, justify-content, align-itemsを理解する' },
      { id: 'flex-2', content: 'flex-grow, flex-shrink, flex-basisを使いこなす' },
      { id: 'flex-3', content: 'flex-wrapでレスポンシブ対応ができる' },
      { id: 'flex-4', content: 'orderプロパティで表示順を制御できる' },
      { id: 'flex-5', content: 'align-selfで個別アイテムを調整できる' },
      { id: 'flex-6', content: 'gapプロパティを活用できる' },
      { id: 'flex-7', content: '一般的なUIパターンをFlexboxで実装できる' },
    ]
  },
  {
    id: 'grid', name: 'CSS Grid', tier: 2, category: 'frontend', description: '2次元レイアウト', icon: 'grid', pointValue: 10, connections: ['tailwind'],
    learningItems: [
      { id: 'grid-1', content: 'grid-template-columns/rowsを理解する' },
      { id: 'grid-2', content: 'grid-areaとnamed areasを使用できる' },
      { id: 'grid-3', content: 'fr単位とauto-fit/auto-fillを理解する' },
      { id: 'grid-4', content: 'minmax()関数を活用できる' },
      { id: 'grid-5', content: 'grid-auto-flowで自動配置を制御できる' },
      { id: 'grid-6', content: 'サブグリッドを理解する' },
      { id: 'grid-7', content: '複雑なレイアウトをGridで実装できる' },
    ]
  },
  {
    id: 'sass', name: 'Sass/SCSS', tier: 2, category: 'frontend', description: 'CSSプリプロセッサ', icon: 'sass', pointValue: 10, connections: [],
    learningItems: [
      { id: 'sass-1', content: '変数と演算を使用できる' },
      { id: 'sass-2', content: 'ネスティングを適切に使用できる' },
      { id: 'sass-3', content: 'ミックスインを作成・活用できる' },
      { id: 'sass-4', content: '@extendと継承を理解する' },
      { id: 'sass-5', content: 'パーシャルとモジュール分割ができる' },
      { id: 'sass-6', content: '関数を定義・使用できる' },
      { id: 'sass-7', content: '条件分岐とループを使用できる' },
    ]
  },
  {
    id: 'typescript', name: 'TypeScript', tier: 2, category: 'frontend', description: 'JavaScriptに静的型付けを追加した言語。コンパイル時の型チェックにより、バグの早期発見とIDEのサポート強化を実現する', icon: 'typescript', pointValue: 15, connections: ['react', 'vue', 'angular', 'svelte', 'bundler', 'nodejs'],
    learningItems: [
      { id: 'ts-1', content: '基本的な型アノテーションを使用できる' },
      { id: 'ts-2', content: 'インターフェースと型エイリアスを使い分けられる' },
      { id: 'ts-3', content: 'ジェネリクスを理解し活用できる' },
      { id: 'ts-4', content: 'Union型とIntersection型を使いこなす' },
      { id: 'ts-5', content: '型ガードとNarrowing を実装できる' },
      { id: 'ts-6', content: 'ユーティリティ型（Partial, Pick等）を活用できる' },
      { id: 'ts-7', content: '条件型とmapped typesを理解する' },
      { id: 'ts-8', content: 'tsconfig.jsonを適切に設定できる' },
      { id: 'ts-9', content: '型定義ファイル（.d.ts）を作成できる' },
    ]
  },
  {
    id: 'es6', name: 'ES6+', tier: 2, category: 'frontend', description: 'モダンJS', icon: 'es6', pointValue: 10, connections: ['react', 'vue', 'svelte', 'bundler'],
    learningItems: [
      { id: 'es6-1', content: 'アロー関数とthisバインディングを理解する' },
      { id: 'es6-2', content: '分割代入とスプレッド構文を使いこなす' },
      { id: 'es6-3', content: 'テンプレートリテラルを活用できる' },
      { id: 'es6-4', content: 'Promise とasync/awaitを使いこなす' },
      { id: 'es6-5', content: 'クラス構文を理解する' },
      { id: 'es6-6', content: 'Map, Set, WeakMap, WeakSetを使用できる' },
      { id: 'es6-7', content: 'Symbol とIteratorを理解する' },
      { id: 'es6-8', content: 'Optional chainingとNullish coalescingを使用できる' },
    ]
  },
  {
    id: 'browser-api', name: 'ブラウザAPI', tier: 2, category: 'frontend', description: 'DOM/Storage', icon: 'browser', pointValue: 10, connections: ['react', 'vue'],
    learningItems: [
      { id: 'browser-1', content: 'DOM操作メソッドを理解する' },
      { id: 'browser-2', content: 'イベントリスナーとイベント伝播を理解する' },
      { id: 'browser-3', content: 'localStorage/sessionStorageを使用できる' },
      { id: 'browser-4', content: 'Fetch APIでHTTPリクエストを送信できる' },
      { id: 'browser-5', content: 'History APIを使用できる' },
      { id: 'browser-6', content: 'Intersection Observerを実装できる' },
      { id: 'browser-7', content: 'Web Storage APIの制限を理解する' },
      { id: 'browser-8', content: 'Geolocation APIを使用できる' },
    ]
  },
  {
    id: 'responsive', name: 'レスポンシブ', tier: 2, category: 'frontend', description: 'モバイル対応', icon: 'responsive', pointValue: 10, connections: ['tailwind'],
    learningItems: [
      { id: 'resp-1', content: 'メディアクエリを使いこなす' },
      { id: 'resp-2', content: 'モバイルファーストの設計ができる' },
      { id: 'resp-3', content: 'ビューポートメタタグを正しく設定できる' },
      { id: 'resp-4', content: '相対単位（rem, em, vw, vh）を適切に使用できる' },
      { id: 'resp-5', content: 'レスポンシブ画像（srcset, picture）を実装できる' },
      { id: 'resp-6', content: 'コンテナクエリを理解する' },
      { id: 'resp-7', content: 'タッチイベントに対応できる' },
    ]
  },

  {
    id: 'tailwind', name: 'Tailwind CSS', tier: 3, category: 'frontend', description: 'ユーティリティCSS', icon: 'tailwind', pointValue: 15, connections: [],
    learningItems: [
      { id: 'tw-1', content: 'ユーティリティクラスの命名規則を理解する' },
      { id: 'tw-2', content: 'レスポンシブブレークポイントを使用できる' },
      { id: 'tw-3', content: 'ダークモードを実装できる' },
      { id: 'tw-4', content: 'tailwind.config.jsをカスタマイズできる' },
      { id: 'tw-5', content: '@applyディレクティブを活用できる' },
      { id: 'tw-6', content: 'プラグインを追加・設定できる' },
      { id: 'tw-7', content: 'JITモードを理解する' },
      { id: 'tw-8', content: 'コンポーネントの抽出パターンを理解する' },
    ]
  },
  {
    id: 'react', name: 'React', tier: 3, category: 'frontend', description: 'Meta社が開発したUIライブラリ。コンポーネントベースの設計とVirtual DOMにより、効率的で保守性の高いUIを構築できる', icon: 'react', pointValue: 20, connections: ['nextjs', 'redux', 'testing-frontend', 'storybook'],
    learningItems: [
      { id: 'react-1', content: 'JSXの構文とルールを理解する' },
      { id: 'react-2', content: 'useState, useEffectを使いこなす' },
      { id: 'react-3', content: 'useContext でグローバル状態を管理できる' },
      { id: 'react-4', content: 'useRef, useMemoを適切に使用できる' },
      { id: 'react-5', content: 'カスタムフックを作成できる' },
      { id: 'react-6', content: 'コンポーネントのライフサイクルを理解する' },
      { id: 'react-7', content: 'React.memo でパフォーマンス最適化ができる' },
      { id: 'react-8', content: 'Error Boundaryを実装できる' },
      { id: 'react-9', content: 'Suspense とlazy loadingを使用できる' },
      { id: 'react-10', content: 'Server Componentsを理解する' },
    ]
  },
  {
    id: 'vue', name: 'Vue.js', tier: 3, category: 'frontend', description: 'フレームワーク', icon: 'vue', pointValue: 20, connections: ['nuxt', 'storybook'],
    learningItems: [
      { id: 'vue-1', content: 'テンプレート構文とディレクティブを理解する' },
      { id: 'vue-2', content: 'Composition APIを使いこなす' },
      { id: 'vue-3', content: 'リアクティブシステムを理解する' },
      { id: 'vue-4', content: 'computedとwatchを適切に使い分けられる' },
      { id: 'vue-5', content: 'propsとemitでコンポーネント間通信ができる' },
      { id: 'vue-6', content: 'provide/injectを使用できる' },
      { id: 'vue-7', content: 'Vue Routerを設定・使用できる' },
      { id: 'vue-8', content: 'Piniaで状態管理ができる' },
      { id: 'vue-9', content: 'カスタムディレクティブを作成できる' },
    ]
  },
  {
    id: 'angular', name: 'Angular', tier: 3, category: 'frontend', description: 'フルスタックFW', icon: 'angular', pointValue: 20, connections: ['storybook'],
    learningItems: [
      { id: 'ng-1', content: 'コンポーネント・モジュール構造を理解する' },
      { id: 'ng-2', content: 'テンプレート構文とデータバインディングを使用できる' },
      { id: 'ng-3', content: '依存性注入を理解し活用できる' },
      { id: 'ng-4', content: 'サービスを作成・使用できる' },
      { id: 'ng-5', content: 'RxJSとObservableを使いこなす' },
      { id: 'ng-6', content: 'Angular Routerを設定できる' },
      { id: 'ng-7', content: 'リアクティブフォームを実装できる' },
      { id: 'ng-8', content: 'HTTPClientでAPI通信ができる' },
      { id: 'ng-9', content: 'Angular CLIを使いこなす' },
    ]
  },
  {
    id: 'svelte', name: 'Svelte', tier: 3, category: 'frontend', description: 'コンパイラFW', icon: 'svelte', pointValue: 20, connections: [],
    learningItems: [
      { id: 'svelte-1', content: 'リアクティブ宣言を理解する' },
      { id: 'svelte-2', content: '$:でリアクティブステートメントを使用できる' },
      { id: 'svelte-3', content: 'propsとイベントでコンポーネント通信ができる' },
      { id: 'svelte-4', content: 'ストアを作成・使用できる' },
      { id: 'svelte-5', content: 'ライフサイクル関数を理解する' },
      { id: 'svelte-6', content: 'トランジションとアニメーションを実装できる' },
      { id: 'svelte-7', content: 'SvelteKitの基礎を理解する' },
    ]
  },
  {
    id: 'bundler', name: 'バンドラー', tier: 3, category: 'frontend', description: 'Vite/Webpack', icon: 'bundler', pointValue: 15, connections: ['nextjs', 'nuxt'],
    learningItems: [
      { id: 'bundler-1', content: 'モジュールバンドリングの概念を理解する' },
      { id: 'bundler-2', content: 'Viteの設定ファイルをカスタマイズできる' },
      { id: 'bundler-3', content: 'Webpackの基本設定を理解する' },
      { id: 'bundler-4', content: 'ローダーとプラグインを設定できる' },
      { id: 'bundler-5', content: 'コード分割を実装できる' },
      { id: 'bundler-6', content: 'Tree shakingを理解する' },
      { id: 'bundler-7', content: '環境変数を設定・使用できる' },
      { id: 'bundler-8', content: 'バンドルサイズを分析・最適化できる' },
    ]
  },
  {
    id: 'storybook', name: 'Storybook', tier: 3, category: 'frontend', description: 'UIコンポーネント管理', icon: 'storybook', pointValue: 15, connections: ['testing-frontend'],
    learningItems: [
      { id: 'sb-1', content: 'Storybookをプロジェクトに導入できる' },
      { id: 'sb-2', content: 'ストーリーを作成できる' },
      { id: 'sb-3', content: 'Argsとコントロールを設定できる' },
      { id: 'sb-4', content: 'アドオンを追加・設定できる' },
      { id: 'sb-5', content: 'MDXでドキュメントを作成できる' },
      { id: 'sb-6', content: 'インタラクションテストを実装できる' },
      { id: 'sb-7', content: 'Chromatic等でビジュアルテストができる' },
    ]
  },

  {
    id: 'nextjs', name: 'Next.js', tier: 4, category: 'frontend', description: 'Reactベースのフルスタックフレームワーク。SSR/SSG/ISRによる最適化、ファイルベースルーティング、API Routesを提供する', icon: 'nextjs', pointValue: 25, connections: ['performance', 'rest-api', 'pwa', 'security-fe'],
    learningItems: [
      { id: 'next-1', content: 'App Routerの構造を理解する' },
      { id: 'next-2', content: 'Server ComponentsとClient Componentsを使い分けられる' },
      { id: 'next-3', content: 'データフェッチング戦略を理解する' },
      { id: 'next-4', content: 'API Routesを実装できる' },
      { id: 'next-5', content: 'ミドルウェアを実装できる' },
      { id: 'next-6', content: '画像最適化（next/image）を活用できる' },
      { id: 'next-7', content: 'ISRを理解し実装できる' },
      { id: 'next-8', content: 'メタデータAPIを使用できる' },
      { id: 'next-9', content: 'Vercelへのデプロイができる' },
    ]
  },
  {
    id: 'redux', name: '状態管理', tier: 4, category: 'frontend', description: 'Redux, Zustand', icon: 'redux', pointValue: 15, connections: [],
    learningItems: [
      { id: 'redux-1', content: 'Fluxアーキテクチャを理解する' },
      { id: 'redux-2', content: 'Redux Toolkitを使用できる' },
      { id: 'redux-3', content: 'createSliceでReducerを作成できる' },
      { id: 'redux-4', content: 'createAsyncThunkで非同期処理ができる' },
      { id: 'redux-5', content: 'RTK Queryでデータフェッチングができる' },
      { id: 'redux-6', content: 'Zustandで軽量な状態管理ができる' },
      { id: 'redux-7', content: 'Jotai/Recoilの原子型状態管理を理解する' },
      { id: 'redux-8', content: '状態の正規化を実装できる' },
    ]
  },
  {
    id: 'nuxt', name: 'Nuxt.js', tier: 4, category: 'frontend', description: 'Vue SSR/SSG', icon: 'nuxt', pointValue: 25, connections: ['pwa'],
    learningItems: [
      { id: 'nuxt-1', content: 'Nuxt 3のディレクトリ構造を理解する' },
      { id: 'nuxt-2', content: 'ファイルベースルーティングを使用できる' },
      { id: 'nuxt-3', content: 'useFetch/useAsyncDataでデータ取得ができる' },
      { id: 'nuxt-4', content: 'サーバーAPIルートを実装できる' },
      { id: 'nuxt-5', content: 'ミドルウェアを実装できる' },
      { id: 'nuxt-6', content: 'モジュールを追加・設定できる' },
      { id: 'nuxt-7', content: 'Nitroサーバーエンジンを理解する' },
      { id: 'nuxt-8', content: 'SSR/SSG/SPAモードを使い分けられる' },
    ]
  },
  {
    id: 'testing-frontend', name: 'テスト(FE)', tier: 4, category: 'frontend', description: 'Jest, Cypress', icon: 'testing', pointValue: 20, connections: [],
    learningItems: [
      { id: 'test-fe-1', content: 'Jestでユニットテストを書ける' },
      { id: 'test-fe-2', content: 'React Testing Libraryを使用できる' },
      { id: 'test-fe-3', content: 'モックとスパイを適切に使用できる' },
      { id: 'test-fe-4', content: 'Cypressでe2eテストを書ける' },
      { id: 'test-fe-5', content: 'Playwrightを使用できる' },
      { id: 'test-fe-6', content: 'スナップショットテストを実装できる' },
      { id: 'test-fe-7', content: 'テストカバレッジを測定できる' },
      { id: 'test-fe-8', content: 'TDD/BDDの手法を実践できる' },
    ]
  },
  {
    id: 'pwa', name: 'PWA', tier: 4, category: 'frontend', description: 'Progressive Web Apps', icon: 'pwa', pointValue: 20, connections: ['performance'],
    learningItems: [
      { id: 'pwa-1', content: 'Service Workerを実装できる' },
      { id: 'pwa-2', content: 'Web App Manifestを設定できる' },
      { id: 'pwa-3', content: 'オフライン対応を実装できる' },
      { id: 'pwa-4', content: 'キャッシュ戦略を設計できる' },
      { id: 'pwa-5', content: 'プッシュ通知を実装できる' },
      { id: 'pwa-6', content: 'バックグラウンド同期を実装できる' },
      { id: 'pwa-7', content: 'Workboxを使用できる' },
      { id: 'pwa-8', content: 'インストールプロンプトをカスタマイズできる' },
    ]
  },
  {
    id: 'security-fe', name: 'FEセキュリティ', tier: 4, category: 'frontend', description: 'XSS/CSP/CORS対策', icon: 'security', pointValue: 20, connections: [],
    learningItems: [
      { id: 'sec-fe-1', content: 'XSS攻撃を理解し対策できる' },
      { id: 'sec-fe-2', content: 'CSPヘッダーを設定できる' },
      { id: 'sec-fe-3', content: 'CORSの仕組みを理解する' },
      { id: 'sec-fe-4', content: 'CSRF対策を実装できる' },
      { id: 'sec-fe-5', content: '安全なCookie設定ができる' },
      { id: 'sec-fe-6', content: 'サニタイズ処理を適切に行える' },
      { id: 'sec-fe-7', content: 'セキュリティヘッダーを設定できる' },
      { id: 'sec-fe-8', content: 'サブリソース完全性（SRI）を理解する' },
    ]
  },

  {
    id: 'performance', name: 'パフォーマンス', tier: 5, category: 'frontend', description: 'Core Web Vitals', icon: 'performance', pointValue: 25, connections: [],
    learningItems: [
      { id: 'perf-1', content: 'Core Web Vitals（LCP, FID, CLS）を理解する' },
      { id: 'perf-2', content: 'Lighthouseでパフォーマンス監査ができる' },
      { id: 'perf-3', content: 'バンドルサイズを最適化できる' },
      { id: 'perf-4', content: '画像の最適化ができる' },
      { id: 'perf-5', content: 'コード分割とlazy loadingを実装できる' },
      { id: 'perf-6', content: 'Critical CSSを抽出できる' },
      { id: 'perf-7', content: 'メモリリークを検出・修正できる' },
      { id: 'perf-8', content: 'レンダリングパフォーマンスを最適化できる' },
      { id: 'perf-9', content: 'Real User Monitoring（RUM）を導入できる' },
    ]
  },

  // ===========================================
  // Backend スキル
  // ===========================================
  {
    id: 'nodejs', name: 'Node.js', tier: 1, category: 'backend', description: 'JavaScriptをサーバーサイドで実行するランタイム環境。イベント駆動・ノンブロッキングI/Oにより高いスケーラビリティを実現する', icon: 'nodejs', pointValue: 15, connections: ['express', 'nestjs'],
    learningItems: [
      { id: 'node-1', content: 'イベントループとノンブロッキングI/Oを理解する' },
      { id: 'node-2', content: 'npm/yarnでパッケージ管理ができる' },
      { id: 'node-3', content: 'Streamを使用できる' },
      { id: 'node-4', content: 'Bufferを操作できる' },
      { id: 'node-5', content: 'fsモジュールでファイル操作ができる' },
      { id: 'node-6', content: 'pathモジュールを使用できる' },
      { id: 'node-7', content: '環境変数を適切に管理できる' },
      { id: 'node-8', content: 'プロセス管理（PM2等）を理解する' },
    ]
  },
  {
    id: 'python', name: 'Python', tier: 1, category: 'backend', description: 'シンプルで読みやすい構文が特徴の汎用プログラミング言語。Web開発からデータ分析、機械学習まで幅広い分野で活用される', icon: 'python', pointValue: 15, connections: ['django', 'fastapi'],
    learningItems: [
      { id: 'py-1', content: '基本的な文法とデータ型を理解する' },
      { id: 'py-2', content: 'リスト内包表記を使いこなす' },
      { id: 'py-3', content: 'デコレータを理解し作成できる' },
      { id: 'py-4', content: 'ジェネレータとイテレータを使用できる' },
      { id: 'py-5', content: '仮想環境（venv, poetry）を管理できる' },
      { id: 'py-6', content: '型ヒントを使用できる' },
      { id: 'py-7', content: 'asyncioで非同期処理ができる' },
      { id: 'py-8', content: 'パッケージを作成・公開できる' },
    ]
  },
  {
    id: 'go', name: 'Go', tier: 1, category: 'backend', description: 'Google開発のコンパイル言語。シンプルな構文、高速なコンパイル、goroutineによる軽量な並行処理が特徴', icon: 'go', pointValue: 15, connections: ['gin', 'rust'],
    learningItems: [
      { id: 'go-1', content: '基本文法と型システムを理解する' },
      { id: 'go-2', content: 'goroutineで並行処理ができる' },
      { id: 'go-3', content: 'channelでgoroutine間通信ができる' },
      { id: 'go-4', content: 'インターフェースを理解し活用できる' },
      { id: 'go-5', content: 'エラーハンドリングパターンを理解する' },
      { id: 'go-6', content: 'Go Modulesでパッケージ管理ができる' },
      { id: 'go-7', content: '構造体とメソッドを使用できる' },
      { id: 'go-8', content: 'テストを書ける（testing パッケージ）' },
    ]
  },
  {
    id: 'java', name: 'Java', tier: 1, category: 'backend', description: 'エンタープライズ言語', icon: 'java', pointValue: 15, connections: ['spring'],
    learningItems: [
      { id: 'java-1', content: 'オブジェクト指向の基礎を理解する' },
      { id: 'java-2', content: 'コレクションフレームワークを使いこなす' },
      { id: 'java-3', content: 'Stream APIを使用できる' },
      { id: 'java-4', content: '例外処理を適切に実装できる' },
      { id: 'java-5', content: 'ジェネリクスを理解し活用できる' },
      { id: 'java-6', content: 'マルチスレッドプログラミングができる' },
      { id: 'java-7', content: 'Maven/Gradleでビルドできる' },
      { id: 'java-8', content: 'JVMの基礎を理解する' },
      { id: 'java-9', content: 'Oracle Certified Java Programmer資格を取得する' },
    ]
  },

  {
    id: 'express', name: 'Express.js', tier: 2, category: 'backend', description: 'Node.js FW', icon: 'express', pointValue: 15, connections: ['rest-api', 'api-design'],
    learningItems: [
      { id: 'exp-1', content: 'ルーティングを設定できる' },
      { id: 'exp-2', content: 'ミドルウェアを理解し作成できる' },
      { id: 'exp-3', content: 'リクエスト/レスポンスオブジェクトを操作できる' },
      { id: 'exp-4', content: 'エラーハンドリングミドルウェアを実装できる' },
      { id: 'exp-5', content: '静的ファイルを配信できる' },
      { id: 'exp-6', content: 'テンプレートエンジンを使用できる' },
      { id: 'exp-7', content: 'セキュリティミドルウェア（helmet等）を設定できる' },
    ]
  },
  {
    id: 'nestjs', name: 'NestJS', tier: 2, category: 'backend', description: 'Enterprise Node', icon: 'nestjs', pointValue: 20, connections: ['rest-api', 'graphql', 'api-design'],
    learningItems: [
      { id: 'nest-1', content: 'モジュール・コントローラー・サービスの構造を理解する' },
      { id: 'nest-2', content: '依存性注入を活用できる' },
      { id: 'nest-3', content: 'デコレータを使いこなす' },
      { id: 'nest-4', content: 'パイプとバリデーションを実装できる' },
      { id: 'nest-5', content: 'ガードで認証・認可を実装できる' },
      { id: 'nest-6', content: 'インターセプターを使用できる' },
      { id: 'nest-7', content: 'TypeORMまたはPrismaと統合できる' },
      { id: 'nest-8', content: 'Swagger/OpenAPIドキュメントを生成できる' },
    ]
  },
  {
    id: 'django', name: 'Django', tier: 2, category: 'backend', description: 'Python FW', icon: 'django', pointValue: 20, connections: ['rest-api', 'api-design'],
    learningItems: [
      { id: 'dj-1', content: 'MVTアーキテクチャを理解する' },
      { id: 'dj-2', content: 'モデルとマイグレーションを使用できる' },
      { id: 'dj-3', content: 'Django ORMでクエリを書ける' },
      { id: 'dj-4', content: 'ビューとURLルーティングを設定できる' },
      { id: 'dj-5', content: 'テンプレートエンジンを使用できる' },
      { id: 'dj-6', content: 'Django REST Frameworkを使用できる' },
      { id: 'dj-7', content: 'ミドルウェアを理解し作成できる' },
      { id: 'dj-8', content: '管理サイトをカスタマイズできる' },
    ]
  },
  {
    id: 'fastapi', name: 'FastAPI', tier: 2, category: 'backend', description: '高速API', icon: 'fastapi', pointValue: 20, connections: ['rest-api', 'graphql', 'api-design'],
    learningItems: [
      { id: 'fast-1', content: 'パスパラメータとクエリパラメータを使用できる' },
      { id: 'fast-2', content: 'Pydanticでリクエスト/レスポンスモデルを定義できる' },
      { id: 'fast-3', content: '依存性注入を活用できる' },
      { id: 'fast-4', content: '非同期エンドポイントを実装できる' },
      { id: 'fast-5', content: '自動生成されるOpenAPIドキュメントを活用できる' },
      { id: 'fast-6', content: 'バックグラウンドタスクを実装できる' },
      { id: 'fast-7', content: 'ミドルウェアを使用できる' },
      { id: 'fast-8', content: 'WebSocketを実装できる' },
    ]
  },
  {
    id: 'gin', name: 'Gin', tier: 2, category: 'backend', description: 'Go FW', icon: 'gin', pointValue: 15, connections: ['rest-api', 'api-design'],
    learningItems: [
      { id: 'gin-1', content: 'ルーティングを設定できる' },
      { id: 'gin-2', content: 'ミドルウェアを使用できる' },
      { id: 'gin-3', content: 'リクエストバインディングを使用できる' },
      { id: 'gin-4', content: 'バリデーションを実装できる' },
      { id: 'gin-5', content: 'JSONレスポンスを返却できる' },
      { id: 'gin-6', content: 'エラーハンドリングを実装できる' },
      { id: 'gin-7', content: 'グループルーティングを使用できる' },
    ]
  },
  {
    id: 'spring', name: 'Spring Boot', tier: 2, category: 'backend', description: 'Java FW', icon: 'spring', pointValue: 20, connections: ['rest-api', 'graphql', 'design-patterns'],
    learningItems: [
      { id: 'spring-1', content: 'Spring Bootプロジェクトを作成できる' },
      { id: 'spring-2', content: '依存性注入（DI）を理解し活用できる' },
      { id: 'spring-3', content: 'REST APIを実装できる' },
      { id: 'spring-4', content: 'Spring Data JPAでDB操作ができる' },
      { id: 'spring-5', content: 'Spring Securityで認証・認可を実装できる' },
      { id: 'spring-6', content: 'アノテーションを理解し使用できる' },
      { id: 'spring-7', content: 'プロファイルで環境を切り替えられる' },
      { id: 'spring-8', content: 'Actuatorでヘルスチェックを実装できる' },
    ]
  },
  {
    id: 'rust', name: 'Rust', tier: 2, category: 'backend', description: 'システム言語', icon: 'rust', pointValue: 20, connections: ['grpc', 'websocket'],
    learningItems: [
      { id: 'rust-1', content: '所有権システムを理解する' },
      { id: 'rust-2', content: '借用とライフタイムを理解する' },
      { id: 'rust-3', content: 'Result/Optionでエラーハンドリングができる' },
      { id: 'rust-4', content: 'パターンマッチングを使用できる' },
      { id: 'rust-5', content: 'トレイトを理解し実装できる' },
      { id: 'rust-6', content: 'Cargoでパッケージ管理ができる' },
      { id: 'rust-7', content: 'async/awaitで非同期処理ができる' },
      { id: 'rust-8', content: 'マクロを理解する' },
    ]
  },
  {
    id: 'sql', name: 'SQL', tier: 2, category: 'backend', description: 'DB言語', icon: 'sql', pointValue: 15, connections: ['postgresql', 'mysql'],
    learningItems: [
      { id: 'sql-1', content: 'SELECT文で基本的なクエリが書ける' },
      { id: 'sql-2', content: 'JOINを使いこなす（INNER, LEFT, RIGHT, FULL）' },
      { id: 'sql-3', content: 'GROUP BYとHAVINGを使用できる' },
      { id: 'sql-4', content: 'サブクエリを書ける' },
      { id: 'sql-5', content: 'インデックスを理解し作成できる' },
      { id: 'sql-6', content: 'トランザクションを理解する' },
      { id: 'sql-7', content: 'ウィンドウ関数を使用できる' },
      { id: 'sql-8', content: 'クエリの実行計画を読める' },
    ]
  },

  {
    id: 'rest-api', name: 'REST API', tier: 3, category: 'backend', description: 'RESTful設計', icon: 'api', pointValue: 15, connections: ['authentication', 'caching'],
    learningItems: [
      { id: 'rest-1', content: 'RESTの原則を理解する' },
      { id: 'rest-2', content: 'HTTPメソッドを適切に使い分けられる' },
      { id: 'rest-3', content: 'ステータスコードを適切に返却できる' },
      { id: 'rest-4', content: 'URLの設計規則を理解する' },
      { id: 'rest-5', content: 'ページネーションを実装できる' },
      { id: 'rest-6', content: 'フィルタリング・ソートを実装できる' },
      { id: 'rest-7', content: 'バージョニング戦略を理解する' },
      { id: 'rest-8', content: 'HATEOASを理解する' },
    ]
  },
  {
    id: 'graphql', name: 'GraphQL', tier: 3, category: 'backend', description: 'クエリAPI', icon: 'graphql', pointValue: 20, connections: ['authentication'],
    learningItems: [
      { id: 'gql-1', content: 'スキーマ定義言語（SDL）を理解する' },
      { id: 'gql-2', content: 'Query/Mutation/Subscriptionを実装できる' },
      { id: 'gql-3', content: 'リゾルバを実装できる' },
      { id: 'gql-4', content: 'N+1問題を理解し対策できる' },
      { id: 'gql-5', content: 'DataLoaderを使用できる' },
      { id: 'gql-6', content: '認証・認可を実装できる' },
      { id: 'gql-7', content: 'Apollo Server/Clientを使用できる' },
      { id: 'gql-8', content: 'フラグメントとディレクティブを使用できる' },
    ]
  },
  {
    id: 'postgresql', name: 'PostgreSQL', tier: 3, category: 'backend', description: '高機能RDB', icon: 'postgresql', pointValue: 15, connections: ['orm'],
    learningItems: [
      { id: 'pg-1', content: 'データ型を理解する（JSON, Array等）' },
      { id: 'pg-2', content: 'インデックスの種類と使い分けを理解する' },
      { id: 'pg-3', content: 'EXPLAINでクエリを最適化できる' },
      { id: 'pg-4', content: 'パーティショニングを理解する' },
      { id: 'pg-5', content: 'トリガーと関数を作成できる' },
      { id: 'pg-6', content: 'レプリケーションを設定できる' },
      { id: 'pg-7', content: 'バックアップ・リストアができる' },
      { id: 'pg-8', content: 'pg_statで統計情報を確認できる' },
    ]
  },
  {
    id: 'mysql', name: 'MySQL', tier: 3, category: 'backend', description: '人気RDB', icon: 'mysql', pointValue: 15, connections: ['orm'],
    learningItems: [
      { id: 'mysql-1', content: 'ストレージエンジン（InnoDB）を理解する' },
      { id: 'mysql-2', content: 'インデックスを適切に設計できる' },
      { id: 'mysql-3', content: 'EXPLAIN で実行計画を確認できる' },
      { id: 'mysql-4', content: 'レプリケーションを設定できる' },
      { id: 'mysql-5', content: 'スロークエリログを分析できる' },
      { id: 'mysql-6', content: '文字コードと照合順序を理解する' },
      { id: 'mysql-7', content: 'バックアップ・リストアができる' },
    ]
  },
  {
    id: 'grpc', name: 'gRPC', tier: 3, category: 'backend', description: '高速RPC', icon: 'grpc', pointValue: 20, connections: ['authentication', 'microservices'],
    learningItems: [
      { id: 'grpc-1', content: 'Protocol Buffersでスキーマを定義できる' },
      { id: 'grpc-2', content: 'Unary RPCを実装できる' },
      { id: 'grpc-3', content: 'Server/Client Streamingを実装できる' },
      { id: 'grpc-4', content: 'Bidirectional Streamingを実装できる' },
      { id: 'grpc-5', content: 'メタデータを使用できる' },
      { id: 'grpc-6', content: 'インターセプターを実装できる' },
      { id: 'grpc-7', content: 'gRPC-Webを使用できる' },
      { id: 'grpc-8', content: 'ロードバランシングを理解する' },
    ]
  },
  {
    id: 'websocket', name: 'WebSocket', tier: 3, category: 'backend', description: 'リアルタイム通信', icon: 'websocket', pointValue: 15, connections: ['message-queue'],
    learningItems: [
      { id: 'ws-1', content: 'WebSocketプロトコルを理解する' },
      { id: 'ws-2', content: 'サーバー側の実装ができる' },
      { id: 'ws-3', content: 'クライアント側の実装ができる' },
      { id: 'ws-4', content: '接続管理（heartbeat等）を実装できる' },
      { id: 'ws-5', content: '再接続ロジックを実装できる' },
      { id: 'ws-6', content: 'Socket.ioを使用できる' },
      { id: 'ws-7', content: 'スケールアウト時の課題を理解する' },
    ]
  },
  {
    id: 'design-patterns', name: 'デザインパターン', tier: 3, category: 'backend', description: 'GoF等', icon: 'patterns', pointValue: 15, connections: ['clean-architecture'],
    learningItems: [
      { id: 'dp-1', content: 'Singleton, Factory, Builderパターンを理解する' },
      { id: 'dp-2', content: 'Strategy, Observer, Decoratorパターンを理解する' },
      { id: 'dp-3', content: 'Adapter, Facade, Proxyパターンを理解する' },
      { id: 'dp-4', content: 'Template Method, Commandパターンを理解する' },
      { id: 'dp-5', content: 'Repository, Unit of Workパターンを理解する' },
      { id: 'dp-6', content: 'SOLID原則を理解し適用できる' },
      { id: 'dp-7', content: 'DIコンテナを理解する' },
      { id: 'dp-8', content: 'アンチパターンを識別できる' },
    ]
  },
  {
    id: 'api-design', name: 'API設計', tier: 3, category: 'backend', description: 'RESTful設計原則', icon: 'api-design', pointValue: 15, connections: ['authentication'],
    learningItems: [
      { id: 'apid-1', content: 'OpenAPI/Swagger仕様を書ける' },
      { id: 'apid-2', content: 'API設計のベストプラクティスを理解する' },
      { id: 'apid-3', content: 'エラーレスポンスを標準化できる' },
      { id: 'apid-4', content: 'レート制限を設計できる' },
      { id: 'apid-5', content: 'API バージョニング戦略を理解する' },
      { id: 'apid-6', content: 'ドキュメンテーションを作成できる' },
      { id: 'apid-7', content: '下位互換性を考慮した設計ができる' },
    ]
  },

  {
    id: 'authentication', name: '認証・認可', tier: 4, category: 'backend', description: 'JWT, OAuth', icon: 'auth', pointValue: 20, connections: ['security'],
    learningItems: [
      { id: 'auth-1', content: '認証と認可の違いを理解する' },
      { id: 'auth-2', content: 'JWTの構造と検証を理解する' },
      { id: 'auth-3', content: 'OAuth 2.0フローを理解する' },
      { id: 'auth-4', content: 'OpenID Connectを理解する' },
      { id: 'auth-5', content: 'セッション管理を実装できる' },
      { id: 'auth-6', content: 'RBAC/ABACを実装できる' },
      { id: 'auth-7', content: 'MFA（多要素認証）を実装できる' },
      { id: 'auth-8', content: 'APIキー認証を実装できる' },
      { id: 'auth-9', content: 'パスキー/WebAuthnを理解する' },
    ]
  },
  {
    id: 'orm', name: 'ORM', tier: 4, category: 'backend', description: 'Prisma, TypeORM', icon: 'orm', pointValue: 15, connections: [],
    learningItems: [
      { id: 'orm-1', content: 'ORMの利点と欠点を理解する' },
      { id: 'orm-2', content: 'スキーマ定義とマイグレーションができる' },
      { id: 'orm-3', content: 'リレーションを定義できる' },
      { id: 'orm-4', content: 'クエリビルダーを使用できる' },
      { id: 'orm-5', content: 'トランザクションを実装できる' },
      { id: 'orm-6', content: 'N+1問題を理解し対策できる' },
      { id: 'orm-7', content: '生SQLを実行できる' },
      { id: 'orm-8', content: 'シーディングを実装できる' },
    ]
  },
  {
    id: 'mongodb', name: 'MongoDB', tier: 4, category: 'backend', description: 'NoSQL', icon: 'mongodb', pointValue: 15, connections: [],
    learningItems: [
      { id: 'mongo-1', content: 'ドキュメントモデルを理解する' },
      { id: 'mongo-2', content: 'CRUD操作ができる' },
      { id: 'mongo-3', content: '集約パイプラインを使用できる' },
      { id: 'mongo-4', content: 'インデックスを設計できる' },
      { id: 'mongo-5', content: 'スキーマ設計のパターンを理解する' },
      { id: 'mongo-6', content: 'レプリカセットを理解する' },
      { id: 'mongo-7', content: 'シャーディングを理解する' },
      { id: 'mongo-8', content: 'Mongooseを使用できる' },
    ]
  },
  {
    id: 'redis', name: 'Redis', tier: 4, category: 'backend', description: 'KVS', icon: 'redis', pointValue: 15, connections: ['caching'],
    learningItems: [
      { id: 'redis-1', content: 'データ型（String, List, Set, Hash, Sorted Set）を理解する' },
      { id: 'redis-2', content: 'キーの命名規則とTTLを設定できる' },
      { id: 'redis-3', content: 'Pub/Subを使用できる' },
      { id: 'redis-4', content: 'トランザクションを使用できる' },
      { id: 'redis-5', content: 'Luaスクリプトを実行できる' },
      { id: 'redis-6', content: 'クラスターを理解する' },
      { id: 'redis-7', content: '永続化設定を理解する（RDB, AOF）' },
      { id: 'redis-8', content: 'セッションストアとして使用できる' },
    ]
  },
  {
    id: 'message-queue', name: 'メッセージキュー', tier: 4, category: 'backend', description: 'Kafka/RabbitMQ', icon: 'queue', pointValue: 20, connections: ['microservices'],
    learningItems: [
      { id: 'mq-1', content: 'メッセージキューのユースケースを理解する' },
      { id: 'mq-2', content: 'Pub/Subパターンを理解する' },
      { id: 'mq-3', content: 'RabbitMQの基本操作ができる' },
      { id: 'mq-4', content: 'Apache Kafkaの概念を理解する' },
      { id: 'mq-5', content: 'プロデューサー/コンシューマーを実装できる' },
      { id: 'mq-6', content: 'メッセージの永続化を設定できる' },
      { id: 'mq-7', content: 'デッドレターキューを理解する' },
      { id: 'mq-8', content: '冪等性を考慮した設計ができる' },
    ]
  },
  {
    id: 'caching', name: 'キャッシュ戦略', tier: 4, category: 'backend', description: 'CDN/Cache設計', icon: 'cache', pointValue: 20, connections: ['microservices'],
    learningItems: [
      { id: 'cache-1', content: 'キャッシュの種類（ブラウザ、CDN、サーバー）を理解する' },
      { id: 'cache-2', content: 'Cache-Controlヘッダーを設定できる' },
      { id: 'cache-3', content: 'キャッシュ無効化戦略を理解する' },
      { id: 'cache-4', content: 'Write-through/Write-backパターンを理解する' },
      { id: 'cache-5', content: 'キャッシュスタンピード対策ができる' },
      { id: 'cache-6', content: 'CDNの設定ができる' },
      { id: 'cache-7', content: 'アプリケーションキャッシュを実装できる' },
      { id: 'cache-8', content: 'キャッシュヒット率を監視できる' },
    ]
  },
  {
    id: 'clean-architecture', name: 'クリーンアーキテクチャ', tier: 4, category: 'backend', description: '設計原則', icon: 'architecture', pointValue: 20, connections: ['ddd'],
    learningItems: [
      { id: 'clean-1', content: '依存性逆転の原則を理解する' },
      { id: 'clean-2', content: 'レイヤー構造を設計できる' },
      { id: 'clean-3', content: 'ユースケース層を実装できる' },
      { id: 'clean-4', content: 'ドメイン層を実装できる' },
      { id: 'clean-5', content: 'インターフェースアダプター層を実装できる' },
      { id: 'clean-6', content: '外部フレームワークからの独立性を確保できる' },
      { id: 'clean-7', content: 'テスタブルな設計ができる' },
      { id: 'clean-8', content: 'オニオンアーキテクチャを理解する' },
    ]
  },

  {
    id: 'security', name: 'セキュリティ', tier: 5, category: 'backend', description: 'OWASP対策', icon: 'security', pointValue: 25, connections: [],
    learningItems: [
      { id: 'sec-1', content: 'OWASP Top 10を理解する' },
      { id: 'sec-2', content: 'SQLインジェクション対策ができる' },
      { id: 'sec-3', content: 'XSS対策ができる' },
      { id: 'sec-4', content: 'CSRF対策ができる' },
      { id: 'sec-5', content: 'パスワードの安全な保存（bcrypt等）ができる' },
      { id: 'sec-6', content: '入力バリデーションを徹底できる' },
      { id: 'sec-7', content: 'セキュリティヘッダーを設定できる' },
      { id: 'sec-8', content: '脆弱性診断ツールを使用できる' },
      { id: 'sec-9', content: 'セキュリティ関連資格を取得する（情報処理安全確保支援士等）' },
    ]
  },
  {
    id: 'testing-backend', name: 'テスト(BE)', tier: 5, category: 'backend', description: 'ユニット/統合', icon: 'testing', pointValue: 20, connections: [],
    learningItems: [
      { id: 'test-be-1', content: 'ユニットテストを書ける' },
      { id: 'test-be-2', content: '統合テストを書ける' },
      { id: 'test-be-3', content: 'モックとスタブを適切に使用できる' },
      { id: 'test-be-4', content: 'テストダブルを理解する' },
      { id: 'test-be-5', content: 'テストデータベースを設定できる' },
      { id: 'test-be-6', content: 'APIテスト（Postman等）ができる' },
      { id: 'test-be-7', content: 'テストカバレッジを測定できる' },
      { id: 'test-be-8', content: '負荷テストができる' },
    ]
  },
  {
    id: 'microservices', name: 'マイクロサービス', tier: 5, category: 'backend', description: '分散アーキテクチャ', icon: 'microservices', pointValue: 30, connections: [],
    learningItems: [
      { id: 'ms-1', content: 'マイクロサービスの利点と課題を理解する' },
      { id: 'ms-2', content: 'サービス分割の基準を理解する' },
      { id: 'ms-3', content: 'サービス間通信（同期/非同期）を設計できる' },
      { id: 'ms-4', content: 'APIゲートウェイを理解する' },
      { id: 'ms-5', content: 'サービスディスカバリを理解する' },
      { id: 'ms-6', content: 'サーキットブレーカーを実装できる' },
      { id: 'ms-7', content: 'Sagaパターンを理解する' },
      { id: 'ms-8', content: '分散トレーシングを導入できる' },
      { id: 'ms-9', content: 'イベント駆動アーキテクチャを設計できる' },
    ]
  },
  {
    id: 'ddd', name: 'ドメイン駆動設計', tier: 5, category: 'backend', description: 'DDD', icon: 'ddd', pointValue: 25, connections: [],
    learningItems: [
      { id: 'ddd-1', content: 'ユビキタス言語を定義できる' },
      { id: 'ddd-2', content: '境界づけられたコンテキストを識別できる' },
      { id: 'ddd-3', content: 'エンティティと値オブジェクトを設計できる' },
      { id: 'ddd-4', content: '集約とルートエンティティを設計できる' },
      { id: 'ddd-5', content: 'リポジトリパターンを実装できる' },
      { id: 'ddd-6', content: 'ドメインサービスを設計できる' },
      { id: 'ddd-7', content: 'ドメインイベントを設計できる' },
      { id: 'ddd-8', content: 'CQRSを理解する' },
      { id: 'ddd-9', content: 'イベントソーシングを理解する' },
    ]
  },

  // ===========================================
  // DevOps スキル
  // ===========================================
  {
    id: 'devops-basics', name: 'DevOps基礎', tier: 1, category: 'devops', description: 'DevOpsの文化と原則を理解する。開発と運用の協力体制、継続的改善、自動化の重要性を学ぶ', icon: 'devops', pointValue: 10, connections: ['github', 'gitlab'],
    learningItems: [
      { id: 'devops-b-1', content: 'DevOpsの歴史と背景を理解する' },
      { id: 'devops-b-2', content: 'CI/CDの概念を理解する' },
      { id: 'devops-b-3', content: 'Infrastructure as Codeの概念を理解する' },
      { id: 'devops-b-4', content: 'モニタリングとログ管理の重要性を理解する' },
      { id: 'devops-b-5', content: 'DevOpsとアジャイルの関係を理解する' },
      { id: 'devops-b-6', content: 'DevOpsのメトリクス（DORA等）を理解する' },
    ]
  },
  {
    id: 'gitlab', name: 'GitLab', tier: 2, category: 'devops', description: 'Git/CI/CDを統合したDevOpsプラットフォーム。リポジトリ管理からCI/CD、セキュリティスキャンまで一貫したワークフローを提供', icon: 'gitlab', pointValue: 15, connections: ['cicd', 'docker'],
    learningItems: [
      { id: 'gitlab-1', content: 'GitLabプロジェクトを作成・管理できる' },
      { id: 'gitlab-2', content: 'Merge Requestワークフローを理解する' },
      { id: 'gitlab-3', content: '.gitlab-ci.ymlでパイプラインを定義できる' },
      { id: 'gitlab-4', content: 'GitLab Runnerを設定できる' },
      { id: 'gitlab-5', content: 'Container Registryを使用できる' },
      { id: 'gitlab-6', content: 'GitLabセキュリティ機能（SAST/DAST）を活用できる' },
      { id: 'gitlab-7', content: 'GitLab Pagesでサイトを公開できる' },
    ]
  },

  // ===========================================
  // Infrastructure スキル
  // ===========================================
  {
    id: 'linux', name: 'Linux', tier: 1, category: 'infrastructure', description: 'オープンソースのOS。サーバー環境のデファクトスタンダードであり、コマンドライン操作やシステム管理の基礎となる', icon: 'linux', pointValue: 15, connections: ['shell', 'networking', 'dns'],
    learningItems: [
      { id: 'linux-1', content: '基本的なコマンド（ls, cd, cp, mv等）を使用できる' },
      { id: 'linux-2', content: 'ファイルパーミッションを理解し設定できる' },
      { id: 'linux-3', content: 'プロセス管理（ps, top, kill）ができる' },
      { id: 'linux-4', content: 'パッケージ管理（apt, yum）ができる' },
      { id: 'linux-5', content: 'ユーザー・グループ管理ができる' },
      { id: 'linux-6', content: 'systemdでサービス管理ができる' },
      { id: 'linux-7', content: 'ログの確認方法を理解する（journalctl等）' },
      { id: 'linux-8', content: 'LPIC/LinuC資格を取得する' },
    ]
  },
  {
    id: 'git', name: 'Git', tier: 1, category: 'infrastructure', description: '分散型バージョン管理システム。コードの変更履歴を追跡し、チーム開発でのブランチ管理やマージを効率的に行える', icon: 'git', pointValue: 15, connections: ['github'],
    learningItems: [
      { id: 'git-1', content: '基本操作（add, commit, push, pull）ができる' },
      { id: 'git-2', content: 'ブランチの作成・マージができる' },
      { id: 'git-3', content: 'コンフリクトを解決できる' },
      { id: 'git-4', content: 'rebaseを理解し使用できる' },
      { id: 'git-5', content: 'stashを使用できる' },
      { id: 'git-6', content: 'cherry-pickを使用できる' },
      { id: 'git-7', content: 'git-flowを理解する' },
      { id: 'git-8', content: '.gitignoreを適切に設定できる' },
    ]
  },

  {
    id: 'shell', name: 'シェル', tier: 2, category: 'infrastructure', description: 'Bash/Zsh', icon: 'shell', pointValue: 10, connections: ['docker'],
    learningItems: [
      { id: 'shell-1', content: 'シェルスクリプトの基本文法を理解する' },
      { id: 'shell-2', content: '変数とパラメータ展開を使用できる' },
      { id: 'shell-3', content: '条件分岐とループを書ける' },
      { id: 'shell-4', content: 'パイプとリダイレクトを使いこなす' },
      { id: 'shell-5', content: 'grep, sed, awkを使用できる' },
      { id: 'shell-6', content: '関数を定義・使用できる' },
      { id: 'shell-7', content: '環境変数を管理できる' },
    ]
  },
  {
    id: 'networking', name: 'ネットワーク', tier: 2, category: 'infrastructure', description: 'TCP/IP', icon: 'networking', pointValue: 15, connections: ['nginx', 'load-balancer'],
    learningItems: [
      { id: 'net-1', content: 'OSI参照モデルを理解する' },
      { id: 'net-2', content: 'TCP/IPプロトコルスタックを理解する' },
      { id: 'net-3', content: 'IPアドレスとサブネットを理解する' },
      { id: 'net-4', content: 'HTTP/HTTPSプロトコルを理解する' },
      { id: 'net-5', content: 'ファイアウォールを設定できる' },
      { id: 'net-6', content: 'VPNを理解する' },
      { id: 'net-7', content: 'ネットワークデバッグ（ping, traceroute, netstat）ができる' },
      { id: 'net-8', content: 'ネットワーク関連資格（CCNA等）を取得する' },
    ]
  },
  {
    id: 'github', name: 'GitHub', tier: 2, category: 'devops', description: 'Gitリポジトリのホスティングサービス。Issues、Pull Request、Actionsなどチーム開発に必要な機能を提供する', icon: 'github', pointValue: 10, connections: ['cicd'],
    learningItems: [
      { id: 'gh-1', content: 'リポジトリの作成・管理ができる' },
      { id: 'gh-2', content: 'Pull Requestのワークフローを理解する' },
      { id: 'gh-3', content: 'Issues/Projectsで課題管理ができる' },
      { id: 'gh-4', content: 'ブランチ保護ルールを設定できる' },
      { id: 'gh-5', content: 'GitHub Actionsの基礎を理解する' },
      { id: 'gh-6', content: 'コードレビューができる' },
      { id: 'gh-7', content: 'GitHubセキュリティ機能を活用できる' },
    ]
  },
  {
    id: 'dns', name: 'DNS', tier: 2, category: 'infrastructure', description: 'ドメイン管理', icon: 'dns', pointValue: 10, connections: ['nginx', 'cloudflare'],
    learningItems: [
      { id: 'dns-1', content: 'DNSの仕組みを理解する' },
      { id: 'dns-2', content: 'レコードタイプ（A, AAAA, CNAME, MX, TXT）を理解する' },
      { id: 'dns-3', content: 'TTLを適切に設定できる' },
      { id: 'dns-4', content: 'ネームサーバーを設定できる' },
      { id: 'dns-5', content: 'DNSのトラブルシューティング（dig, nslookup）ができる' },
      { id: 'dns-6', content: 'DNSSECを理解する' },
      { id: 'dns-7', content: 'Route 53/Cloud DNSを使用できる' },
    ]
  },
  {
    id: 'cloud-basics', name: 'クラウド基礎', tier: 2, category: 'infrastructure', description: 'クラウドコンピューティングの基本概念。IaaS/PaaS/SaaSの違い、リージョン、スケーリング、課金モデルを理解する', icon: 'cloud', pointValue: 10, connections: ['aws-basics', 'gcp-basics', 'azure-basics'],
    learningItems: [
      { id: 'cloud-1', content: 'クラウドの利点（スケーラビリティ、コスト効率等）を理解する' },
      { id: 'cloud-2', content: 'IaaS/PaaS/SaaSの違いを説明できる' },
      { id: 'cloud-3', content: 'リージョンとアベイラビリティゾーンを理解する' },
      { id: 'cloud-4', content: '従量課金モデルを理解する' },
      { id: 'cloud-5', content: '垂直/水平スケーリングを理解する' },
      { id: 'cloud-6', content: '責任共有モデルを理解する' },
      { id: 'cloud-7', content: 'マネージドサービスの利点を理解する' },
    ]
  },

  {
    id: 'docker', name: 'Docker', tier: 3, category: 'devops', description: 'アプリケーションをコンテナとしてパッケージ化・実行するプラットフォーム。環境の再現性と移植性を高め、開発〜本番の一貫性を保つ', icon: 'docker', pointValue: 20, connections: ['kubernetes'],
    learningItems: [
      { id: 'docker-1', content: 'コンテナの概念を理解する' },
      { id: 'docker-2', content: 'Dockerfileを書ける' },
      { id: 'docker-3', content: 'マルチステージビルドを使用できる' },
      { id: 'docker-4', content: 'Docker Composeで複数コンテナを管理できる' },
      { id: 'docker-5', content: 'ボリュームとネットワークを設定できる' },
      { id: 'docker-6', content: 'イメージの最適化ができる' },
      { id: 'docker-7', content: 'Docker Hubにイメージをプッシュできる' },
      { id: 'docker-8', content: 'セキュリティベストプラクティスを理解する' },
    ]
  },
  {
    id: 'nginx', name: 'Nginx', tier: 3, category: 'infrastructure', description: 'Webサーバー', icon: 'nginx', pointValue: 15, connections: ['aws-basics', 'load-balancer'],
    learningItems: [
      { id: 'nginx-1', content: '基本的な設定ファイルを理解する' },
      { id: 'nginx-2', content: 'バーチャルホストを設定できる' },
      { id: 'nginx-3', content: 'リバースプロキシを設定できる' },
      { id: 'nginx-4', content: 'SSL/TLS証明書を設定できる' },
      { id: 'nginx-5', content: 'ロードバランシングを設定できる' },
      { id: 'nginx-6', content: 'キャッシュを設定できる' },
      { id: 'nginx-7', content: 'ログを設定・分析できる' },
    ]
  },
  {
    id: 'cicd', name: 'CI/CD', tier: 3, category: 'devops', description: '継続的インテグレーション/デリバリー。コードの変更を自動でテスト・ビルド・デプロイし、ソフトウェアの品質と開発速度を向上させる', icon: 'cicd', pointValue: 20, connections: ['kubernetes', 'ansible'],
    learningItems: [
      { id: 'cicd-1', content: 'CI/CDの概念と利点を理解する' },
      { id: 'cicd-2', content: 'GitHub Actionsでワークフローを作成できる' },
      { id: 'cicd-3', content: 'GitLab CI/CDを使用できる' },
      { id: 'cicd-4', content: 'ビルド・テスト・デプロイを自動化できる' },
      { id: 'cicd-5', content: 'シークレット管理ができる' },
      { id: 'cicd-6', content: 'キャッシュを活用してビルドを高速化できる' },
      { id: 'cicd-7', content: 'ブランチ戦略に合わせたパイプラインを設計できる' },
      { id: 'cicd-8', content: 'ロールバック戦略を実装できる' },
    ]
  },
  {
    id: 'container-registry', name: 'Container Registry', tier: 3, category: 'devops', description: 'Dockerイメージを保存・管理するレジストリサービス。ECR、GCR、Docker Hubなどでイメージのバージョン管理とセキュリティスキャンを行う', icon: 'registry', pointValue: 15, connections: ['kubernetes'],
    learningItems: [
      { id: 'cr-1', content: 'コンテナレジストリの役割を理解する' },
      { id: 'cr-2', content: 'Docker Hubにイメージをプッシュできる' },
      { id: 'cr-3', content: 'プライベートレジストリを設定できる' },
      { id: 'cr-4', content: 'イメージタグ戦略を設計できる' },
      { id: 'cr-5', content: 'イメージの脆弱性スキャンを実行できる' },
      { id: 'cr-6', content: 'ECR/GCR/ACRを使用できる' },
      { id: 'cr-7', content: 'イメージの自動クリーンアップを設定できる' },
    ]
  },
  {
    id: 'logging', name: 'ログ管理', tier: 3, category: 'devops', description: '分散システムのログを収集・集約・分析する。ELK Stack、Loki、Fluentdなどを使ってトラブルシューティングを効率化する', icon: 'logging', pointValue: 15, connections: ['monitoring'],
    learningItems: [
      { id: 'log-1', content: '構造化ログの重要性を理解する' },
      { id: 'log-2', content: 'Fluentd/Fluent Bitを設定できる' },
      { id: 'log-3', content: 'Elasticsearchでログを保存できる' },
      { id: 'log-4', content: 'Kibanaでログを可視化できる' },
      { id: 'log-5', content: 'Lokiでログを集約できる' },
      { id: 'log-6', content: 'ログローテーションを設定できる' },
      { id: 'log-7', content: 'ログからアラートを設定できる' },
      { id: 'log-8', content: 'トレースIDでログを追跡できる' },
    ]
  },
  {
    id: 'cloudflare', name: 'Cloudflare', tier: 3, category: 'infrastructure', description: 'CDN/Edge', icon: 'cloudflare', pointValue: 15, connections: ['aws-basics', 'gcp-basics', 'azure-basics'],
    learningItems: [
      { id: 'cf-1', content: 'DNSをCloudflareで管理できる' },
      { id: 'cf-2', content: 'CDNの設定ができる' },
      { id: 'cf-3', content: 'SSL/TLSの設定ができる' },
      { id: 'cf-4', content: 'ページルールを設定できる' },
      { id: 'cf-5', content: 'Workersでエッジコンピューティングができる' },
      { id: 'cf-6', content: 'WAFを設定できる' },
      { id: 'cf-7', content: 'キャッシュの無効化ができる' },
    ]
  },
  {
    id: 'load-balancer', name: 'ロードバランサー', tier: 3, category: 'infrastructure', description: '負荷分散', icon: 'loadbalancer', pointValue: 15, connections: ['kubernetes'],
    learningItems: [
      { id: 'lb-1', content: 'ロードバランシングの概念を理解する' },
      { id: 'lb-2', content: 'L4/L7ロードバランサーの違いを理解する' },
      { id: 'lb-3', content: '負荷分散アルゴリズムを理解する' },
      { id: 'lb-4', content: 'ヘルスチェックを設定できる' },
      { id: 'lb-5', content: 'スティッキーセッションを理解する' },
      { id: 'lb-6', content: 'SSL終端を設定できる' },
      { id: 'lb-7', content: 'AWS ELB/ALB/NLBを使用できる' },
    ]
  },

  {
    id: 'kubernetes', name: 'Kubernetes', tier: 4, category: 'devops', description: 'コンテナのオーケストレーションシステム。複数のコンテナを管理し、スケーリング、ロードバランシング、自己修復を自動化する', icon: 'kubernetes', pointValue: 30, connections: ['helm', 'argocd', 'monitoring'],
    learningItems: [
      { id: 'k8s-1', content: 'Kubernetesアーキテクチャを理解する' },
      { id: 'k8s-2', content: 'Pod, Deployment, Serviceを作成できる' },
      { id: 'k8s-3', content: 'ConfigMap, Secretを使用できる' },
      { id: 'k8s-4', content: 'Ingressを設定できる' },
      { id: 'k8s-5', content: 'PersistentVolumeを設定できる' },
      { id: 'k8s-6', content: 'ResourceQuotaとLimitRangeを設定できる' },
      { id: 'k8s-7', content: 'HPA（水平オートスケーリング）を設定できる' },
      { id: 'k8s-8', content: 'kubectlを使いこなす' },
      { id: 'k8s-9', content: 'CKA/CKAD資格を取得する' },
    ]
  },
  // AWS スキル（分割）
  {
    id: 'aws-basics', name: 'AWS基礎', tier: 3, category: 'infrastructure', description: 'AWSの基本サービス。IAMによるアクセス管理、EC2によるコンピューティング、S3によるストレージ、VPCによるネットワーク構築を学ぶ', icon: 'aws', pointValue: 15, connections: ['aws-serverless', 'aws-data', 'aws-container'],
    learningItems: [
      { id: 'aws-b-1', content: 'AWSアカウントとリージョンを理解する' },
      { id: 'aws-b-2', content: 'IAMでユーザー・ロール・ポリシーを管理できる' },
      { id: 'aws-b-3', content: 'EC2インスタンスを作成・管理できる' },
      { id: 'aws-b-4', content: 'S3バケットを作成しオブジェクトを管理できる' },
      { id: 'aws-b-5', content: 'VPCでサブネット・ルートテーブルを設計できる' },
      { id: 'aws-b-6', content: 'セキュリティグループとNACLを設定できる' },
      { id: 'aws-b-7', content: 'CloudWatchで基本的な監視ができる' },
    ]
  },
  {
    id: 'aws-serverless', name: 'AWSサーバーレス', tier: 4, category: 'infrastructure', description: 'サーバー管理不要なAWSサービス群。Lambda、API Gateway、DynamoDB、Step Functionsでスケーラブルなアプリケーションを構築', icon: 'lambda', pointValue: 20, connections: ['terraform', 'security-infra'],
    learningItems: [
      { id: 'aws-sl-1', content: 'Lambda関数を作成・デプロイできる' },
      { id: 'aws-sl-2', content: 'API Gatewayでエンドポイントを作成できる' },
      { id: 'aws-sl-3', content: 'DynamoDBでテーブルを設計できる' },
      { id: 'aws-sl-4', content: 'Step Functionsでワークフローを構築できる' },
      { id: 'aws-sl-5', content: 'EventBridgeでイベント駆動設計ができる' },
      { id: 'aws-sl-6', content: 'SAM/Serverless Frameworkを使用できる' },
      { id: 'aws-sl-7', content: 'コールドスタート対策ができる' },
    ]
  },
  {
    id: 'aws-data', name: 'AWSデータ基盤', tier: 4, category: 'infrastructure', description: 'AWSのデータ関連サービス。RDS、Aurora、ElastiCache、Redshiftなどでデータの保存・処理・分析基盤を構築', icon: 'database', pointValue: 20, connections: ['terraform', 'security-infra'],
    learningItems: [
      { id: 'aws-d-1', content: 'RDSでデータベースを作成・管理できる' },
      { id: 'aws-d-2', content: 'Auroraの特徴と利点を理解する' },
      { id: 'aws-d-3', content: 'ElastiCacheでキャッシュ層を構築できる' },
      { id: 'aws-d-4', content: 'S3のストレージクラスを使い分けられる' },
      { id: 'aws-d-5', content: 'Redshiftでデータウェアハウスを構築できる' },
      { id: 'aws-d-6', content: 'バックアップとリストアを設定できる' },
      { id: 'aws-d-7', content: 'データ暗号化を設定できる' },
    ]
  },
  {
    id: 'aws-container', name: 'AWSコンテナ', tier: 5, category: 'infrastructure', description: 'AWSのコンテナサービス。ECS、EKS、Fargateでコンテナワークロードを本番運用し、ECRでイメージを管理する', icon: 'container', pointValue: 20, connections: ['security-infra'],
    learningItems: [
      { id: 'aws-c-1', content: 'ECSでタスクとサービスを定義できる' },
      { id: 'aws-c-2', content: 'Fargateでサーバーレスコンテナを運用できる' },
      { id: 'aws-c-3', content: 'EKSでKubernetesクラスターを構築できる' },
      { id: 'aws-c-4', content: 'ECRでイメージを管理できる' },
      { id: 'aws-c-5', content: 'App Runnerを使用できる' },
      { id: 'aws-c-6', content: 'オートスケーリングを設定できる' },
      { id: 'aws-c-7', content: 'AWS認定資格を取得する（SAA/SAP等）' },
    ]
  },
  // GCP スキル（分割）
  {
    id: 'gcp-basics', name: 'GCP基礎', tier: 3, category: 'infrastructure', description: 'Google Cloudの基本サービス。IAM、Compute Engine、Cloud Storage、VPCでクラウドインフラの基礎を学ぶ', icon: 'gcp', pointValue: 15, connections: ['gcp-advanced'],
    learningItems: [
      { id: 'gcp-b-1', content: 'プロジェクトとIAMを理解する' },
      { id: 'gcp-b-2', content: 'Compute Engineでインスタンスを作成できる' },
      { id: 'gcp-b-3', content: 'Cloud Storageを使用できる' },
      { id: 'gcp-b-4', content: 'VPCネットワークを設計できる' },
      { id: 'gcp-b-5', content: 'Cloud SQLを使用できる' },
      { id: 'gcp-b-6', content: 'Cloud Monitoringで監視できる' },
    ]
  },
  {
    id: 'gcp-advanced', name: 'GCP応用', tier: 4, category: 'infrastructure', description: 'Google Cloudの応用サービス。GKE、BigQuery、Cloud Functions、Cloud Runでモダンなアプリケーションを構築', icon: 'gcp', pointValue: 20, connections: ['terraform', 'security-infra'],
    learningItems: [
      { id: 'gcp-a-1', content: 'GKEでKubernetesを運用できる' },
      { id: 'gcp-a-2', content: 'Cloud Functionsを使用できる' },
      { id: 'gcp-a-3', content: 'Cloud Runでコンテナを運用できる' },
      { id: 'gcp-a-4', content: 'BigQueryでデータ分析ができる' },
      { id: 'gcp-a-5', content: 'Pub/Subでメッセージングができる' },
      { id: 'gcp-a-6', content: 'Cloud Buildでビルドパイプラインを構築できる' },
      { id: 'gcp-a-7', content: 'Google Cloud認定資格を取得する' },
    ]
  },
  // Azure スキル（分割）
  {
    id: 'azure-basics', name: 'Azure基礎', tier: 3, category: 'infrastructure', description: 'Microsoft Azureの基本サービス。Azure AD、Virtual Machines、Blob Storage、Virtual Networkでクラウド基盤を構築', icon: 'azure', pointValue: 15, connections: ['azure-advanced'],
    learningItems: [
      { id: 'azure-b-1', content: 'サブスクリプションとリソースグループを理解する' },
      { id: 'azure-b-2', content: 'Azure ADでID管理ができる' },
      { id: 'azure-b-3', content: 'Virtual Machinesを作成できる' },
      { id: 'azure-b-4', content: 'Blob Storageを使用できる' },
      { id: 'azure-b-5', content: 'Virtual Networkを設計できる' },
      { id: 'azure-b-6', content: 'Azure SQL Databaseを使用できる' },
    ]
  },
  {
    id: 'azure-advanced', name: 'Azure応用', tier: 4, category: 'infrastructure', description: 'Microsoft Azureの応用サービス。AKS、Azure Functions、Azure DevOps、Cosmos DBでエンタープライズアプリケーションを構築', icon: 'azure', pointValue: 20, connections: ['terraform', 'security-infra'],
    learningItems: [
      { id: 'azure-a-1', content: 'AKSでKubernetesを運用できる' },
      { id: 'azure-a-2', content: 'Azure Functionsを使用できる' },
      { id: 'azure-a-3', content: 'Azure DevOpsでパイプラインを構築できる' },
      { id: 'azure-a-4', content: 'Cosmos DBを使用できる' },
      { id: 'azure-a-5', content: 'App Serviceでアプリをデプロイできる' },
      { id: 'azure-a-6', content: 'Azure Container Appsを使用できる' },
      { id: 'azure-a-7', content: 'Azure認定資格を取得する（AZ-104等）' },
    ]
  },
  {
    id: 'ansible', name: 'Ansible', tier: 4, category: 'devops', description: 'エージェントレスの構成管理ツール。YAMLベースのPlaybookでサーバー設定やアプリケーションデプロイを自動化する', icon: 'ansible', pointValue: 20, connections: ['terraform'],
    learningItems: [
      { id: 'ans-1', content: 'Ansibleの基本概念を理解する' },
      { id: 'ans-2', content: 'インベントリを管理できる' },
      { id: 'ans-3', content: 'Playbookを作成できる' },
      { id: 'ans-4', content: 'ロールを作成・使用できる' },
      { id: 'ans-5', content: '変数と条件分岐を使用できる' },
      { id: 'ans-6', content: 'Ansible Vaultで機密情報を管理できる' },
      { id: 'ans-7', content: 'Ansible Galaxyを活用できる' },
      { id: 'ans-8', content: '冪等性を理解し実装できる' },
    ]
  },
  {
    id: 'vault', name: 'HashiCorp Vault', tier: 4, category: 'devops', description: 'シークレット管理とデータ保護のためのツール。APIキー、パスワード、証明書などの機密情報を安全に管理する', icon: 'vault', pointValue: 20, connections: ['terraform'],
    learningItems: [
      { id: 'vault-1', content: 'Vaultの基本概念を理解する' },
      { id: 'vault-2', content: 'シークレットエンジンを使用できる' },
      { id: 'vault-3', content: '認証メソッドを設定できる' },
      { id: 'vault-4', content: 'ポリシーでアクセス制御ができる' },
      { id: 'vault-5', content: '動的シークレットを使用できる' },
      { id: 'vault-6', content: 'KubernetesとVaultを連携できる' },
      { id: 'vault-7', content: 'シークレットのローテーションを設定できる' },
    ]
  },
  {
    id: 'service-mesh', name: 'Service Mesh', tier: 4, category: 'devops', description: 'Istio、Linkerdなどを使ったマイクロサービス間通信の管理。トラフィック制御、セキュリティ、可観測性を提供する', icon: 'mesh', pointValue: 20, connections: ['monitoring', 'argocd'],
    learningItems: [
      { id: 'mesh-1', content: 'Service Meshの概念を理解する' },
      { id: 'mesh-2', content: 'Istioをインストールできる' },
      { id: 'mesh-3', content: 'サイドカーパターンを理解する' },
      { id: 'mesh-4', content: 'トラフィック管理（VirtualService等）を設定できる' },
      { id: 'mesh-5', content: 'mTLSでサービス間通信を暗号化できる' },
      { id: 'mesh-6', content: 'サーキットブレーカーを設定できる' },
      { id: 'mesh-7', content: 'Kialiで可視化できる' },
      { id: 'mesh-8', content: 'カナリアデプロイを実装できる' },
    ]
  },

  {
    id: 'helm', name: 'Helm', tier: 5, category: 'devops', description: 'Kubernetesのパッケージマネージャー。Chartを使ってアプリケーションの定義、インストール、アップグレードを管理する', icon: 'helm', pointValue: 15, connections: [],
    learningItems: [
      { id: 'helm-1', content: 'Helmの概念を理解する' },
      { id: 'helm-2', content: 'Chartをインストール・アップグレードできる' },
      { id: 'helm-3', content: 'values.yamlでカスタマイズできる' },
      { id: 'helm-4', content: '独自Chartを作成できる' },
      { id: 'helm-5', content: 'テンプレート関数を使用できる' },
      { id: 'helm-6', content: 'Helmリポジトリを管理できる' },
      { id: 'helm-7', content: 'Chart依存関係を管理できる' },
    ]
  },
  {
    id: 'terraform', name: 'Terraform', tier: 5, category: 'devops', description: 'HashiCorp製のInfrastructure as Codeツール。HCL言語でクラウドリソースを宣言的に定義し、マルチクラウド環境を管理する', icon: 'terraform', pointValue: 25, connections: [],
    learningItems: [
      { id: 'tf-1', content: 'HCL構文を理解する' },
      { id: 'tf-2', content: 'リソースとデータソースを定義できる' },
      { id: 'tf-3', content: '変数と出力を使用できる' },
      { id: 'tf-4', content: 'モジュールを作成・使用できる' },
      { id: 'tf-5', content: 'ステート管理を理解する' },
      { id: 'tf-6', content: 'リモートバックエンドを設定できる' },
      { id: 'tf-7', content: 'Terraform Cloudを使用できる' },
      { id: 'tf-8', content: 'インポートとリファクタリングができる' },
      { id: 'tf-9', content: 'HashiCorp認定資格を取得する' },
    ]
  },
  {
    id: 'monitoring', name: '監視', tier: 5, category: 'devops', description: 'Prometheus、Grafana、Datadogなどを使ったシステム監視。メトリクス収集、アラート設定、ダッシュボード作成を行う', icon: 'monitoring', pointValue: 20, connections: [],
    learningItems: [
      { id: 'mon-1', content: '監視の種類（メトリクス、ログ、トレース）を理解する' },
      { id: 'mon-2', content: 'Prometheusを設定できる' },
      { id: 'mon-3', content: 'Grafanaでダッシュボードを作成できる' },
      { id: 'mon-4', content: 'アラートルールを設定できる' },
      { id: 'mon-5', content: 'ログ集約（ELK/Loki）を設定できる' },
      { id: 'mon-6', content: 'APM（Application Performance Monitoring）を導入できる' },
      { id: 'mon-7', content: 'SLI/SLO/SLAを定義できる' },
      { id: 'mon-8', content: 'オンコール体制を設計できる' },
    ]
  },
  {
    id: 'argocd', name: 'ArgoCD', tier: 5, category: 'devops', description: 'Kubernetes向けのGitOps CDツール。Gitリポジトリをソースとして、宣言的なアプリケーションデプロイを自動化する', icon: 'argocd', pointValue: 20, connections: ['sre'],
    learningItems: [
      { id: 'argo-1', content: 'GitOpsの概念を理解する' },
      { id: 'argo-2', content: 'ArgoCDをインストール・設定できる' },
      { id: 'argo-3', content: 'Applicationリソースを作成できる' },
      { id: 'argo-4', content: '同期ポリシーを設定できる' },
      { id: 'argo-5', content: 'Helm/Kustomizeと連携できる' },
      { id: 'argo-6', content: 'マルチクラスター管理ができる' },
      { id: 'argo-7', content: 'RBAC を設定できる' },
      { id: 'argo-8', content: 'App of Appsパターンを理解する' },
    ]
  },
  {
    id: 'sre', name: 'SRE', tier: 5, category: 'devops', description: 'Site Reliability Engineering。システムの信頼性、可用性、パフォーマンスを維持するための実践的アプローチとエンジニアリング文化', icon: 'sre', pointValue: 25, connections: [],
    learningItems: [
      { id: 'sre-1', content: 'SREの原則と文化を理解する' },
      { id: 'sre-2', content: 'SLI/SLO/SLAを定義・運用できる' },
      { id: 'sre-3', content: 'エラーバジェットを管理できる' },
      { id: 'sre-4', content: 'トイル（toil）を削減できる' },
      { id: 'sre-5', content: 'インシデント対応プロセスを設計できる' },
      { id: 'sre-6', content: 'ポストモーテムを実施できる' },
      { id: 'sre-7', content: 'カオスエンジニアリングを実践できる' },
      { id: 'sre-8', content: 'キャパシティプランニングができる' },
      { id: 'sre-9', content: 'オンコール体制を設計・運用できる' },
    ]
  },
  {
    id: 'security-infra', name: 'インフラセキュリティ', tier: 5, category: 'infrastructure', description: 'IAM/暗号化', icon: 'security', pointValue: 25, connections: [],
    learningItems: [
      { id: 'sec-inf-1', content: '最小権限の原則を適用できる' },
      { id: 'sec-inf-2', content: 'IAMポリシーを設計できる' },
      { id: 'sec-inf-3', content: 'シークレット管理（Vault等）ができる' },
      { id: 'sec-inf-4', content: '暗号化（転送中/保存時）を設定できる' },
      { id: 'sec-inf-5', content: 'ネットワークセキュリティ（SG, NACL）を設定できる' },
      { id: 'sec-inf-6', content: '監査ログを設定・分析できる' },
      { id: 'sec-inf-7', content: 'コンプライアンス要件を理解する' },
      { id: 'sec-inf-8', content: 'セキュリティスキャン（Trivy等）を実行できる' },
      { id: 'sec-inf-9', content: 'ゼロトラストアーキテクチャを理解する' },
    ]
  },
];

export const SKILLS: Skill[] = generateAllSkillsWithPositions(allSkillsData);

export const CATEGORY_NAMES: Record<string, string> = {
  frontend: 'フロントエンド',
  backend: 'バックエンド',
  infrastructure: 'インフラ',
  devops: 'DevOps',
};

export const getSkillsByCategory = (category: string) =>
  SKILLS.filter((skill) => skill.category === category);

export const getAllSkills = () => SKILLS;

export const getSkillById = (id: string) =>
  SKILLS.find((skill) => skill.id === id);

// マップ中心座標をエクスポート
export const MAP_CENTER = { x: CENTER_X, y: CENTER_Y };
