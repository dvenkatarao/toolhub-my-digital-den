Of course. Here is the breathing exercise app converted into a self-contained TSX component, fitting perfectly into the provided template.

This version encapsulates all the HTML, styling, and logic within a single React component. It uses `useState`, `useRef`, and `useEffect` to manage state and side effects, replacing the original's vanilla JavaScript DOM manipulation with the React paradigm.

### `AuraFlowTool.tsx`

Copy this code into a `.tsx` file in your React/Next.js project.

```tsx
'use client'; // Required for Next.js App Router to denote a client-side component

import { Card, CardContent } from '@/components/ui/card';
import { Waves, type LucideIcon } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, type FC } from 'react';

// --- Configuration (can be moved outside the component) ---
const RANGES = {
  inhale:  { min: 1, max: 20, default: 4, label: "Inhale" },
  holdIn:  { min: 0, max: 15, default: 2, label: "Hold In" },
  exhale:  { min: 1, max: 20, default: 6, label: "Exhale" },
  holdOut: { min: 0, max: 15, default: 2, label: "Hold Out" },
};
const PHASES_ORDER: PhaseKey[] = ["inhale", "holdIn", "exhale", "holdOut"];
type PhaseKey = keyof typeof RANGES;

interface Settings {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  soundOn: boolean;
  vibrateOn: boolean;
}

// --- The Main Component ---
export default function AuraFlowTool() {
  const [settings, setSettings] = useState<Settings>({
    inhale: RANGES.inhale.default,
    holdIn: RANGES.holdIn.default,
    exhale: RANGES.exhale.default,
    holdOut: RANGES.holdOut.default,
    soundOn: true,
    vibrateOn: false,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [editTarget, setEditTarget] = useState<PhaseKey>("inhale");
  const [statusText, setStatusText] = useState("Ready");

  // Refs for direct DOM manipulation (performance-critical animations)
  const ringRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const phaseLabelRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);

  // Refs for values that persist across renders without causing re-renders
  const rafId = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const phaseStartTime = useRef<number>(0);
  const pauseElapsedMs = useRef<number>(0);
  const currentPhaseIndex = useRef<number>(0);

  // --- Core Logic (wrapped in useCallback for stability) ---

  const getNextPhaseIndex = useCallback(() => {
    let nextIndex = (currentPhaseIndex.current + 1) % PHASES_ORDER.length;
    while (settings[PHASES_ORDER[nextIndex]] === 0) {
      nextIndex = (nextIndex + 1) % PHASES_ORDER.length;
    }
    return nextIndex;
  }, [settings]);

  const setRingProgress = (p: number) => {
    if (ringRef.current) {
      const deg = `${(Math.max(0, Math.min(1, p)) * 360).toFixed(2)}deg`;
      ringRef.current.style.setProperty("--deg", deg);
    }
  };

  const updateCountdown = useCallback((nowMs: number) => {
    const phaseName = PHASES_ORDER[currentPhaseIndex.current];
    const phaseDurationMs = settings[phaseName] * 1000;
    const elapsed = nowMs - phaseStartTime.current;
    const remaining = Math.max(0, phaseDurationMs - elapsed);
    if (countdownRef.current) {
      countdownRef.current.textContent = (remaining / 1000).toFixed(1);
    }
  }, [settings]);
  
  const beep = useCallback((freq = 540, dur = 120, gain = 0.05) => {
    if (!settings.soundOn || !audioCtxRef.current) return;
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g).connect(audioCtx.destination);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000 + 0.02);
  }, [settings.soundOn]);

  const vibrate = useCallback((pattern: number | number[] = 35) => {
    if (settings.vibrateOn && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, [settings.vibrateOn]);

  const setPhase = useCallback((phaseIndex: number, resumeFromProgress = 0) => {
    currentPhaseIndex.current = phaseIndex;
    const phaseName = PHASES_ORDER[phaseIndex];
    const seconds = settings[phaseName];
    const phaseDurationMs = seconds * 1000;

    const visuals = {
      inhale:  { label: "Inhale", color: "var(--inhale)", scale: "1.00" },
      holdIn:  { label: "Hold",   color: "var(--hold)",   scale: "1.00" },
      exhale:  { label: "Exhale", color: "var(--exhale)", scale: "0.85" },
      holdOut: { label: "Hold",   color: "var(--hold)",   scale: "0.85" },
    };

    if (phaseLabelRef.current) phaseLabelRef.current.textContent = visuals[phaseName].label;
    if (ringRef.current) ringRef.current.style.setProperty("--accent", visuals[phaseName].color);
    if (orbRef.current) {
      orbRef.current.style.setProperty("--scale", visuals[phaseName].scale);
      orbRef.current.style.setProperty("--phase-seconds", String(seconds));
    }
    
    phaseStartTime.current = performance.now() - (resumeFromProgress * phaseDurationMs);

    const cues = {
      inhale:  { freq: 740, vib: 25 }, holdIn:  { freq: 600, vib: [15, 15] },
      exhale:  { freq: 440, vib: 35 }, holdOut: { freq: 600, vib: [15, 15] },
    };
    beep(cues[phaseName].freq);
    vibrate(cues[phaseName].vib);

    setRingProgress(resumeFromProgress);
    updateCountdown(performance.now());
  }, [settings, beep, vibrate, updateCountdown]);

  const loop = useCallback((now: number) => {
    const phaseName = PHASES_ORDER[currentPhaseIndex.current];
    const phaseDurationMs = settings[phaseName] * 1000;
    const elapsed = now - phaseStartTime.current;
    const progress = phaseDurationMs > 0 ? Math.min(1, elapsed / phaseDurationMs) : 1;

    setRingProgress(progress);
    updateCountdown(now);

    if (progress >= 1) {
      setPhase(getNextPhaseIndex());
    }
    rafId.current = requestAnimationFrame(loop);
  }, [settings, getNextPhaseIndex, setPhase, updateCountdown]);


  // --- Side Effects ---

  // Load/Save settings to localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("auraflow-settings") || "{}");
      if (Object.keys(saved).length > 0) {
        setSettings(prev => ({ ...prev, ...saved }));
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("auraflow-settings", JSON.stringify(settings));
    } catch (e) {
       console.error("Failed to save settings to localStorage");
    }
  }, [settings]);

  // Animation loop controller
  useEffect(() => {
    if (isRunning && !isPaused) {
      rafId.current = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(rafId.current);
    };
  }, [isRunning, isPaused, loop]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleStartPause();
      }
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        const dir = e.code === "ArrowLeft" ? -1 : 1;
        setSettings(s => {
            const currentVal = s[editTarget];
            const {min, max} = RANGES[editTarget];
            const newVal = Math.max(min, Math.min(max, currentVal + dir));
            return {...s, [editTarget]: newVal };
        });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editTarget]); // Re-bind if editTarget changes, though not strictly necessary here.

  // --- Event Handlers ---
  
  const ensureAudio = () => {
    if (!settings.soundOn || audioCtxRef.current) return;
    try {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) { console.warn("AudioContext not supported"); }
  }

  const handleStartPause = () => {
    if (!isRunning) { // Start
      setIsRunning(true);
      setIsPaused(false);
      setStatusText("Running");
      ensureAudio();
      setPhase(0);
    } else if (!isPaused) { // Pause
      setIsPaused(true);
      setStatusText("Paused");
      pauseElapsedMs.current = performance.now() - phaseStartTime.current;
    } else { // Resume
      setIsPaused(false);
      setStatusText("Running");
      const phaseName = PHASES_ORDER[currentPhaseIndex.current];
      const phaseDurationMs = settings[phaseName] * 1000;
      const resumeProgress = phaseDurationMs > 0 ? Math.min(1, pauseElapsedMs.current / phaseDurationMs) : 0;
      setPhase(currentPhaseIndex.current, resumeProgress);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setStatusText("Ready");
    currentPhaseIndex.current = 0;
    setRingProgress(0);
    // Preview selected edit target
    handleEditTargetChange(editTarget);
  };
  
  const handleEditTargetChange = (target: PhaseKey) => {
    setEditTarget(target);
    if (!isRunning) {
       const visuals = {
        inhale:  { label: "Inhale", color: "var(--inhale)", scale: "1.00" },
        holdIn:  { label: "Hold",   color: "var(--hold)",   scale: "1.00" },
        exhale:  { label: "Exhale", color: "var(--exhale)", scale: "0.85" },
        holdOut: { label: "Hold",   color: "var(--hold)",   scale: "0.85" },
      };
      if (ringRef.current) ringRef.current.style.setProperty("--accent", visuals[target].color);
      if (orbRef.current) orbRef.current.style.setProperty("--scale", visuals[target].scale);
      if (countdownRef.current) countdownRef.current.textContent = Number(settings[target]).toFixed(1);
      if (phaseLabelRef.current) phaseLabelRef.current.textContent = visuals[target].label;
    }
  };

  const totalCycle = PHASES_ORDER.reduce((acc, phase) => acc + settings[phase], 0);

  return (
    <>
      <style>{`
        /* --- This CSS is directly ported from the original HTML file --- */
        :root{
          --bg: #0d1117; --panel: #161b22; --text: #e6edf3; --muted: #8b949e;
          --ring-track: rgba(230, 237, 243, 0.1); --outline: rgba(230, 237, 243, 0.12);
          --inhale: #2dd4bf; --exhale: #a78bfa; --hold: #f59e0b;
        }
        .auraflow-container * { box-sizing: border-box; }
        .auraflow-container { max-width: 960px; margin: 0 auto; color: var(--text); }
        .auraflow-header{ display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .auraflow-stage{ display: grid; grid-template-columns: 1fr; gap: 18px; align-items: center; justify-items: center; margin-top: 10px; margin-bottom: 24px; }
        .auraflow-ring{
          --deg: 0deg; --accent: var(--inhale);
          width: min(80vw, 380px); aspect-ratio: 1/1; border-radius: 50%; position: relative;
          background: conic-gradient(var(--accent) var(--deg), var(--ring-track) var(--deg) 360deg);
          box-shadow: inset 0 0 0 1px var(--outline), 0 10px 40px rgba(0, 0, 0, 0.3);
          display: grid; place-items: center; transition: background 0.4s ease;
        }
        .auraflow-orb{
          --phase-seconds: 4; --scale: 0.85;
          width: 82%; height: 82%; border-radius: 50%;
          background: radial-gradient(100% 100% at 30% 30%, rgba(255,255,255,0.12), transparent 70%),
                      radial-gradient(100% 100% at 70% 70%, rgba(255,255,255,0.1), transparent 60%),
                      var(--panel);
          box-shadow: inset 0 0 60px rgba(255,255,255,0.05), 0 12px 50px rgba(0,0,0,0.2);
          display: grid; place-items: center; transform: scale(var(--scale));
          transition: transform calc(var(--phase-seconds) * 1s) cubic-bezier(0.65, 0, 0.35, 1), background 0.4s ease;
          position: relative; overflow: hidden;
        }
        .auraflow-orb-content{ text-align: center; }
        .auraflow-orb .phase{
          font-size: clamp(16px, 2.4vw, 20px); letter-spacing: 0.5px;
          text-transform: uppercase; font-weight: 600; color: #d0d8e2;
        }
        .auraflow-orb .countdown{
          font-variant-numeric: tabular-nums; font-size: clamp(34px, 6.2vw, 52px);
          font-weight: 700; line-height: 1.1; margin-top: 2px;
          text-shadow: 0 1px 0 rgba(0,0,0,0.2);
        }
        .auraflow-controls{ width: 100%; display: grid; grid-template-columns: 1fr; gap: 16px; }
        .auraflow-panel{ background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
          border: 1px solid var(--outline); border-radius: 16px; padding: 16px;
        }
        .auraflow-actions{ display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
        .auraflow-btn{
          appearance: none; border: 1px solid var(--outline); font-family: inherit;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          color: var(--text); font-size: 15px; border-radius: 10px; padding: 12px 18px;
          font-weight: 600; letter-spacing: 0.2px;
          cursor: pointer; transition: transform 0.1s ease, background 0.2s ease, border-color 0.2s;
        }
        .auraflow-btn:disabled{ opacity: 0.5; cursor: not-allowed; }
        .auraflow-btn.primary{
          border-color: rgba(45,212,191,0.6);
          background: linear-gradient(180deg, rgba(45,212,191,0.25), rgba(45,212,191,0.15));
          box-shadow: 0 6px 24px rgba(45,212,191,0.25);
        }
        .auraflow-btn:hover:not(:disabled){ transform: translateY(-1px); }
        .auraflow-segmented{ display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
        .auraflow-segmented button{
          appearance: none; border: 1px solid var(--outline); font-family: inherit;
          background: transparent; color: var(--muted); font-size: 13px;
          border-radius: 8px; padding: 8px 12px;
          cursor: pointer; font-weight: 600;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
        }
        .auraflow-segmented button[aria-checked="true"]{ background: rgba(255,255,255,0.07); }
        .auraflow-segmented button[data-target="inhale"][aria-checked="true"]{ color: var(--inhale); border-color: var(--inhale); }
        .auraflow-segmented button[data-target="holdIn"][aria-checked="true"]{ color: var(--hold); border-color: var(--hold); }
        .auraflow-segmented button[data-target="exhale"][aria-checked="true"]{ color: var(--exhale); border-color: var(--exhale); }
        .auraflow-segmented button[data-target="holdOut"][aria-checked="true"]{ color: var(--hold); border-color: var(--hold); }
        .auraflow-slider{ display: grid; gap: 8px; margin-top: 14px; }
        .auraflow-slider label{ font-weight: 600; color: #dbe9ff; display: flex; justify-content: space-between; }
        .auraflow-slider input[type="range"]{
          --track-bg: linear-gradient(90deg, var(--inhale), var(--hold), var(--exhale));
          width: 100%; appearance: none; height: 8px; border-radius: 999px;
          background: var(--track-bg);
          outline: none; border: 1px solid var(--outline);
        }
        .auraflow-slider input[type="range"]::-webkit-slider-thumb{
          -webkit-appearance: none; appearance: none;
          width: 24px; height: 24px; border-radius: 50%;
          background: #fff; border: 2px solid rgba(255,255,255,0.7);
          box-shadow: 0 4px 14px rgba(0,0,0,0.3); cursor: pointer;
        }
        .auraflow-chips{ display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 14px; }
        .auraflow-chip{
          border: 1px solid var(--outline); border-radius: 999px; padding: 6px 12px;
          font-weight: 600; color: #cfe3ff; font-size: 13px;
          background: rgba(255,255,255,0.02);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .auraflow-chip::before{ content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
        .auraflow-chip.in::before{ background: var(--inhale); } .auraflow-chip.holdin::before{ background: var(--hold); }
        .auraflow-chip.out::before{ background: var(--exhale); } .auraflow-chip.holdout::before{ background: var(--hold); }
        .auraflow-toggles{ display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: center; }
        .auraflow-toggle{
          display: inline-flex; align-items: center; gap: 8px; font-weight: 600;
          border: 1px solid var(--outline); border-radius: 999px; padding: 6px 10px;
          background: rgba(255,255,255,0.02); cursor: pointer;
        }
        .auraflow-toggle input{ accent-color: #62f0d6; transform: scale(1.1); }
        .auraflow-footer{ margin-top: 24px; text-align: center; }
        .auraflow-muted { color: var(--muted); }
      `}</style>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Waves className="h-8 w-8" />
            AuraFlow Breathing Tool
          </h1>
          <p className="text-muted-foreground mt-2">A guided box breathing exercise to calm the mind and body.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="auraflow-container">
              <header className="auraflow-header">
                <h2 className="text-xl font-bold">Guided Session</h2>
                <div className="auraflow-muted">{statusText}</div>
              </header>

              <section className="auraflow-stage">
                <div className="auraflow-ring" ref={ringRef}>
                  <div className="auraflow-orb" ref={orbRef}>
                    <div className="auraflow-orb-content">
                      <div className="phase" ref={phaseLabelRef}>Inhale</div>
                      <div className="countdown" ref={countdownRef}>{Number(settings.inhale).toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="auraflow-controls">
                <div className="auraflow-panel auraflow-actions">
                  <button className="auraflow-btn primary" onClick={handleStartPause}>
                    {!isRunning ? "Start" : isPaused ? "Resume" : "Pause"}
                  </button>
                  <button className="auraflow-btn" onClick={handleReset} disabled={!isRunning}>
                    Reset
                  </button>
                  <div className="auraflow-toggles">
                    <label className="auraflow-toggle">
                      <input type="checkbox" checked={settings.soundOn} onChange={(e) => setSettings(s => ({...s, soundOn: e.target.checked}))} /> Sound
                    </label>
                    <label className="auraflow-toggle">
                      <input type="checkbox" checked={settings.vibrateOn} onChange={(e) => setSettings(s => ({...s, vibrateOn: e.target.checked}))} /> Vibrate
                    </label>
                  </div>
                </div>

                <div className="auraflow-panel">
                  <div className="auraflow-chips">
                    <span className="auraflow-chip in">Inhale: {settings.inhale}s</span>
                    <span className="auraflow-chip holdin">Hold: {settings.holdIn}s</span>
                    <span className="auraflow-chip out">Exhale: {settings.exhale}s</span>
                    <span className="auraflow-chip holdout">Hold: {settings.holdOut}s</span>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                    <small className="auraflow-muted">Total Cycle: <b>{totalCycle}s</b></small>
                  </div>
                  <div className="auraflow-segmented">
                    {PHASES_ORDER.map(phase => (
                      <button key={phase} type="button" role="radio" data-target={phase}
                        aria-checked={editTarget === phase}
                        onClick={() => handleEditTargetChange(phase)}>
                          {RANGES[phase].label}
                      </button>
                    ))}
                  </div>
                  <div className="auraflow-slider">
                    <label htmlFor="durationSlider">
                      <span>{RANGES[editTarget].label} Duration</span>
                      <span>{settings[editTarget]}s</span>
                    </label>
                    <input id="durationSlider" type="range"
                      min={RANGES[editTarget].min}
                      max={RANGES[editTarget].max}
                      step="1"
                      value={settings[editTarget]}
                      onChange={(e) => setSettings(s => ({ ...s, [editTarget]: parseInt(e.target.value, 10) }))}
                    />
                  </div>
                </div>
              </section>

              <footer className="auraflow-footer">
                <small className="auraflow-muted">Space = Start/Pause. ←/→ = Adjust selected duration.</small>
              </footer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
```
