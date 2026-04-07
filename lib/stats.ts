import type { WorkoutDef } from '@/lib/workouts';

export type GymRow = {
  session_date: string;
  workout_id: string;
  exercise_key: string;
  weight: string;
};

export type DayStats = {
  distinctDays: number;
  daysThisMonth: number;
  streak: number;
  topWorkoutId: string | null;
  miniBars: { date: string; count: number }[];
};

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Days (YYYY-MM-DD) that have at least one non-empty weight, sorted desc */
export function daysWithData(rows: GymRow[]): string[] {
  const days = new Set<string>();
  for (const r of rows) {
    if (r.weight?.trim()) days.add(r.session_date);
  }
  return [...days].sort().reverse();
}

function computeStreak(sortedDaysDesc: string[]): number {
  if (!sortedDaysDesc.length) return 0;
  const set = new Set(sortedDaysDesc);
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (!set.has(toYMD(d))) {
    const y = new Date(d);
    y.setDate(y.getDate() - 1);
    if (!set.has(toYMD(y))) return 0;
    d.setTime(y.getTime());
  }
  let streak = 0;
  while (set.has(toYMD(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function computeStats(rows: GymRow[]): DayStats {
  const byDay = new Map<string, Map<string, Set<string>>>();
  for (const r of rows) {
    if (!r.weight?.trim()) continue;
    if (!byDay.has(r.session_date)) byDay.set(r.session_date, new Map());
    const wm = byDay.get(r.session_date)!;
    if (!wm.has(r.workout_id)) wm.set(r.workout_id, new Set());
    wm.get(r.workout_id)!.add(r.exercise_key);
  }

  const distinctDays = byDay.size;
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let daysThisMonth = 0;
  for (const day of byDay.keys()) {
    if (day.startsWith(ym)) daysThisMonth += 1;
  }

  const sortedDays = [...byDay.keys()].sort().reverse();
  const streak = computeStreak(sortedDays);

  const workoutCounts = new Map<string, number>();
  for (const r of rows) {
    if (!r.weight?.trim()) continue;
    workoutCounts.set(r.workout_id, (workoutCounts.get(r.workout_id) ?? 0) + 1);
  }
  let topWorkoutId: string | null = null;
  let top = 0;
  for (const [wid, c] of workoutCounts) {
    if (c > top) {
      top = c;
      topWorkoutId = wid;
    }
  }

  const last14: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toYMD(d);
    const wm = byDay.get(key);
    let count = 0;
    if (wm) for (const set of wm.values()) count += set.size;
    last14.push({ date: key, count });
  }

  return {
    distinctDays,
    daysThisMonth,
    streak,
    topWorkoutId,
    miniBars: last14,
  };
}

export function workoutLabel(id: string | null, workouts: WorkoutDef[]): string {
  if (!id) return '—';
  return workouts.find((w) => w.id === id)?.title ?? id;
}
