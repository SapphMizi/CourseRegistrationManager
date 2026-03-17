// src/app/page.tsx
"use client";

import * as React from "react";
import {
  useCourseState,
  TERM_ORDER,
  termIndex,
  type Term,
  type TimeCellId,
} from "@/lib/state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateCredits, getGraduationSummary } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { REQUIRED_CREDITS } from "@/lib/course-data";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function HomePage() {
  const {
    state: { courses, taken },
  } = useCourseState();

  const [includePlanned, setIncludePlanned] = React.useState(false);

  const total = courses.length;
  const general = courses.filter((c) => c.kind === "general").length;
  const specialized = courses.filter((c) => c.kind === "specialized").length;
  const international = courses.filter((c) => c.kind === "international").length;

  const { completed, planned } = calculateCredits(courses, taken);
  const graduation = getGraduationSummary(courses, taken, includePlanned);

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 px-6 py-4 backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight">Course Registration Manager</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          履修予定と取得単位をカテゴリ別に管理するダッシュボードです。
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span>単位表示モード:</span>
          <div className="flex items-center gap-2">
            <span className={!includePlanned ? "font-semibold text-foreground" : ""}>
              修得済のみ
            </span>
            <Switch
              checked={includePlanned}
              onCheckedChange={(v) => setIncludePlanned(!!v)}
            />
            <span className={includePlanned ? "font-semibold text-foreground" : ""}>
              修得済 + 予定
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-4 px-6 pt-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総講義数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">教養教育系</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {includePlanned
                ? completed.general + planned.general
                : completed.general}
            </div>
            <p className="mt-1 text-xs text-muted-foreground mb-2">
              教養教育系科目の修得済 + 予定単位数です。
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span>修得済 {completed.general}</span>
                <span className="text-[11px] text-muted-foreground">
                  予定 {planned.general} / 必要 {REQUIRED_CREDITS.general.total}
                </span>
              </div>
              <Progress
                value={Math.min(
                  ((includePlanned
                    ? completed.general + planned.general
                    : completed.general) /
                    REQUIRED_CREDITS.general.total) *
                    100,
                  100,
                )}
                className="h-1.5"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">専門教育系</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {includePlanned
                ? completed.specializedTotal + planned.specializedTotal
                : completed.specializedTotal}
            </div>
            <p className="mt-1 text-xs text-muted-foreground mb-3">
              修得済 + 予定の専門教育系科目の合計単位数です。
            </p>
            <div className="space-y-2 text-xs">
              {[
                {
                  label: "必修",
                  done: completed.specializedRequired,
                  plan: planned.specializedRequired,
                },
                {
                  label: "選択必修",
                  done: completed.specializedSemiRequired,
                  plan: planned.specializedSemiRequired,
                },
                {
                  label: "選択",
                  done: completed.specializedElective,
                  plan: planned.specializedElective,
                },
              ].map((row) => {
                const subtotal = includePlanned ? row.done + row.plan : row.done;
                const total = includePlanned
                  ? completed.specializedTotal + planned.specializedTotal || 1
                  : completed.specializedTotal || 1;
                const value = (subtotal / total) * 100;
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{row.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        修得済 {row.done} / 予定 {row.plan}
                      </span>
                    </div>
                    <Progress value={value} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">国際性涵養教育系</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {includePlanned
                ? completed.international + planned.international
                : completed.international}
            </div>
            <p className="mt-1 text-xs text-muted-foreground mb-2">
              国際性涵養教育系科目の修得済 + 予定単位数です。
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span>修得済 {completed.international}</span>
                <span className="text-[11px] text-muted-foreground">
                  予定 {planned.international} / 必要{" "}
                  {REQUIRED_CREDITS.international.total}
                </span>
              </div>
              <Progress
                value={Math.min(
                  ((includePlanned
                    ? completed.international + planned.international
                    : completed.international) /
                    REQUIRED_CREDITS.international.total) *
                    100,
                  100,
                )}
                className="h-1.5"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-1 flex-col gap-4 px-6 pb-6 md:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">講義一覧</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="all">
              <TabsList className="mt-2">
                <TabsTrigger value="all">すべて</TabsTrigger>
                <TabsTrigger value="general">教養</TabsTrigger>
                <TabsTrigger value="specialized">専門</TabsTrigger>
                <TabsTrigger value="international">国際</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-3">
                <CourseTable />
              </TabsContent>
              <TabsContent value="general" className="mt-3">
                <CourseTable kind="general" />
              </TabsContent>
              <TabsContent value="specialized" className="mt-3">
                <CourseTable kind="specialized" />
              </TabsContent>
              <TabsContent value="international" className="mt-3">
                <CourseTable kind="international" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <TimetableCard />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">卒業要件との比較</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">要件</TableHead>
                    <TableHead className="w-[120px] text-right">
                      必要単位
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      修得済単位
                    </TableHead>
                    <TableHead className="w-[80px] text-center">
                      達成
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>教養教育系科目をすべて取得</TableCell>
                    <TableCell className="text-right">
                      {graduation.general.required}
                    </TableCell>
                    <TableCell className="text-right">
                      {graduation.general.completed}
                    </TableCell>
                    <TableCell className="text-center">
                      {graduation.general.ok ? "達成" : "未達"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>国際性涵養教育系科目をすべて取得</TableCell>
                    <TableCell className="text-right">
                      {graduation.international.required}
                    </TableCell>
                    <TableCell className="text-right">
                      {graduation.international.completed}
                    </TableCell>
                    <TableCell className="text-center">
                      {graduation.international.ok ? "達成" : "未達"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      専門教育科目（必修）1〜3年時配当科目の全取得
                    </TableCell>
                    <TableCell className="text-right">
                      {graduation.specializedRequiredEarly.required}
                    </TableCell>
                    <TableCell className="text-right">
                      {graduation.specializedRequiredEarly.completed}
                    </TableCell>
                    <TableCell className="text-center">
                      {graduation.specializedRequiredEarly.ok ? "達成" : "未達"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>専門教育科目（選択必修）28単位以上</TableCell>
                    <TableCell className="text-right">
                      {graduation.specializedSelect.semiRequired.required}
                    </TableCell>
                    <TableCell className="text-right">
                      {graduation.specializedSelect.semiRequired.completed}
                    </TableCell>
                    <TableCell className="text-center">
                      {graduation.specializedSelect.semiRequired.ok
                        ? "達成"
                        : "未達"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      専門教育科目（選択必修・選択）合計38単位以上
                    </TableCell>
                    <TableCell className="text-right">
                      {graduation.specializedSelect.total.required}
                    </TableCell>
                    <TableCell className="text-right">
                      {graduation.specializedSelect.total.completed}
                    </TableCell>
                    <TableCell className="text-center">
                      {graduation.specializedSelect.total.ok ? "達成" : "未達"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

type CourseTableProps = {
  kind?: "general" | "specialized" | "international";
};

function CourseTable({ kind }: CourseTableProps) {
  const {
    state: { courses, taken },
    setStatus,
  } = useCourseState();

  const [query, setQuery] = React.useState("");

  const base = kind ? courses.filter((c) => c.kind === kind) : courses;
  const filtered = base.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const handleDragStart = (event: React.DragEvent<HTMLTableRowElement>, courseId: string) => {
    const status = taken[courseId]?.status ?? "not-taken";
    // 修得済の講義は時間割に追加できない
    if (status === "completed") {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/course-id", courseId);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
          placeholder="科目名・科目コードで検索"
          className="h-8 text-xs"
        />
        <span className="text-[11px] text-muted-foreground">
          件数: {filtered.length}
        </span>
      </div>
      <ScrollArea className="h-80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">カテゴリ</TableHead>
              <TableHead className="w-[100px]">専門区分</TableHead>
              <TableHead>科目名</TableHead>
              <TableHead className="w-[80px] text-right">単位</TableHead>
              <TableHead className="w-[120px]">状態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((course) => (
              <TableRow
                key={course.id}
                draggable
                onDragStart={(e) => handleDragStart(e, course.id)}
                className="cursor-move"
              >
                <TableCell>
                  <Badge variant="outline">
                    {course.kind === "general" && "教養"}
                    {course.kind === "specialized" && "専門"}
                    {course.kind === "international" && "国際"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {course.kind === "specialized" && course.specializedCategory ? (
                    <Badge
                      variant="secondary"
                      className={
                        course.specializedCategory === "required"
                          ? "bg-primary/10 text-primary"
                          : course.specializedCategory === "semiRequired"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {course.specializedCategory === "required" && "必修"}
                      {course.specializedCategory === "semiRequired" && "選択必修"}
                      {course.specializedCategory === "elective" && "選択"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell className="text-right">{course.credits}</TableCell>
                <TableCell>
                  <Select
                    value={taken[course.id]?.status ?? "not-taken"}
                    onValueChange={(value) =>
                      setStatus(course.id, value as "not-taken" | "planned" | "completed")
                    }
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-taken">未履修</SelectItem>
                      <SelectItem value="planned">予定</SelectItem>
                      <SelectItem value="completed">修得済</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </>
  );
}

function TimetableCard() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-base">時間割</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="mb-2 text-xs text-muted-foreground">
          講義一覧から行をドラッグして、時間割のセルにドロップすると履修予定として追加されます。
        </p>
        <TimetableGrid />
      </CardContent>
    </Card>
  );
}

const DAYS: { key: "mon" | "tue" | "wed" | "thu" | "fri"; label: string }[] = [
  { key: "mon", label: "月" },
  { key: "tue", label: "火" },
  { key: "wed", label: "水" },
  { key: "thu", label: "木" },
  { key: "fri", label: "金" },
];

const PERIODS: number[] = [1, 2, 3, 4, 5, 6];

const TERMS = [
  { key: "spring", label: "春学期", color: "bg-pink-100/60 dark:bg-pink-900/40" },
  { key: "summer", label: "夏学期", color: "bg-lime-100/60 dark:bg-lime-900/40" },
  { key: "autumn", label: "秋学期", color: "bg-amber-100/60 dark:bg-amber-900/40" },
  { key: "winter", label: "冬学期", color: "bg-cyan-100/60 dark:bg-cyan-900/40" },
] as const;

function TimetableGrid() {
  const {
    state: { timetable, courses },
    addEntry,
    removeEntry,
    updateEntryTerms,
  } = useCourseState();

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    dayKey: string,
    period: number,
    termKey: Term,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const resizeData = event.dataTransfer.getData("text/resize");
    if (resizeData) {
      const [type, srcCellId, courseId] = resizeData.split("|");
      const targetCellId = `${dayKey}-${period}`;
      if (srcCellId !== targetCellId) return;

      const entry = timetable.entries.find(
        (e) => e.cellId === srcCellId && e.courseId === courseId,
      );
      if (!entry) return;

      if (type === "start") {
        updateEntryTerms(
          srcCellId as TimeCellId,
          courseId,
          termKey,
          entry.endTerm,
        );
      } else {
        updateEntryTerms(
          srcCellId as TimeCellId,
          courseId,
          entry.startTerm,
          termKey,
        );
      }
      return;
    }

    const courseId = event.dataTransfer.getData("text/course-id");
    if (!courseId) return;
    const cellId = `${dayKey}-${period}` as TimeCellId;
    addEntry(cellId, courseId, termKey);
  };

  const handleResizeDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    type: "start" | "end",
    cellId: string,
    courseId: string,
  ) => {
    event.stopPropagation();
    event.dataTransfer.setData(
      "text/resize",
      `${type}|${cellId}|${courseId}`,
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] rounded-md border">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(5,minmax(0,1fr))] border-b bg-muted/60 text-xs font-medium">
          <div className="flex items-center justify-center border-r px-2 py-1">
            時限
          </div>
          {DAYS.map((d) => (
            <div
              key={d.key}
              className="flex items-center justify-center border-r px-2 py-1 last:border-r-0"
            >
              {d.label}
            </div>
          ))}
        </div>

        {/* Term sub-header row */}
        <div className="grid grid-cols-[60px_repeat(5,minmax(0,1fr))] border-b bg-muted/30 text-[9px] text-muted-foreground">
          <div className="border-r" />
          {DAYS.map((d) => (
            <div
              key={d.key}
              className="grid grid-cols-4 border-r last:border-r-0"
            >
              {TERMS.map((t) => (
                <div
                  key={t.key}
                  className={`py-0.5 text-center ${t.color}`}
                >
                  {t.label.charAt(0)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Period rows */}
        {PERIODS.map((p) => (
          <div
            key={p}
            className="grid grid-cols-[60px_repeat(5,minmax(0,1fr))] border-b last:border-b-0 text-xs"
          >
            <div className="flex items-center justify-center border-r px-2 py-2">
              {p}限
            </div>
            {DAYS.map((d) => {
              const cellId = `${d.key}-${p}` as TimeCellId;
              const cellEntries = timetable.entries.filter(
                (e) => e.cellId === cellId,
              );
              return (
                <div
                  key={cellId}
                  className="group relative border-r last:border-r-0"
                  style={{ minHeight: "96px" }}
                >
                  {/* Term lane backgrounds & drop targets */}
                  <div className="flex h-full">
                    {TERMS.map((term, tIdx) => {
                      const isOccupied = cellEntries.some((e) => {
                        const si = termIndex(e.startTerm);
                        const ei = termIndex(e.endTerm);
                        return tIdx >= si && tIdx <= ei;
                      });
                      return (
                        <div
                          key={term.key}
                          className={`flex flex-1 items-center justify-center border-r last:border-r-0 ${term.color}`}
                          onDragOver={handleDragOver}
                          onDrop={(e) =>
                            handleDrop(e, d.key, p, term.key as Term)
                          }
                        >
                          {!isOccupied && (
                            <span className="select-none text-[9px] text-muted-foreground/40">
                              {term.label.charAt(0)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Course card overlays */}
                  {cellEntries.map((entry, entryIdx) => {
                    const course = courses.find(
                      (c) => c.id === entry.courseId,
                    );
                    if (!course) return null;
                    const si = termIndex(entry.startTerm);
                    const ei = termIndex(entry.endTerm);
                    const leftPct = (si / 4) * 100;
                    const widthPct = ((ei - si + 1) / 4) * 100;
                    return (
                      <div
                        key={entry.courseId}
                        className="pointer-events-none absolute"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: `${2 + entryIdx * 32}px`,
                          bottom: "2px",
                        }}
                      >
                        <div className="flex h-full items-stretch">
                          {/* Left resize handle (adjusts startTerm) */}
                          <div
                            draggable
                            onDragStart={(e) =>
                              handleResizeDragStart(
                                e,
                                "start",
                                cellId,
                                entry.courseId,
                              )
                            }
                            className="pointer-events-auto z-10 w-1.5 flex-shrink-0 cursor-ew-resize rounded-l bg-primary/30 opacity-0 transition-opacity group-hover:opacity-100"
                          />
                          {/* Card body */}
                          <div className="pointer-events-none relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden border-y border-primary/30 bg-primary/10 px-1 text-[9px] leading-tight shadow-sm">
                            <span className="w-full truncate text-center font-medium">
                              {course.name}
                            </span>
                            <span className="text-[8px] text-muted-foreground">
                              {course.credits}単位
                            </span>
                            {/* Delete button */}
                            <button
                              type="button"
                              aria-label="このセルから講義を削除"
                              className="pointer-events-auto absolute -right-0.5 -top-0.5 z-20 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted text-[9px] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/80"
                              onClick={() =>
                                removeEntry(cellId, entry.courseId)
                              }
                            >
                              ×
                            </button>
                          </div>
                          {/* Right resize handle (adjusts endTerm) */}
                          <div
                            draggable
                            onDragStart={(e) =>
                              handleResizeDragStart(
                                e,
                                "end",
                                cellId,
                                entry.courseId,
                              )
                            }
                            className="pointer-events-auto z-10 w-1.5 flex-shrink-0 cursor-ew-resize rounded-r bg-primary/30 opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}