'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { useState, type FormEvent } from 'react';

export function AuthPanel({ supabase }: { supabase: SupabaseClient }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Check your inbox to confirm (if your project requires email confirmation).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Gym log</h1>
      <p className="auth-blurb">
        Sign in to sync every training day. Built for your phone; stats stay light and playful.
      </p>
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          className={'auth-tab' + (mode === 'signin' ? ' is-on' : '')}
          onClick={() => {
            setMode('signin');
            setErr(null);
            setMsg(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={'auth-tab' + (mode === 'signup' ? ' is-on' : '')}
          onClick={() => {
            setMode('signup');
            setErr(null);
            setMsg(null);
          }}
        >
          Create account
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input
            className="input"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      {err ? (
        <p className="auth-msg is-err" role="alert">
          {err}
        </p>
      ) : null}
      {msg ? <p className="auth-msg">{msg}</p> : null}
    </div>
  );
}
