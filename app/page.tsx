// src/app/page.tsx
"use client";

import { useCourseState } from "@/lib/state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const {
    state: { courses },
  } = useCourseState();

  const total = courses.length;
  const general = courses.filter((c) => c.kind === "general").length;
  const specialized = courses.filter((c) => c.kind === "specialized").length;
  const international = courses.filter((c) => c.kind === "international").length;

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-background p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Course Registration Manager</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          履修予定と取得単位をカテゴリ別に管理するダッシュボードです。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
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
            <div className="text-2xl font-bold">{general}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">専門教育系</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specialized}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">国際性涵養教育系</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{international}</div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-1 flex-col gap-4 md:flex-row">
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
    </main>
  );
}

type CourseTableProps = {
  kind?: "general" | "specialized" | "international";
};

function CourseTable({ kind }: CourseTableProps) {
  const {
    state: { courses },
  } = useCourseState();

  const filtered = kind ? courses.filter((c) => c.kind === kind) : courses;

  const handleDragStart = (event: React.DragEvent<HTMLTableRowElement>, courseId: string) => {
    event.dataTransfer.setData("text/course-id", courseId);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <ScrollArea className="h-80">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">カテゴリ</TableHead>
            <TableHead>科目名</TableHead>
            <TableHead className="w-[80px] text-right">単位</TableHead>
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
              <TableCell>{course.name}</TableCell>
              <TableCell className="text-right">{course.credits}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
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

function TimetableGrid() {
  const {
    state: { timetable, courses },
    addEntry,
    removeEntry,
  } = useCourseState();

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, dayKey: string, period: number) => {
    event.preventDefault();
    const courseId = event.dataTransfer.getData("text/course-id");
    if (!courseId) return;
    const cellId = `${dayKey}-${period}` as const;
    addEntry(cellId, courseId);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] rounded-md border">
        <div className="grid grid-cols-[60px_repeat(5,minmax(0,1fr))] border-b bg-muted/60 text-xs font-medium">
          <div className="flex items-center justify-center border-r px-2 py-1">時限</div>
          {DAYS.map((d) => (
            <div key={d.key} className="flex items-center justify-center border-r px-2 py-1 last:border-r-0">
              {d.label}
            </div>
          ))}
        </div>
        {PERIODS.map((p) => (
          <div
            key={p}
            className="grid grid-cols-[60px_repeat(5,minmax(0,1fr))] border-b last:border-b-0 text-xs"
          >
            <div className="flex items-center justify-center border-r px-2 py-2">{p}限</div>
            {DAYS.map((d) => {
              const cellId = `${d.key}-${p}` as const;
              const entries = timetable.entries.filter((e) => e.cellId === cellId);
              return (
                <div
                  key={cellId}
                  className="min-h-[56px] border-r px-1 py-1 last:border-r-0"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, d.key, p)}
                >
                  {entries.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-[10px] text-muted-foreground">
                      ドロップ
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {entries.map((entry) => {
                        const course = courses.find((c) => c.id === entry.courseId);
                        if (!course) return null;
                        return (
                          <div
                            key={`${entry.courseId}-${entry.cellId}`}
                            className="group flex w-full items-center justify-between gap-1 rounded-sm bg-primary/5 px-1 py-0.5 text-[11px] hover:bg-primary/10"
                          >
                            <span className="truncate">{course.name}</span>
                            <button
                              type="button"
                              aria-label="このセルから講義を削除"
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/80"
                              onClick={() => removeEntry(cellId, entry.courseId)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}