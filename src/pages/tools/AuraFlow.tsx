import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ToolPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ToolPlaceholder({ title, description, icon: Icon }: ToolPlaceholderProps) {
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
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="auraflow-container">
            <div className="app">
              <header>
                <h1><span className="dot"></span> AuraFlow</h1>
                <div className="muted" id="statusText">Ready</div>
              </header>

              <section className="stage" aria-live="polite">
                <div className="ring" id="ring">
                  <div className="orb" id="orb" aria-live="polite" aria-atomic="true">
                    <div className="orb-content">
                      <div className="phase" id="phaseLabel">Inhale</div>
                      <div className="countdown" id="countdown">4.0</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="controls">
                <div className="panel actions">
                  <button className="btn primary" id="startPauseBtn">Start</button>
                  <button className="btn" id="resetBtn" disabled>Reset</button>
                  <div className="toggles">
                    <label className="toggle"><input type="checkbox" id="soundToggle" checked /> Sound</label>
                    <label className="toggle"><input type="checkbox" id="vibrateToggle" /> Vibrate</label>
                  </div>
                </div>

                <div className="panel">
                  <div className="chips">
                    <span className="chip in">Inhale: <span id="inhaleChip">4</span>s</span>
                    <span className="chip holdin">Hold: <span id="holdInChip">2</span>s</span>
                    <span className="chip out">Exhale: <span id="exhaleChip">6</span>s</span>
                    <span className="chip holdout">Hold: <span id="holdOutChip">2</span>s</span>
                  </div>
                  <div style={{textAlign: 'center', marginBottom: '14px'}}>
                    <small className="muted">Total Cycle: <b id="totalCycle">14s</b></small>
                  </div>

                  <div className="segmented" role="radiogroup" aria-label="Adjust duration for">
                    <button type="button" role="radio" data-target="inhale">Inhale</button>
                    <button type="button" role="radio" data-target="holdIn">Hold In</button>
                    <button type="button" role="radio" data-target="exhale">Exhale</button>
                    <button type="button" role="radio" data-target="holdOut">Hold Out</button>
                  </div>

                  <div className="slider">
                    <label htmlFor="durationSlider">
                      <span id="sliderTitle">Inhale Duration</span>
                      <span><span id="sliderValue">4</span>s</span>
                    </label>
                    <input id="durationSlider" type="range" min="1" max="20" step="1" value="4" />
                  </div>
                </div>
              </section>

              <footer>
                <small className="muted">Space = Start/Pause. ←/→ = Adjust selected duration.</small>
              </footer>
            </div>
          </div>

          <style jsx>{`
            .auraflow-container {
              --bg: #0d1117;
              --panel: #161b22;
              --text: #e6edf3;
              --muted: #8b949e;
              --ring-track: rgba(230, 237, 243, 0.1);
              --outline: rgba(230, 237, 243, 0.12);
              --inhale: #2dd4bf;
              --exhale: #a78bfa;
              --hold: #f59e0b;
            }

            * { box-sizing: border-box; }
            
            .app {
              max-width: 960px;
              margin: 0 auto;
              padding: 20px clamp(16px, 4vw, 32px) 48px;
              background:
                radial-gradient(1200px 800px at 80% -10%, rgba(167,139,250,0.15), transparent 60%),
                radial-gradient(1200px 800px at -10% 110%, rgba(45,212,191,0.15), transparent 60%),
                var(--bg);
              color: var(--text);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
              border-radius: 12px;
              border: 1px solid var(--outline);
            }

            header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 16px;
            }

            header h1 {
              margin: 0;
              font-size: clamp(24px, 3.5vw, 32px);
              letter-spacing: 0.2px;
              display: flex;
              align-items: center;
              gap: 12px;
            }

            header h1 .dot {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--inhale), var(--hold), var(--exhale));
              box-shadow: 0 0 16px rgba(167,139,250,0.5), 0 0 28px rgba(45,212,191,0.4);
            }

            .muted {
              color: var(--muted);
              font-size: 14px;
            }

            .stage {
              display: grid;
              grid-template-columns: 1fr;
              gap: 18px;
              align-items: center;
              justify-items: center;
              margin-top: 10px;
              margin-bottom: 24px;
            }

            .ring {
              --deg: 0deg;
              --accent: var(--inhale);
              width: min(80vw, 380px);
              aspect-ratio: 1/1;
              border-radius: 50%;
              position: relative;
              background: conic-gradient(var(--accent) var(--deg), var(--ring-track) var(--deg) 360deg);
              box-shadow:
                inset 0 0 0 1px var(--outline),
                0 10px 40px rgba(0, 0, 0, 0.3);
              display: grid;
              place-items: center;
              transition: background 0.4s ease;
            }

            .orb {
              --phase-seconds: 4;
              --scale: 0.85;
              width: 82%;
              height: 82%;
              border-radius: 50%;
              background: radial-gradient(100% 100% at 30% 30%, rgba(255,255,255,0.12), transparent 70%),
                          radial-gradient(100% 100% at 70% 70%, rgba(255,255,255,0.1), transparent 60%),
                          var(--panel);
              box-shadow:
                inset 0 0 60px rgba(255,255,255,0.05),
                0 12px 50px rgba(0,0,0,0.2);
              display: grid;
              place-items: center;
              transform: scale(var(--scale));
              transition:
                transform calc(var(--phase-seconds) * 1s) cubic-bezier(0.65, 0, 0.35, 1),
                background 0.4s ease;
              position: relative;
              overflow: hidden;
            }

            .orb-content {
              text-align: center;
            }

            .orb .phase {
              font-size: clamp(16px, 2.4vw, 20px);
              letter-spacing: 0.5px;
              text-transform: uppercase;
              font-weight: 600;
              color: #d0d8e2;
            }

            .orb .countdown {
              font-variant-numeric: tabular-nums;
              font-size: clamp(34px, 6.2vw, 52px);
              font-weight: 700;
              line-height: 1.1;
              margin-top: 2px;
              text-shadow: 0 1px 0 rgba(0,0,0,0.2);
            }

            .controls {
              width: 100%;
              display: grid;
              grid-template-columns: 1fr;
              gap: 16px;
            }

            .panel {
              background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
              border: 1px solid var(--outline);
              border-radius: 16px;
              padding: 16px;
            }

            .actions {
              display: flex;
              gap: 12px;
              align-items: center;
              flex-wrap: wrap;
              justify-content: center;
            }

            .btn {
              appearance: none;
              border: 1px solid var(--outline);
              background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
              color: var(--text);
              font-size: 15px;
              border-radius: 10px;
              padding: 12px 18px;
              font-weight: 600;
              letter-spacing: 0.2px;
              cursor: pointer;
              transition: transform 0.1s ease, background 0.2s ease, border-color 0.2s;
            }

            .btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .btn.primary {
              border-color: rgba(45,212,191,0.6);
              background: linear-gradient(180deg, rgba(45,212,191,0.25), rgba(45,212,191,0.15));
              box-shadow: 0 6px 24px rgba(45,212,191,0.25);
            }

            .btn:hover:not(:disabled) {
              transform: translateY(-1px);
            }

            .btn:active:not(:disabled) {
              transform: translateY(0);
            }

            .segmented {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              justify-content: center;
            }

            .segmented [role="radio"] {
              appearance: none;
              border: 1px solid var(--outline);
              background: transparent;
              color: var(--muted);
              font-size: 13px;
              border-radius: 8px;
              padding: 8px 12px;
              cursor: pointer;
              font-weight: 600;
              transition: background 0.2s, color 0.2s, border-color 0.2s;
            }

            .segmented [role="radio"][aria-checked="true"] {
              background: rgba(255,255,255,0.07);
            }

            .segmented [role="radio"][data-target="inhale"][aria-checked="true"] {
              color: var(--inhale);
              border-color: var(--inhale);
            }

            .segmented [role="radio"][data-target="holdIn"][aria-checked="true"] {
              color: var(--hold);
              border-color: var(--hold);
            }

            .segmented [role="radio"][data-target="exhale"][aria-checked="true"] {
              color: var(--exhale);
              border-color: var(--exhale);
            }

            .segmented [role="radio"][data-target="holdOut"][aria-checked="true"] {
              color: var(--hold);
              border-color: var(--hold);
            }

            .slider {
              display: grid;
              gap: 8px;
              margin-top: 14px;
            }

            .slider label {
              font-weight: 600;
              color: #dbe9ff;
              display: flex;
              justify-content: space-between;
            }

            input[type="range"] {
              --track-bg: linear-gradient(90deg, var(--inhale), var(--hold), var(--exhale));
              width: 100%;
              appearance: none;
              height: 8px;
              border-radius: 999px;
              background: var(--track-bg);
              outline: none;
              border: 1px solid var(--outline);
            }

            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #fff;
              border: 2px solid rgba(255,255,255,0.7);
              box-shadow: 0 4px 14px rgba(0,0,0,0.3);
              cursor: pointer;
            }

            .chips {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              justify-content: center;
              margin-bottom: 14px;
            }

            .chip {
              border: 1px solid var(--outline);
              border-radius: 999px;
              padding: 6px 12px;
              font-weight: 600;
              color: #cfe3ff;
              font-size: 13px;
              background: rgba(255,255,255,0.02);
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }

            .chip::before {
              content: '';
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }

            .chip.in::before {
              background: var(--inhale);
            }

            .chip.holdin::before {
              background: var(--hold);
            }

            .chip.out::before {
              background: var(--exhale);
            }

            .chip.holdout::before {
              background: var(--hold);
            }

            .toggles {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              align-items: center;
              justify-content: center;
            }

            .toggle {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-weight: 600;
              border: 1px solid var(--outline);
              border-radius: 999px;
              padding: 6px 10px;
              background: rgba(255,255,255,0.02);
            }

            .toggle input {
              accent-color: #62f0d6;
              transform: scale(1.1);
            }

            footer {
              margin-top: 24px;
              text-align: center;
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  );
}
