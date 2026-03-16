// アプリ全体で共有する履修状態・時間割のドメインモデルと Context を定義する
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Course } from './course-data';
import { COURSES } from './course-data';

export type TakenStatus = 'not-taken' | 'planned' | 'completed';

export type TakenCourseState = {
  courseId: string;
  status: TakenStatus;
  year?: number;
  semester?: 'spring' | 'summer' | 'fall' | 'winter';
};

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type Period = 1 | 2 | 3 | 4 | 5 | 6;

export type TimeCellId = `${DayOfWeek}-${Period}`;

export type TimetableEntry = {
  cellId: TimeCellId;
  courseId: string;
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
  addEntry: (cellId: TimeCellId, courseId: string) => void;
  removeEntry: (cellId: TimeCellId, courseId: string) => void;
};

const STORAGE_KEY = 'crm_course_state_v1';

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

function buildInitialState(): CourseState {
  const courses = COURSES;

  const taken: Record<string, TakenCourseState> = {};
  for (const c of courses) {
    taken[c.id] = {
      courseId: c.id,
      status: 'not-taken',
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

  // localStorage から復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CourseState;
      // courses はコード側の定義を優先するため、taken / timetable のみ反映
      setState((prev) => ({
        ...prev,
        taken: parsed.taken ?? prev.taken,
        timetable: parsed.timetable ?? prev.timetable,
      }));
    } catch {
      // 破損していた場合は無視して初期状態を使う
    }
  }, []);

  // 保存
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: CourseState = {
        courses: state.courses.map((c) => ({ ...c })), // 互換性維持のために含めておく
        taken: state.taken,
        timetable: state.timetable,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 保存失敗は致命的ではないので握りつぶす
    }
  }, [state.taken, state.timetable, state.courses]);

  const value = useMemo<CourseContextValue>(
    () => ({
      state,
      setStatus(courseId, status) {
        setState((prev) => ({
          ...prev,
          taken: {
            ...prev.taken,
            [courseId]: {
              ...(prev.taken[courseId] ?? { courseId }),
              status,
            },
          },
        }));
      },
      addEntry(cellId, courseId) {
        setState((prev) => {
          const exists = prev.timetable.entries.some(
            (e) => e.cellId === cellId && e.courseId === courseId,
          );
          if (exists) return prev;
          return {
            ...prev,
            taken: {
              ...prev.taken,
              [courseId]: {
                ...(prev.taken[courseId] ?? { courseId }),
                status: 'planned',
              },
            },
            timetable: {
              entries: [...prev.timetable.entries, { cellId, courseId }],
            },
          };
        });
      },
      removeEntry(cellId, courseId) {
        setState((prev) => {
          const nextEntries = prev.timetable.entries.filter(
            (e) => !(e.cellId === cellId && e.courseId === courseId),
          );

          // その講義に紐づくセルが 0 になったら status を not-taken に戻すかどうかは仕様次第だが、
          // とりあえず planned だけを解除する。
          const stillExists = nextEntries.some((e) => e.courseId === courseId);
          const prevTaken = prev.taken[courseId];

          return {
            ...prev,
            taken: !stillExists && prevTaken?.status === 'planned'
              ? {
                  ...prev.taken,
                  [courseId]: { ...prevTaken, status: 'not-taken' },
                }
              : prev.taken,
            timetable: { entries: nextEntries },
          };
        });
      },
    }),
    [state],
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourseState() {
  const ctx = useContext(CourseContext);
  if (!ctx) {
    throw new Error('useCourseState must be used within CourseProvider');
  }
  return ctx;
}

