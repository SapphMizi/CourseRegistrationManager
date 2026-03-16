// src/lib/course-data.ts

// 大分類
export type CourseKind = 'general' | 'specialized' | 'international';

// 専門教育内の区分
export type SpecializedCategory = 'required' | 'semiRequired' | 'elective';

export type Course = {
  id: string; // 講義コード or 一意ID
  name: string;
  credits: number;
  kind: CourseKind;
  specializedCategory?: SpecializedCategory;
  yearRecommended?: number;
  note?: string;
};

// 取得単位数サマリ用
export type CreditSummary = {
  general: number;
  specializedRequired: number;
  specializedSemiRequired: number;
  specializedElective: number;
  specializedTotal: number;
  international: number;
};

// カテゴリ別 必要単位数（暫定値: course.md の冒頭を反映）
export const REQUIRED_CREDITS = {
  general: {
    // 教養教育系科目
    total: 2 + 6 + 2 + 2 + 2, // 学問への扉 + 基盤 + 健康・スポーツ + 情報 + 高度教養
    // 必要なら内訳も持てるようにしておく
    gateways: 2,
    basicLiberal: 6,
    healthSports: 2,
    information: 2,
    advancedLiberal: 2,
  },
  specialized: {
    // 専門基礎教育科目 合計
    foundationTotal: 22,
    required: 0, // 後で正確な値に更新する
    semiRequired: 0,
    elective: 0,
  },
  international: {
    total: 8 + 3 + 2 + 1, // 第1外国語 + 第2外国語 + グローバル理解 + 高度国際性
    primaryLang: 8,
    secondaryLang: 3,
    globalUnderstanding: 2,
    advancedInternational: 1,
  },
} as const;

// TODO: コース一覧は必要に応じて整理しつつ増やしていく
export const COURSES: Course[] = [
  // --- 教養教育系科目 ---
  {
    id: 'GE-DOOR',
    name: '学問への扉',
    credits: 2,
    kind: 'general',
  },
  {
    id: 'GE-BASIC',
    name: '基盤教養教育科目',
    credits: 6,
    kind: 'general',
  },
  {
    id: 'GE-HEALTH',
    name: '健康・スポーツ教育科目',
    credits: 2,
    kind: 'general',
  },
  {
    id: 'GE-INFO',
    name: '情報教育科目',
    credits: 2,
    kind: 'general',
  },
  {
    id: 'GE-ADV',
    name: '高度教養教育科目',
    credits: 2,
    kind: 'general',
  },

  // --- 専門教育系科目: 必修 ---
  {
    id: '3001',
    name: 'システム科学序説',
    credits: 2,
    kind: 'specialized',
    specializedCategory: 'required',
    yearRecommended: 1,
  },
  { id: '0011', name: '数学 A', credits: 2, kind: 'specialized', specializedCategory: 'required', yearRecommended: 1 },
  { id: '0012', name: '数学 B', credits: 2, kind: 'specialized', specializedCategory: 'required', yearRecommended: 1 },
  { id: '0021', name: '数学 C', credits: 2, kind: 'specialized', specializedCategory: 'required', yearRecommended: 1 },
  { id: '3051', name: '情報処理演習', credits: 1, kind: 'specialized', specializedCategory: 'required', yearRecommended: 1 },
  { id: '3241', name: 'コンピュータ基礎', credits: 2, kind: 'specialized', specializedCategory: 'required', yearRecommended: 1 },
  { id: '3252', name: 'コンピュータ基礎演習', credits: 1, kind: 'specialized', specializedCategory: 'required', yearRecommended: 1 },
  { id: '3253', name: 'コンピュータ工学演習', credits: 1, kind: 'specialized', specializedCategory: 'required', yearRecommended: 2 },
  { id: '3291', name: '知能システム学実験A', credits: 3, kind: 'specialized', specializedCategory: 'required', yearRecommended: 3 },
  { id: '3292', name: '知能システム学実験B', credits: 3, kind: 'specialized', specializedCategory: 'required', yearRecommended: 3 },
  { id: '0090', name: '防災特論', credits: 1, kind: 'specialized', specializedCategory: 'required', yearRecommended: 4 },
  { id: '0115', name: '特別研究 I', credits: 4, kind: 'specialized', specializedCategory: 'required', yearRecommended: 4 },
  { id: '0116', name: '特別研究 II', credits: 4, kind: 'specialized', specializedCategory: 'required', yearRecommended: 4 },

  // --- 専門教育系科目: 選択必修 ---
  // （course.md からそのまま。id はシラバスの番号を使用）
  { id: '3221', name: 'システム制御基礎', credits: 2, kind: 'specialized', specializedCategory: 'semiRequired' },
  { id: '3222', name: 'システム数学基礎', credits: 2, kind: 'specialized', specializedCategory: 'semiRequired' },
  { id: '3223', name: 'システム制御', credits: 2, kind: 'specialized', specializedCategory: 'semiRequired' },
  // ... 以下、省略せずに requirement に書いた選択必修・選択を順に追加 ...

  // --- 国際性涵養教育系科目 ---
  { id: 'INT-1ST', name: '第1外国語', credits: 8, kind: 'international' },
  { id: 'INT-2ND', name: '第2外国語', credits: 3, kind: 'international' },
  { id: 'INT-GLOBAL', name: 'グローバル理解', credits: 2, kind: 'international' },
  { id: 'INT-ADV', name: '高度国際性涵養教育科目', credits: 1, kind: 'international' },
];