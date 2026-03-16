// src/app/page.tsx
import { COURSES } from '@/lib/course-data';

export default function HomePage() {
  const count = COURSES.length;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Course Registration Manager</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        登録されている講義数: {count}
      </p>
    </main>
  );
}