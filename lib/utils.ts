import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Course, CreditSummary } from "./course-data";
import type { TakenCourseState, Timetable } from "./state";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function derivePlannedFromTimetable(timetable: Timetable): Set<string> {
  const set = new Set<string>();
  for (const entry of timetable.entries) {
    set.add(entry.courseId);
  }
  return set;
}

export function calculateCredits(
  courses: Course[],
  taken: Record<string, TakenCourseState>,
): {
  completed: CreditSummary;
  planned: CreditSummary;
} {
  const initial: CreditSummary = {
    general: 0,
    specializedRequired: 0,
    specializedSemiRequired: 0,
    specializedElective: 0,
    specializedTotal: 0,
    international: 0,
  };

  const completed = { ...initial };
  const planned = { ...initial };

  const getBuckets = (course: Course) => {
    if (course.kind === "general") return ["general"] as const;
    if (course.kind === "international") return ["international"] as const;
    if (course.kind === "specialized") {
      const buckets: (keyof CreditSummary)[] = ["specializedTotal"];
      if (course.specializedCategory === "required") {
        buckets.push("specializedRequired");
      } else if (course.specializedCategory === "semiRequired") {
        buckets.push("specializedSemiRequired");
      } else if (course.specializedCategory === "elective") {
        buckets.push("specializedElective");
      }
      return buckets as (keyof CreditSummary)[];
    }
    return [] as (keyof CreditSummary)[];
  };

  for (const course of courses) {
    const state = taken[course.id];
    const buckets = getBuckets(course);

    if (state?.status === "completed") {
      for (const b of buckets) {
        // @ts-ignore
        completed[b] += course.credits;
      }
    } else if (state?.status === "planned") {
      for (const b of buckets) {
        // @ts-ignore
        planned[b] += course.credits;
      }
    }
  }

  return { completed, planned };
}
