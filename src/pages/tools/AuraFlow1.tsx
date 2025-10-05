'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface ToolPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

type PhaseName = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

interface Settings {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  soundOn: boolean;
  vibrateOn: boolean;
}

const RANGES: Record<PhaseName, { min: number; max: number; default: number }> = {
  inhale: { min: 1, max: 20, default: 4 },
  holdIn: { min: 0, max: 15, default: 2 },
  exhale: { min: 1, max: 20, default: 6 },
  holdOut: { min: 0, max: 15, default: 2 },
};

const PHASES: PhaseName[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

export default function ToolPlaceholder({ title, description, icon: Icon }: ToolPlaceholderProps) {
  // DOM refs for high-frequency updates without re-rendering each frame
  const ringRef = useRef<HTMLDivElement | null>(null);
  const orbRef = useRef<HTMLDivElement | null>(null);
  const phaseLabelRef = useRef<HTMLDivElement | null>(null);
  const countdownRef = useRef<HTMLDivElement | null>(null);

  // Runtime refs
  const rafIdRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentPhaseIndexRef = useRef<number>(0);
  const phaseStartTimeRef = useRef<number>(0);
  const pauseElapsedMsRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);

  // UI state
  const [status, setStatus] = useState<'Ready' | 'Running' | 'Paused'>('Ready');
  const [editTarget, setEditTarget] = useState<PhaseName>('inhale');
  const [settings, setSettings] = useState<Settings>({
    inhale: RANGES.inhale.default,
    holdIn: RANGES.holdIn.default,
    exhale: RANGES.exhale.default,
    holdOut: RANGES.holdOut.default,
    soundOn: true,
    vibrateOn: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem('auraflow-settings') || '{}') as Partial<Settings>;
      setSettings((prev) => ({
        inhale: clamp(toInt(saved.inhale, prev.inhale), RANGES.inhale.min, RANGES.inhale.max),
        holdIn: clamp(toInt(saved.holdIn, prev.holdIn), RANGES.holdIn.min, RANGES.holdIn.max),
        exhale: clamp(toInt(saved.exhale, prev.exhale), RANGES.exhale.min, RANGES.exhale.max),
        holdOut: clamp(toInt(saved.holdOut, prev.holdOut), RANGES.holdOut.min, RANGES.holdOut.max),
        soundOn: saved.soundOn !== undefined ? !!saved.soundOn : prev.soundOn,
        vibrateOn: saved.vibrateOn !== undefined ? !!saved.vibrateOn : prev.vibrateOn,
      }));
    } catch {}
  }, []);

  // Persist settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auraflow-settings', JSON.stringify(settings));
  }, [settings]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleStartPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        nudgeSlider(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nudgeSlider(1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, editTarget, status]);

  // Preview visuals when not running and editTarget changes or settings change
  useEffect(() => {
    if (status !== 'Ready') return;
    applyVisualsForPhase(editTarget);
    setRingProgress(0);
    if (countdownRef.current) {
      const val = settings[editTarget];
      countdownRef.current.textContent = val.toFixed(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTarget, settings, status]);

  // Helpers
  const totalCycle = settings.inhale + settings.holdIn + settings.exhale + settings.holdOut;

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }
  function toInt(val: unknown, fallback: number) {
    const n = parseInt(String(val ?? ''), 10);
    return Number.isFinite(n) ? n : fallback;
  }

  function ensureAudio() {
    if (!settings.soundOn) return;
    if (!audioCtxRef.current) {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctor) {
        audioCtxRef.current = new Ctor();
      }
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }

  function beep(freq = 540, dur = 120, gain = 0.05) {
    if (!settings.soundOn || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g).connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;

    const now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur / 1000);

    osc.start(now);
    osc.stop(now + dur / 1000 + 0.02);
  }

  function vibrate(pattern: number | number[] = 35) {
    if (settings.vibrateOn && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern as VibratePattern);
    }
  }

  function setRingProgress(p: number) {
    const clamped = Math.max(0, Math.min(1, p));
    const deg = `${(clamped * 360).toFixed(2)}deg`;
    ringRef.current?.style.setProperty('--deg', deg);
  }

  function applyVisualsForPhase(phase: PhaseName) {
    const visuals: Record<PhaseName, { label: string; color: string; scale: string }> = {
      inhale: { label: 'Inhale', color: 'var(--inhale)', scale: '1.00' },
      holdIn: { label: 'Hold', color: 'var(--hold)', scale: '1.00' },
      exhale: { label: 'Exhale', color: 'var(--exhale)', scale: '0.85' },
      holdOut: { label: 'Hold', color: 'var(--hold)', scale: '0.85' },
    };
    const v = visuals[phase];
    phaseLabelRef.current && (phaseLabelRef.current.textContent = v.label);
    ringRef.current?.style.setProperty('--accent', v.color);
    orbRef.current?.style.setProperty('--scale', v.scale);
    orbRef.current?.style.setProperty('--phase-seconds', String(settings[phase]));
  }

  function getNextPhaseIndex(fromIndex: number) {
    let nextIndex = (fromIndex + 1) % PHASES.length;
    // Skip 0-duration phases
    for (let i = 0; i < PHASES.length; i++) {
      const ph = PHASES[nextIndex];
      if ((settings as any)[ph] > 0) break;
      nextIndex = (nextIndex + 1) % PHASES.length;
    }
    return nextIndex;
  }

  function getFirstActivePhaseIndex() {
    for (let i = 0; i < PHASES.length; i++) {
      if (settings[PHASES[i]] > 0) return i;
    }
    return 0;
  }

  function updateCountdown(nowMs: number) {
    const idx = currentPhaseIndexRef.current;
    const phase = PHASES[idx];
    const dur = settings[phase] * 1000;
    const elapsed = nowMs - phaseStartTimeRef.current;
    const remaining = Math.max(0, dur - elapsed);
    if (countdownRef.current) {
      countdownRef.current.textContent = (remaining / 1000).toFixed(1);
    }
  }

  function setPhase(index: number, resumeFromProgress = 0) {
    currentPhaseIndexRef.current = index;
    const phase = PHASES[index];
    const seconds = settings[phase];
    const duration = seconds * 1000;

    const now = performance.now();
    const elapsedFromProgress = resumeFromProgress * duration;
    phaseStartTimeRef.current = now - elapsedFromProgress;

    // Visuals and cues
    applyVisualsForPhase(phase);
    const cues: Record<PhaseName, { freq: number; vib: number | number[] }> = {
      inhale: { freq: 740, vib: 25 },
      holdIn: { freq: 600, vib: [15, 15] },
      exhale: { freq: 440, vib: 35 },
      holdOut: { freq: 600, vib: [15, 15] },
    };
    beep(cues[phase].freq);
    vibrate(cues[phase].vib);

    setRingProgress(resumeFromProgress);
    updateCountdown(now);
  }

  function loop(now: number) {
    if (!runningRef.current || pausedRef.current) return;

    const idx = currentPhaseIndexRef.current;
    const phase = PHASES[idx];
    const duration = settings[phase] * 1000;
    const elapsed = now - phaseStartTimeRef.current;
    const progress = duration > 0 ? Math.min(1, elapsed / duration) : 1;

    setRingProgress(progress);
    updateCountdown(now);

    if (progress >= 1) {
      const next = getNextPhaseIndex(idx);
      setPhase(next, 0);
    }
    rafIdRef.current = requestAnimationFrame(loop);
  }

  function startSession() {
    if (runningRef.current) return;
    runningRef.current = true;
    pausedRef.current = false;
    setStatus('Running');
    ensureAudio();

    const firstIndex = getFirstActivePhaseIndex();
    setPhase(firstIndex, 0);
    rafIdRef.current = requestAnimationFrame(loop);
  }

  function pauseSession() {
    if (!runningRef.current || pausedRef.current) return;
    pausedRef.current = true;
    setStatus('Paused');
    pauseElapsedMsRef.current = performance.now() - phaseStartTimeRef.current;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
  }

  function resumeSession() {
    if (!runningRef.current || !pausedRef.current) return;
    pausedRef.current = false;
    setStatus('Running');
    const idx = currentPhaseIndexRef.current;
    const dur = settings[PHASES[idx]] * 1000;
    const resumeProgress = dur > 0 ? Math.min(1, pauseElapsedMsRef.current / dur) : 0;
    setPhase(idx, resumeProgress);
    rafIdRef.current = requestAnimationFrame(loop);
  }

  function resetSession() {
    runningRef.current = false;
    pausedRef.current = false;
    setStatus('Ready');
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    setRingProgress(0);
    applyVisualsForPhase(editTarget);
    if (countdownRef.current) {
      countdownRef.current.textContent = settings[editTarget].toFixed(1);
    }
  }

  function toggleStartPause() {
    if (!runningRef.current) startSession();
    else if (!pausedRef.current) pauseSession();
    else resumeSession();
  }

  function nudgeSlider(dir: -1 | 1) {
    const range = RANGES[editTarget];
    const current = settings[editTarget];
    const next = clamp(current + dir, range.min, range.max);
    if (next !== current) {
      setSettings((prev) => ({ ...prev, [editTarget]: next }));
      if (status === 'Ready' && countdownRef.current) {
        countdownRef.current.textContent = next.toFixed(1);
      }
      if (status !== 'Running') applyVisualsForPhase(editTarget);
    }
  }

  const startButtonLabel = !runningRef.current ? 'Start' : pausedRef.current ? 'Resume' : 'Pause';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Icon className="h-8 w-8" />
          {title}
        </h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>{description}</span>
            <span className="text-xs text-muted-foreground">Status: {status}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Scoped styles for the AuraFlow widget */}
          <style>{`
            .af-root { --text: #e6edf3; --muted: #8b949e; --ring-track: rgba(230,237,243,0.1); --outline: rgba(230,237,243,0.12); --inhale: #2dd4bf; --exhale: #a78bfa; --hold: #f59e0b; color: var(--text); }
            .af-stage{ display:grid; grid-template-columns:1fr; gap:14px; align-items:center; justify-items:center; margin-bottom: 16px; }
            .af-ring{ --deg:0deg; --accent: var(--inhale); width:min(80vw,360px); aspect-ratio:1/1; border-radius:50%; position:relative; background: conic-gradient(var(--accent) var(--deg), var(--ring-track) var(--deg) 360deg); box-shadow: inset 0 0 0 1px var(--outline), 0 10px 40px rgba(0,0,0,0.25); display:grid; place-items:center; transition:background 0.4s ease; }
            .af-ring::after{ content:""; position:absolute; inset:10px; border-radius:50%; background:linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)); pointer-events:none; }
            .af-orb{ --phase-seconds:4; --scale:0.88; width:82%; height:82%; border-radius:50%; background: radial-gradient(100% 100% at 30% 30%, rgba(255,255,255,0.12), transparent 70%), radial-gradient(100% 100% at 70% 70%, rgba(255,255,255,0.1), transparent 60%), linear-gradient(135deg, rgba(45,212,191,0.18), rgba(167,139,250,0.18)); box-shadow: inset 0 0 60px rgba(255,255,255,0.05), 0 12px 50px rgba(0,0,0,0.2); display:grid; place-items:center; transform: scale(var(--scale)); transition: transform calc(var(--phase-seconds) * 1s) cubic-bezier(0.65, 0, 0.35, 1), background 0.4s ease; position:relative; overflow:hidden; text-align:center; }
            .af-phase{ font-size: 0.95rem; letter-spacing:0.5px; text-transform: uppercase; font-weight:600; color:#d0d8e2; }
            .af-countdown{ font-variant-numeric: tabular-nums; font-size: 2.2rem; font-weight: 700; line-height:1.1; margin-top:2px; text-shadow: 0 1px 0 rgba(0,0,0,0.2); }
            .af-controls{ display:grid; grid-template-columns:1fr; gap:12px; }
            .af-panel{ background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--outline); border-radius: 14px; padding: 14px; }
            .af-actions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; justify-content:center; }
            .af-btn{ appearance:none; border:1px solid var(--outline); background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); color: var(--text); border-radius:10px; padding:10px 16px; font-weight:600; letter-spacing:0.2px; cursor:pointer; transition: transform 0.08s ease, background 0.2s ease, border-color 0.2s; }
            .af-btn.primary{ border-color: rgba(45,212,191,0.6); background: linear-gradient(180deg, rgba(45,212,191,0.25), rgba(45,212,191,0.15)); box-shadow: 0 6px 24px rgba(45,212,191,0.25); }
            .af-btn:disabled{ opacity:0.5; cursor:not-allowed; }
            .af-btn:hover:not(:disabled){ transform: translateY(-1px); }
            .af-slider{ display:grid; gap:8px; margin-top: 8px; }
            .af-slider label{ font-weight:600; color:#dbe9ff; display:flex; justify-content:space-between; }
            .af-range{ width:100%; appearance:none; height:8px; border-radius:999px; background: linear-gradient(90deg, var(--inhale), var(--hold), var(--exhale)); outline:none; border:1px solid var(--outline); }
            .af-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:#fff; border:2px solid rgba(255,255,255,0.7); box-shadow:0 4px 14px rgba(0,0,0,0.3); cursor:pointer; }
            .af-range::-moz-range-thumb{ width:22px; height:22px; border-radius:50%; background:#fff; border:2px solid rgba(255,255,255,0.7); cursor:pointer; }
            .af-chips{ display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:10px; }
            .af-chip{ border:1px solid var(--outline); border-radius:999px; padding:6px 12px; font-weight:600; color:#cfe3ff; font-size:13px; background: rgba(255,255,255,0.02); display:inline-flex; align-items:center; gap:6px; }
            .af-chip::before{ content:''; display:inline-block; width:8px; height:8px; border-radius:50%; }
            .af-chip.in::before{ background: var(--inhale); }
            .af-chip.holdin::before{ background: var(--hold); }
            .af-chip.out::before{ background: var(--exhale); }
            .af-chip.holdout::before{ background: var(--hold); }
            .af-segmented{ display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
            .af-seg{ appearance:none; border:1px solid var(--outline); background:transparent; color:var(--muted); font-size:13px; border-radius:8px; padding:8px 12px; cursor:pointer; font-weight:600; transition: background 0.2s, color 0.2s, border-color 0.2s; }
            .af-seg[aria-checked="true"]{ background: rgba(255,255,255,0.07); }
            .af-seg[data-target="inhale"][aria-checked="true"]{ color: var(--inhale); border-color: var(--inhale); }
            .af-seg[data-target="holdIn"][aria-checked="true"]{ color: var(--hold); border-color: var(--hold); }
            .af-seg[data-target="exhale"][aria-checked="true"]{ color: var(--exhale); border-color: var(--exhale); }
            .af-seg[data-target="holdOut"][aria-checked="true"]{ color: var(--hold); border-color: var(--hold); }
            .af-toggles{ display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:center; }
            .af-toggle{ display:inline-flex; align-items:center; gap:8px; font-weight:600; border:1px solid var(--outline); border-radius:999px; padding:6px 10px; background: rgba(255,255,255,0.02); color: var(--text); }
            .af-toggle input{ accent-color:#62f0d6; transform:scale(1.1); }
          `}</style>

          <div className="af-root">
            {/* Visualizer */}
            <section className="af-stage" aria-live="polite">
              <div className="af-ring" ref={ringRef} aria-label="Breathing visualizer">
                <div className="af-orb" ref={orbRef} aria-live="polite" aria-atomic="true">
                  <div className="af-phase" ref={phaseLabelRef}>Inhale</div>
                  <div className="af-countdown" ref={countdownRef}>
                    {settings[editTarget].toFixed(1)}
                  </div>
                </div>
              </div>
            </section>

            {/* Controls */}
            <section className="af-controls">
              <div className="af-panel af-actions">
                <button
                  type="button"
                  className="af-btn primary"
                  onClick={toggleStartPause}
                  aria-pressed={runningRef.current && !pausedRef.current ? 'true' : 'false'}
                >
                  {startButtonLabel}
                </button>
                <button
                  type="button"
                  className="af-btn"
                  onClick={resetSession}
                  disabled={status === 'Ready'}
                >
                  Reset
                </button>
                <div className="af-toggles">
                  <label className="af-toggle">
                    <input
                      type="checkbox"
                      checked={settings.soundOn}
                      onChange={(e) => {
                        setSettings((prev) => ({ ...prev, soundOn: e.target.checked }));
                        if (e.target.checked) ensureAudio();
                      }}
                    />
                    Sound
                  </label>
                  <label className="af-toggle">
                    <input
                      type="checkbox"
                      checked={settings.vibrateOn}
                      onChange={(e) => setSettings((prev) => ({ ...prev, vibrateOn: e.target.checked }))}
                    />
                    Vibrate
                  </label>
                </div>
              </div>

              <div className="af-panel">
                <div className="af-chips">
                  <span className="af-chip in">Inhale: <span>{settings.inhale}</span>s</span>
                  <span className="af-chip holdin">Hold: <span>{settings.holdIn}</span>s</span>
                  <span className="af-chip out">Exhale: <span>{settings.exhale}</span>s</span>
                  <span className="af-chip holdout">Hold: <span>{settings.holdOut}</span>s</span>
                </div>
                <div className="text-center mb-3 text-sm text-muted-foreground">
                  Total Cycle: <b>{totalCycle}s</b>
                </div>

                <div className="af-segmented" role="radiogroup" aria-label="Adjust duration for">
                  {PHASES.map((phase) => (
                    <button
                      key={phase}
                      type="button"
                      className="af-seg"
                      role="radio"
                      aria-checked={editTarget === phase}
                      data-target={phase}
                      onClick={() => setEditTarget(phase)}
                    >
                      {phase === 'inhale' && 'Inhale'}
                      {phase === 'holdIn' && 'Hold In'}
                      {phase === 'exhale' && 'Exhale'}
                      {phase === 'holdOut' && 'Hold Out'}
                    </button>
                  ))}
                </div>

                <div className="af-slider">
                  <label htmlFor="durationSlider">
                    <span>
                      {editTarget === 'inhale' && 'Inhale Duration'}
                      {editTarget === 'holdIn' && 'Hold In Duration'}
                      {editTarget === 'exhale' && 'Exhale Duration'}
                      {editTarget === 'holdOut' && 'Hold Out Duration'}
                    </span>
                    <span>
                      <b>{settings[editTarget]}</b>s
                    </span>
                  </label>
                  <input
                    id="durationSlider"
                    className="af-range"
                    type="range"
                    min={RANGES[editTarget].min}
                    max={RANGES[editTarget].max}
                    step={1}
                    value={settings[editTarget]}
                    onChange={(e) => {
                      const val = clamp(parseInt(e.target.value, 10), RANGES[editTarget].min, RANGES[editTarget].max);
                      setSettings((prev) => ({ ...prev, [editTarget]: val }));
                      if (status === 'Ready' && countdownRef.current) {
                        countdownRef.current.textContent = val.toFixed(1);
                      }
                    }}
                  />
                  <small className="text-xs text-muted-foreground">
                    Allowed ranges — Inhale/Exhale: 1–20s, Hold: 0–15s, integer steps.
                  </small>
                </div>
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
