'use client';

import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { flattenLogs, logsFromRows, type Logs } from '@/lib/logs';
import { computeStats, daysWithData } from '@/lib/stats';
import { WORKOUTS } from '@/lib/workouts';
import { AuthPanel } from '@/components/AuthPanel';
import { StatsBanner } from '@/components/StatsBanner';
import { ExerciseFlip } from '@/components/ExerciseFlip';

const LEGACY_KEY = 'gym-tracker-personal-v1';

function todayISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayChip(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  return { wd, md };
}

export function GymShell() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [logs, setLogs] = useState<Logs>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncBump, setSyncBump] = useState(0);
  const [date, setDate] = useState(todayISODate);
  const [workoutId, setWorkoutId] = useState(WORKOUTS[0].id);
  const debouncers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const reloadLogs = useCallback(async () => {
    if (!user) return;
    setLoadError(null);
    const { data, error } = await supabase
      .from('gym_entries')
      .select('session_date, workout_id, exercise_key, weight')
      .order('session_date', { ascending: false });
    if (error) {
      setLoadError(error.message);
      return;
    }
    setLogs(logsFromRows(data ?? []));
  }, [supabase, user]);

  useEffect(() => {
    if (user) void reloadLogs();
    else setLogs({});
  }, [user, reloadLogs]);

  const rows = useMemo(() => flattenLogs(logs), [logs]);
  const stats = useMemo(() => computeStats(rows), [rows]);
  const pastDays = useMemo(() => daysWithData(rows), [rows]);

  const bumpSync = useCallback((text: string) => {
    setSyncMsg(text);
    setSyncBump((n) => n + 1);
    window.setTimeout(() => setSyncMsg(null), 2000);
  }, []);

  const persistCell = useCallback(
    (sessionDate: string, wid: string, exKey: string, weight: string) => {
      if (!user) return;
      const dk = `${sessionDate}|${wid}|${exKey}`;
      const prev = debouncers.current.get(dk);
      if (prev) window.clearTimeout(prev);
      const t = window.setTimeout(async () => {
        debouncers.current.delete(dk);
        if (!weight.trim()) {
          const { error } = await supabase
            .from('gym_entries')
            .delete()
            .eq('user_id', user.id)
            .eq('session_date', sessionDate)
            .eq('workout_id', wid)
            .eq('exercise_key', exKey);
          if (error) bumpSync(`Sync: ${error.message}`);
          else bumpSync('Saved · cloud');
          return;
        }
        const { error } = await supabase.from('gym_entries').upsert(
          {
            user_id: user.id,
            session_date: sessionDate,
            workout_id: wid,
            exercise_key: exKey,
            weight: weight.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,session_date,workout_id,exercise_key' },
        );
        if (error) bumpSync(`Sync: ${error.message}`);
        else bumpSync('Saved · cloud');
      }, 340);
      debouncers.current.set(dk, t);
    },
    [bumpSync, supabase, user],
  );

  const updateWeight = (sessionDate: string, wid: string, exKey: string, weight: string) => {
    setLogs((prev) => {
      const next: Logs = { ...prev };
      if (!next[sessionDate]) next[sessionDate] = {};
      if (!next[sessionDate][wid]) next[sessionDate][wid] = {};
      const nextWm = { ...next[sessionDate][wid] };
      if (!weight.trim()) delete nextWm[exKey];
      else nextWm[exKey] = weight;
      next[sessionDate] = { ...next[sessionDate], [wid]: nextWm };
      return next;
    });
    persistCell(sessionDate, wid, exKey, weight);
  };

  const importLegacy = async () => {
    if (!user) return;
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      bumpSync('No old on-device backup found');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        logs?: Record<string, Record<string, Record<string, { weight?: string }>>>;
      };
      const blob = parsed.logs;
      if (!blob) throw new Error('Invalid backup');
      const payload: {
        user_id: string;
        session_date: string;
        workout_id: string;
        exercise_key: string;
        weight: string;
      }[] = [];
      for (const d of Object.keys(blob)) {
        for (const wid of Object.keys(blob[d])) {
          for (const ek of Object.keys(blob[d][wid])) {
            const w = blob[d][wid][ek]?.weight;
            if (w == null || !String(w).trim()) continue;
            payload.push({
              user_id: user.id,
              session_date: d,
              workout_id: wid,
              exercise_key: ek,
              weight: String(w),
            });
          }
        }
      }
      if (!payload.length) {
        bumpSync('Backup was empty');
        return;
      }
      const { error } = await supabase.from('gym_entries').upsert(payload, {
        onConflict: 'user_id,session_date,workout_id,exercise_key',
      });
      if (error) throw error;
      await reloadLogs();
      bumpSync(`Imported ${payload.length} entries`);
    } catch (e) {
      bumpSync(e instanceof Error ? e.message : 'Import failed');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!authReady) {
    return <div className="boot">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="shell auth-only">
        <AuthPanel supabase={supabase} />
      </div>
    );
  }

  const workout = WORKOUTS.find((w) => w.id === workoutId)!;
  const bucket = logs[date]?.[workoutId] ?? {};

  return (
    <div className="shell">
      <header className="top">
        <div className="top-row">
          <div>
            <h1 className="brand-title">Gym log</h1>
            <p className="brand-sub">
              Cloud synced with Supabase — open anywhere, past days stay put.
            </p>
          </div>
          <button type="button" className="sign-out" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        <p
          className={'sync-toast' + (syncMsg === 'Saved · cloud' ? ' is-sparkle' : '')}
          key={syncBump}
        >
          {syncMsg ?? ' '}
        </p>
      </header>

      {loadError ? <div className="err-banner">Could not load history: {loadError}</div> : null}

      <StatsBanner stats={stats} workouts={WORKOUTS} />

      <section className="controls-block">
        <label className="field">
          <span className="field-label">Training day</span>
          <input
            className="input date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {pastDays.length ? (
          <div className="day-strip" aria-label="Recent logged days">
            {pastDays.slice(0, 24).map((d) => {
              const { wd, md } = formatDayChip(d);
              const active = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  className={'day-chip' + (active ? ' is-active' : '')}
                  onClick={() => setDate(d)}
                >
                  <span className="wk">{wd}</span>
                  {md}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="workout-tabs" role="tablist" aria-label="Workout">
          {WORKOUTS.map((w) => (
            <button
              key={w.id}
              type="button"
              className="workout-tab"
              role="tab"
              aria-selected={w.id === workoutId}
              onClick={() => setWorkoutId(w.id)}
            >
              <span className="tab-emoji" aria-hidden>
                {w.emoji}
              </span>
              <span className="tab-text">
                <span className="tab-title">{w.title}</span>
                <span className="tab-hint">{w.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="workout-meta">
        {workout.title} · <strong>{date}</strong>
      </p>

      <ul className="exercise-list">
        {workout.exercises.map((ex) => (
          <li key={ex.key} className={'exercise-card' + (ex.optional ? ' optional' : '')}>
            <div className="exercise-top">
              <div>
                <h2 className="exercise-name">
                  {ex.label}
                  {ex.optional ? <span className="optional-tag"> · optional</span> : null}
                </h2>
                {ex.setsHint ? <p className="exercise-meta">{ex.setsHint}</p> : null}
              </div>
              <ExerciseFlip dbId={ex.dbId} label={ex.label} />
            </div>
            <div className="exercise-bottom">
              <div className="weight-row">
                <label htmlFor={`w-${workout.id}-${ex.key}`}>Weight (kg)</label>
                <input
                  id={`w-${workout.id}-${ex.key}`}
                  className="weight-input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="—"
                  value={bucket[ex.key] ?? ''}
                  onChange={(e) => updateWeight(date, workout.id, ex.key, e.target.value)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="misc-actions">
        <button type="button" className="ghost-btn" onClick={() => void importLegacy()}>
          Import old on-device backup (first version)
        </button>
      </div>
    </div>
  );
}
