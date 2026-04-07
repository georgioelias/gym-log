'use client';

import { useMemo, useState } from 'react';
import type { GymRow } from '@/lib/stats';
import type { WorkoutDef } from '@/lib/workouts';

type ExerciseHistory = {
  label: string;
  points: number[];
  latest: string;
};

type WeekBucket = { label: string; count: number };

function parseWeight(w: string): number {
  const n = parseFloat(w.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function buildExerciseHistories(
  rows: GymRow[],
  workouts: WorkoutDef[],
): ExerciseHistory[] {
  const keyToLabel = new Map<string, string>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      keyToLabel.set(`${w.id}|${ex.key}`, ex.label);
    }
  }

  const byExercise = new Map<string, { date: string; weight: number }[]>();
  for (const r of rows) {
    const w = parseWeight(r.weight);
    if (w <= 0) continue;
    const ek = `${r.workout_id}|${r.exercise_key}`;
    if (!byExercise.has(ek)) byExercise.set(ek, []);
    byExercise.get(ek)!.push({ date: r.session_date, weight: w });
  }

  const result: ExerciseHistory[] = [];
  for (const [ek, entries] of byExercise) {
    if (entries.length < 1) continue;
    entries.sort((a, b) => a.date.localeCompare(b.date));
    const last10 = entries.slice(-10);
    result.push({
      label: keyToLabel.get(ek) ?? ek,
      points: last10.map((e) => e.weight),
      latest: `${last10[last10.length - 1].weight}`,
    });
  }
  result.sort((a, b) => a.label.localeCompare(b.label));
  return result;
}

function buildWeeklyVolume(rows: GymRow[]): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const end = new Date(d);
    const start = new Date(d);
    start.setDate(start.getDate() - 6);
    const fmt = (x: Date) => {
      const y = x.getFullYear();
      const m = String(x.getMonth() + 1).padStart(2, '0');
      const day = String(x.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const sStr = fmt(start);
    const eStr = fmt(end);
    let count = 0;
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.weight?.trim()) continue;
      const dk = r.session_date;
      if (dk >= sStr && dk <= eStr && !seen.has(dk)) {
        seen.add(dk);
        count += 1;
      }
    }
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    buckets.push({ label, count });
  }
  return buckets;
}

export function Insights({
  rows,
  workouts,
}: {
  rows: GymRow[];
  workouts: WorkoutDef[];
}) {
  const [open, setOpen] = useState(false);
  const histories = useMemo(() => buildExerciseHistories(rows, workouts), [rows, workouts]);
  const weekly = useMemo(() => buildWeeklyVolume(rows), [rows]);
  const maxWeekly = Math.max(1, ...weekly.map((w) => w.count));

  if (!rows.length) return null;

  return (
    <section className="insights">
      <button
        type="button"
        className="insights-toggle"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Hide insights' : 'Show insights'}
      </button>

      {open && (
        <>
          <div className="ins-section">
            <p className="ins-label">Weekly training days (last 8 weeks)</p>
            <div className="weekly-bars">
              {weekly.map((w, i) => (
                <div key={i} className="weekly-col">
                  <div
                    className="weekly-bar"
                    style={{ height: `${Math.max(6, Math.round((w.count / maxWeekly) * 48))}px` }}
                    title={`${w.count} days`}
                  />
                  <span className="weekly-lbl">{w.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ins-section">
            <p className="ins-label">Per-exercise weight trend (last 10 entries)</p>
            {histories.length === 0 ? (
              <p className="ins-empty">Log some weights to see trends here.</p>
            ) : (
              histories.map((h) => {
                const max = Math.max(1, ...h.points);
                return (
                  <div key={h.label} className="ins-row">
                    <span className="ins-name">{h.label}</span>
                    <div className="ins-sparkline">
                      {h.points.map((p, i) => (
                        <div
                          key={i}
                          className="ins-spark-bar"
                          style={{ height: `${Math.max(3, Math.round((p / max) * 26))}px` }}
                        />
                      ))}
                    </div>
                    <span className="ins-val">{h.latest} kg</span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
}
