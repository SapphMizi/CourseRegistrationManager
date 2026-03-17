import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Course, CreditSummary } from "./course-data";
import { REQUIRED_CREDITS } from "./course-data";
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

export function getGraduationSummary(
  courses: Course[],
  taken: Record<string, TakenCourseState>,
  includePlanned: boolean,
) {
  const { completed, planned } = calculateCredits(courses, taken);

  // 教養・国際は必要単位数 = 含まれる全科目の合計なので REQUIRED_CREDITS をそのまま使う
  const generalRequired = REQUIRED_CREDITS.general.total;
  const internationalRequired = REQUIRED_CREDITS.international.total;

  const generalCompletedEffective =
    completed.general + (includePlanned ? planned.general : 0);
  const internationalCompletedEffective =
    completed.international + (includePlanned ? planned.international : 0);

  // 専門必修（1〜3 年次配当）
  const specRequiredEarly = courses.filter(
    (c) =>
      c.kind === "specialized" &&
      c.specializedCategory === "required" &&
      (c.yearRecommended ?? 0) >= 1 &&
      (c.yearRecommended ?? 0) <= 3,
  );
  const specRequiredEarlyRequired = specRequiredEarly.reduce(
    (sum, c) => sum + c.credits,
    0,
  );
  const specRequiredEarlyCompleted = specRequiredEarly.reduce((sum, c) => {
    const status = taken[c.id]?.status;
    if (status === "completed") return sum + c.credits;
    if (includePlanned && status === "planned") return sum + c.credits;
    return sum;
  }, 0);

  // 専門選択系（選択必修 + 選択）
  const semiRequiredCompleted =
    completed.specializedSemiRequired +
    (includePlanned ? planned.specializedSemiRequired : 0);
  const electiveCompleted =
    completed.specializedElective +
    (includePlanned ? planned.specializedElective : 0);
  const selectTotalCompleted = semiRequiredCompleted + electiveCompleted;

  return {
    general: {
      required: generalRequired,
      completed: generalCompletedEffective,
      ok: generalCompletedEffective >= generalRequired,
    },
    international: {
      required: internationalRequired,
      completed: internationalCompletedEffective,
      ok: internationalCompletedEffective >= internationalRequired,
    },
    specializedRequiredEarly: {
      required: specRequiredEarlyRequired,
      completed: specRequiredEarlyCompleted,
      ok: specRequiredEarlyCompleted >= specRequiredEarlyRequired,
    },
    specializedSelect: {
      semiRequired: {
        required: 28,
        completed: semiRequiredCompleted,
        ok: semiRequiredCompleted >= 28,
      },
      total: {
        required: 38,
        completed: selectTotalCompleted,
        ok: selectTotalCompleted >= 38,
      },
    },
  };
}
