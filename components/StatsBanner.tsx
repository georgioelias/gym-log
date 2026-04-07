'use client';

import type { DayStats } from '@/lib/stats';
import { workoutLabel } from '@/lib/stats';
import type { WorkoutDef } from '@/lib/workouts';

export function StatsBanner({ stats, workouts }: { stats: DayStats; workouts: WorkoutDef[] }) {
  const max = Math.max(1, ...stats.miniBars.map((b) => b.count));
  const top = workoutLabel(stats.topWorkoutId, workouts);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-emoji" aria-hidden>
          📆
        </span>
        <strong>{stats.distinctDays}</strong>
        <span>days with logs</span>
      </div>
      <div className="stat-card">
        <span className="stat-emoji" aria-hidden>
          🔥
        </span>
        <strong>{stats.streak}</strong>
        <span>day streak</span>
      </div>
      <div className="stat-card">
        <span className="stat-emoji" aria-hidden>
          ✨
        </span>
        <strong>{stats.daysThisMonth}</strong>
        <span>days this month</span>
      </div>
      <div className="stat-card">
        <span className="stat-emoji" aria-hidden>
          🏋️
        </span>
        <strong style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{top}</strong>
        <span>most logged block</span>
      </div>
      <div className="stat-card span-2 spark" aria-label="Last 14 days activity">
        {stats.miniBars.map((b) => (
          <div
            key={b.date}
            className="spark-col"
            style={{ height: `${Math.max(6, Math.round((b.count / max) * 52))}px` }}
            title={`${b.date}: ${b.count} fields`}
          />
        ))}
      </div>
    </div>
  );
}
