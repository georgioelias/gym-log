import type { GymRow } from '@/lib/stats';

/** date → workoutId → exerciseKey → weight */
export type Logs = Record<string, Record<string, Record<string, string>>>;

export function logsFromRows(
  rows: {
    session_date: string;
    workout_id: string;
    exercise_key: string;
    weight: string | null;
  }[],
): Logs {
  const logs: Logs = {};
  for (const r of rows) {
    if (!logs[r.session_date]) logs[r.session_date] = {};
    if (!logs[r.session_date][r.workout_id]) logs[r.session_date][r.workout_id] = {};
    logs[r.session_date][r.workout_id][r.exercise_key] = r.weight ?? '';
  }
  return logs;
}

export function flattenLogs(logs: Logs): GymRow[] {
  const rows: GymRow[] = [];
  for (const [session_date, wm] of Object.entries(logs)) {
    for (const [workout_id, exm] of Object.entries(wm)) {
      for (const [exercise_key, weight] of Object.entries(exm)) {
        rows.push({ session_date, workout_id, exercise_key, weight });
      }
    }
  }
  return rows;
}
