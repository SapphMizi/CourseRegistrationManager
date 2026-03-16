## アプリ概要

Next.js と shadcn/ui を用いて、4 年間で履修可能な講義を一覧化し、  
**教養教育系科目 / 専門教育系科目 / 国際性涵養教育系科目** および  
**（専門教育内の）必修 / 選択必修 / 選択** ごとに取得単位数を集計・表示する Web アプリを作成する。

## 想定技術スタック

- **フロントエンドフレームワーク**: Next.js (App Router, TypeScript)
- **UI コンポーネント**: shadcn/ui
- **スタイリング**: Tailwind CSS（shadcn/ui の前提）
- **状態管理**: React Hooks（`useState`, `useReducer`, `useContext`）を基本とし、必要なら `zustand` 等を追加検討
- **データ永続化（初期段階）**: `localStorage` に保存（ブラウザごとの個人用）
- **データ永続化（将来案）**: Supabase / PlanetScale などの BaaS と Next.js Route Handlers を用いた API 化

## ドメインモデル設計

- **CourseKind（大分類）**
  - `general`（教養教育系科目）
  - `specialized`（専門教育系科目）
  - `international`（国際性涵養教育系科目）

- **SpecializedCategory（専門教育内の区分）**
  - `required`（必修科目）
  - `semiRequired`（選択必修科目）
  - `elective`（選択科目）
  - ※教養・国際性は `null` または `undefined`

- **Course エンティティ**
  - `id: string` 講義コード（例: `3001`）またはユニーク ID
  - `name: string` 授業科目名（例: `システム科学序説`）
  - `credits: number` 単位数
  - `kind: CourseKind`
  - `specializedCategory?: SpecializedCategory`
  - `yearRecommended?: number` 推奨年次（1〜4。表の情報から設定できるもの）
  - `note?: string` 備考（PBL などの説明用）

- **TakenCourseState**
  - `courseId: string`
  - `status: 'not-taken' | 'planned' | 'completed'`
  - `year?: number` 実際に履修した（または予定の）学年
  - `semester?: 'spring' | 'summer' | 'fall' | 'winter'`（必要なら）

- **TimeSlot / Timetable（時間割関連）**
  - `DayOfWeek` 型: `'mon' | 'tue' | 'wed' | 'thu' | 'fri'`
  - `Period` 型: 1〜6 限など整数
  - `TimeCellId` 型: `\`\${day}-\${period}\`` のようなユニーク ID
  - `TimetableEntry`:
    - `cellId: TimeCellId`
    - `courseId: string`
  - `Timetable`:
    - `entries: TimetableEntry[]`
  - 単位数はあくまで `Course` に紐づき、時間割上で同じ講義が複数セルに配置されていても **1 つの講義として 1 回だけカウント** する。

## 機能要件

- **講義一覧表示**
  - `course.md` を元に定義した静的データから講義一覧を生成。
  - 大分類（教養 / 専門 / 国際）ごと、専門教育内ではさらに必修 / 選択必修 / 選択ごとにセクション分けして表示。
  - 各講義行に「履修状態トグル（未 / 予定 / 修得済）」を配置。

- **単位数集計**
  - 現在の `TakenCourseState` に基づき、以下の分類で **修得済（`completed`）単位数** をリアルタイム集計。
    - 教養教育系科目 合計
    - 専門教育系科目
      - 必修
      - 選択必修
      - 選択
      - 専門教育合計
    - 国際性涵養教育系科目 合計
  - 必要に応じて、「予定（`planned`）単位数」も別集計して表示。

- **時間割表作成（ドラッグ＆ドロップ）**
  - 月〜金 × 時限（例: 1〜6 限）のグリッド形式の時間割表を表示。
  - 講義一覧側の各講義行を **ドラッグ＆ドロップ** で時間割のセルに配置できる。
    - ドロップしたタイミングで、その講義は `TakenCourseState.status = 'planned'` として扱う。
  - 同一講義を複数セルに配置可能（週 2 回など）。
    - `Timetable.entries` にはセルごとのエントリを複数追加するが、
      - 単位数集計時は `courseId` ベースで重複排除して 1 講義としてカウントする。
  - 既に同じ講義が別セルに存在する場合でも、追加セルは **同じ講義に紐づく別の開講回** として扱う（独立した講義とは見なさない）。
  - セル上の講義はクリックまたはコンテキストメニューで削除できる。
    - その講義に紐づく全セルを削除した場合、必要に応じて `status` を `'not-taken'` に戻す（挙動は後で調整可能）。

- **時間割と単位管理の連携**
  - `planned` 状態の判定には時間割を利用する:
    - ある `courseId` に対して 1 つ以上の `TimetableEntry` がある場合、その講義は自動的に `planned` と見なす。
  - 「履修予定」単位数は、「時間割上に少なくとも 1 回置かれている講義」を集合として集計する。
  - 「修得済」単位数は、別途 `status = 'completed'` に基づき集計し、時間割とは独立して管理。

- **卒業要件との比較（第 1 段階）**
  - `course.md` に記載されている「カテゴリ別必要単位数」を静的定数として定義。
  - 各カテゴリについて「取得済み / 必要」の形でバーまたは数値で表示。
  - 足りない場合は数値を赤色などで強調。

- **データ保存**
  - ユーザーの履修状態は `localStorage` に保存し、ブラウザ再訪時に自動復元。
  - 保存キー例: `crm_taken_courses_v1`

- **検索・フィルタ**
  - 授業名・コードで検索できるテキストボックス。
  - 「未履修のみ」「予定のみ」「修得済のみ」といった状態フィルタ。
  - 年次フィルタ（1〜4 年）。

- **レスポンシブ対応**
  - PC では表形式、スマホではアコーディオン / カード形式で見やすく表示。

## 画面構成方針

- **レイアウト**
  - Next.js App Router で `/` をダッシュボード画面とする。
  - 将来、詳細設定や科目編集などのために `/settings`, `/courses` などのルートを追加できる構成にする。

- **メインダッシュボード**
  - 上部: カテゴリ別単位サマリカード（shadcn/ui の `Card` コンポーネント）
    - 各カードに「取得済み / 必要」単位数とプログレスバー。
  - 中央: 講義一覧タブ
    - タブ（`Tabs` コンポーネント）で「教養」「専門」「国際」を切替。
    - 各タブ内で Accordion もしくはセクション見出しで「必修 / 選択必修 / 選択」を分割。
    - 行ごとにチェックボックスやセレクト（`Select` コンポーネント）で履修状態を変更可能。
  - 右側 or 下部: 時間割表（ドラッグ＆ドロップ対応の 5×N グリッド）
    - PC の場合は左右 2 カラム（左: 講義一覧 / 右: 時間割表）、モバイルではタブ切り替えで表示。
  - 下部: 集計の詳細（表形式でカテゴリ別単位数一覧）。

## shadcn/ui コンポーネント利用方針

- `Button`, `Card`, `Tabs`, `Table`, `Badge`, `Select`, `Checkbox`, `Progress`, `Accordion`, `ScrollArea` などを中心に使用。
- フォームや状態変更には `Form`, `Input`, `Switch` などを必要に応じて追加。
- テーマはデフォルトを用いつつ、Next.js の `ThemeProvider` でライト / ダーク切替に対応できるようにする（初期実装では固定でもよい）。
 - ドラッグ＆ドロップには `@dnd-kit` などの軽量ライブラリを採用し、セルと講義行をドラッガブル / ドロッパブルなコンポーネントとして実装する。

## データ定義と取り込み方針

- `course.md` の内容をベースに、TypeScript の定数配列 `courses` を作成する。
  - 例: `courseData.ts` に `const COURSES: Course[] = [...]` として定義。
  - `kind` と `specializedCategory` は手動でマッピング。
  - 必要単位数も `REQUIRED_CREDITS` のような定数オブジェクトとして定義。
- 初期段階では Markdown を直接パースせず、メンテナンスしやすいよう TypeScript 側の定数を「正」として扱う。

## 状態管理・ロジック方針

- `CourseContext`（React Context）を導入してアプリ全体で講義状態を共有。
  - `courses: Course[]`
  - `takenStates: Record<string, TakenCourseState>`
  - `setStatus(courseId, status)` などの更新関数。
  - `timetable: Timetable`
  - `addEntry(cellId, courseId)` / `removeEntry(cellId, courseId)` など時間割編集用の関数。
- 集計処理は純粋関数としてユーティリティに切り出す。
  - 例: `calculateCredits(takenStates, courses): CreditSummary`
  - 時間割から `planned` 集合を導出する関数:
    - 例: `derivePlannedCoursesFromTimetable(timetable): Set<string>`
  - 単位数変更ロジックと UI を分離し、テストしやすくする。

## 非機能要件

- **パフォーマンス**
  - クライアントサイドのみで完結するため、SSR は必須ではないが、Next.js のデフォルト機能を活かして適宜 `use client` を付ける。
  - 受講科目数は多くても数百件程度なので、単純な配列操作で十分。

- **アクセシビリティ**
  - ボタンやタブに適切なラベル（`aria-label`）を設定。
  - 色だけに依存しない形（数値やアイコン）で達成度を示す。

- **拡張性**
  - 将来的に他学科・他年度のテーブルを追加できるよう、Course モデルに `curriculumId` などを拡張できる余地を残す。

## 今後の実装ステップ（概略）

1. Next.js + shadcn/ui プロジェクトのセットアップ。
2. `courseData.ts` に `Course` 型と `COURSES` / `REQUIRED_CREDITS` を定義。
3. `CourseContext` と `localStorage` 連携ロジックの実装。
4. ダッシュボード画面の UI 実装（サマリカード + 講義一覧タブ）。
5. 時間割表 UI とドラッグ＆ドロップ処理の実装。
6. 時間割と `TakenCourseState` の連携ロジック・集計ロジックの実装。
7. 検索・フィルタ機能の追加。
8. レスポンシブ調整と UI 微調整。

## トラブルシューティング・エラー履歴

- **2026-03-16: `.ts` ファイル内の JSX によるパースエラー**
  - 現象:
    - `./lib/state.ts:166:34 Parsing ecmascript source code failed`  
      （`return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;` 行でエラー）
  - 原因:
    - Next.js 16（Turbopack）では、拡張子が `.ts` のファイルは **純粋な TypeScript（非 JSX）** として扱われる。  
      JSX を含めたため、パーサが `<>` を正しく解釈できずコンパイルエラーになった。
  - 対策:
    - JSX を含む React コンポーネント／フックがあるファイルは **必ず `.tsx` 拡張子** を使う。
    - `lib/state.ts` を `lib/state.tsx` にリネームし、インポート元（`app/layout.tsx` など）はパスを `@/lib/state` のままにして拡張子解決に任せる。
  - 再発防止ルール:
    - Context Provider やコンポーネントを定義するファイルを追加するときは、最初から `.tsx` で作成する。
    - エラーに `Parsing ecmascript source code failed` が出た場合は、**拡張子と JSX の有無を最初に確認**すること。

