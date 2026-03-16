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

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">時間割（準備中）</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full items-center justify-center text-sm text-muted-foreground">
            ドラッグ＆ドロップ対応の時間割表をここに実装します。
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
    state: { courses },
  } = useCourseState();

  const filtered = kind ? courses.filter((c) => c.kind === kind) : courses;

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
            <TableRow key={course.id}>
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