"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Course } from "./course-data";
import { COURSES } from "./course-data";

export type TakenStatus = "not-taken" | "planned" | "completed";

export type TakenCourseState = {
  courseId: string;
  status: TakenStatus;
  year?: number;
  semester?: "spring" | "summer" | "fall" | "winter";
};

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri";

export type Period = 1 | 2 | 3 | 4 | 5 | 6;

export type TimeCellId = `${DayOfWeek}-${Period}`;

export type Term = "spring" | "summer" | "autumn" | "winter";

export const TERM_ORDER: Term[] = ["spring", "summer", "autumn", "winter"];

export function termIndex(t: Term): number {
  return TERM_ORDER.indexOf(t);
}

export type TimetableEntry = {
  cellId: TimeCellId;
  courseId: string;
  startTerm: Term;
  endTerm: Term;
};

export type Timetable = {
  entries: TimetableEntry[];
};

export type CourseState = {
  courses: Course[];
  taken: Record<string, TakenCourseState>;
  timetable: Timetable;
};

type CourseContextValue = {
  state: CourseState;
  setStatus: (courseId: string, status: TakenStatus) => void;
  addEntry: (cellId: TimeCellId, courseId: string, term: Term) => void;
  removeEntry: (cellId: TimeCellId, courseId: string) => void;
  updateEntryTerms: (
    cellId: TimeCellId,
    courseId: string,
    startTerm: Term,
    endTerm: Term,
  ) => void;
};

const STORAGE_KEY = "crm_course_state_v1";

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

function buildInitialState(): CourseState {
  const courses = COURSES;

  const taken: Record<string, TakenCourseState> = {};
  for (const c of courses) {
    taken[c.id] = {
      courseId: c.id,
      status: "not-taken",
    };
  }

  return {
    courses,
    taken,
    timetable: { entries: [] },
  };
}

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CourseState>(() => buildInitialState());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CourseState;
      setState((prev) => ({
        ...prev,
        taken: parsed.taken ?? prev.taken,
        timetable: parsed.timetable ?? prev.timetable,
      }));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload: CourseState = {
        courses: state.courses.map((c) => ({ ...c })),
        taken: state.taken,
        timetable: state.timetable,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [state.taken, state.timetable, state.courses]);

  const value = useMemo<CourseContextValue>(
    () => ({
      state,

      setStatus(courseId, status) {
        setState((prev) => {
          const nextTaken: Record<string, TakenCourseState> = {
            ...prev.taken,
            [courseId]: {
              ...(prev.taken[courseId] ?? { courseId }),
              status,
            },
          };

          const nextTimetable: Timetable =
            status === "completed"
              ? {
                  entries: prev.timetable.entries.filter(
                    (e) => e.courseId !== courseId,
                  ),
                }
              : prev.timetable;

          return { ...prev, taken: nextTaken, timetable: nextTimetable };
        });
      },

      addEntry(cellId, courseId, term) {
        setState((prev) => {
          const existing = prev.timetable.entries.find(
            (e) => e.cellId === cellId && e.courseId === courseId,
          );
          if (existing) {
            const si = termIndex(existing.startTerm);
            const ei = termIndex(existing.endTerm);
            const ti = termIndex(term);
            if (ti >= si && ti <= ei) return prev;
            const newStart = TERM_ORDER[Math.min(si, ti)];
            const newEnd = TERM_ORDER[Math.max(ei, ti)];
            return {
              ...prev,
              taken: {
                ...prev.taken,
                [courseId]: {
                  ...(prev.taken[courseId] ?? { courseId }),
                  status: "planned",
                },
              },
              timetable: {
                entries: prev.timetable.entries.map((e) =>
                  e.cellId === cellId && e.courseId === courseId
                    ? { ...e, startTerm: newStart, endTerm: newEnd }
                    : e,
                ),
              },
            };
          }
          return {
            ...prev,
            taken: {
              ...prev.taken,
              [courseId]: {
                ...(prev.taken[courseId] ?? { courseId }),
                status: "planned",
              },
            },
            timetable: {
              entries: [
                ...prev.timetable.entries,
                { cellId, courseId, startTerm: term, endTerm: term },
              ],
            },
          };
        });
      },

      removeEntry(cellId, courseId) {
        setState((prev) => {
          const nextEntries = prev.timetable.entries.filter(
            (e) => !(e.cellId === cellId && e.courseId === courseId),
          );

          const stillExists = nextEntries.some((e) => e.courseId === courseId);
          const prevTaken = prev.taken[courseId];

          return {
            ...prev,
            taken:
              !stillExists && prevTaken?.status === "planned"
                ? {
                    ...prev.taken,
                    [courseId]: { ...prevTaken, status: "not-taken" },
                  }
                : prev.taken,
            timetable: { entries: nextEntries },
          };
        });
      },

      updateEntryTerms(cellId, courseId, startTerm, endTerm) {
        const si = termIndex(startTerm);
        const ei = termIndex(endTerm);
        const actualStart = TERM_ORDER[Math.min(si, ei)];
        const actualEnd = TERM_ORDER[Math.max(si, ei)];

        setState((prev) => ({
          ...prev,
          timetable: {
            entries: prev.timetable.entries.map((e) =>
              e.cellId === cellId && e.courseId === courseId
                ? { ...e, startTerm: actualStart, endTerm: actualEnd }
                : e,
            ),
          },
        }));
      },
    }),
    [state],
  );

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

export function useCourseState() {
  const ctx = useContext(CourseContext);
  if (!ctx) {
    throw new Error("useCourseState must be used within CourseProvider");
  }
  return ctx;
}
