import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { postCompare, USE_MOCK } from "../../api/client";
import type { CompareRequest, CompareResponse } from "../../api/types";
import { useStore } from "../../store";
import { TimelineLanes } from "../compare/TimelineLanes";
import { conclusion } from "../compare/conclusion";
import {
  LEVEL_TITLE,
  PRACTICE_STEPS,
  SIM_SITES,
  START_CONSOLE,
  currentStep,
  dayToDate,
  hintFor,
  operate,
  qualification,
  qualifyStart,
  QUALIFY_HOURS,
  requestFor,
  score,
  type Attempt,
  type Console,
  type Control,
  type Level,
} from "./levels";
import type { World } from "./world";
import { ClickBurst } from "../../components/motion/ClickBurst";
import { MagneticHover } from "../../components/motion/MagneticHover";
import styles from "./sim.module.css";
import { AppHeader } from "../../app/AppHeader";

const CONTROL_LABEL: Record<Control, string> = { site: "Site", date: "Date", mission: "Mission", plan: "Plan A/B", compare: "Compare" };
const DEMO_STEPS = [
  { title: "Read the sky", text: "The gold dotted curve represents the Sun's path. Grey is an illustrative ridge. A body below the ridge is hidden. This scene explains the idea; the comparator calculates real visibility.", control: null, view: "moon" },
  { title: "Choose a site", text: "SITE chooses where both plans land. Each click moves to the next location. Watch the site name on the display. Try the highlighted dial or Site button below.", control: "site", view: "console" },
  { title: "Choose a landing day", text: "DATE changes the landing day of the plan you are editing. Click for the next day; Shift-click or use the minus button for the previous day. Dates are UTC.", control: "date", view: "console" },
  { title: "Choose mission length", text: "MISSION cycles between 240, 480 and 708 hours. This is how long we measure sunlight and Earth visibility after landing.", control: "mission", view: "console" },
  { title: "Switch between plans", text: "PLAN A/B changes which landing date you edit. Both plans use the same site and mission length here. Keep A as your baseline, then change B's date.", control: "plan", view: "console" },
  { title: "Compare the plans", text: "COMPARE sends both plans to the backend. Green means your thresholds are met, not that a landing is safe. In this walkthrough the button only explains its purpose; practice makes the real request.", control: "compare", view: "console" },
] as const;

export function SimulatorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const navigate = useNavigate();
  const thresholds = useStore((s) => s.thresholds);
  const setMode = useStore((s) => s.setMode);
  const setScenario = useStore((s) => s.setScenario);
  const setLastCompare = useStore((s) => s.setLastCompare);
  const setScrubT = useStore((s) => s.setScrubT);

  const [gl, setGl] = useState<"loading" | "ok" | "off">("loading");
  const [level, setLevel] = useState<Level>("boot");
  const [con, setCon] = useState<Console>(START_CONSOLE);
  const [hint, setHint] = useState<string | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const demo = DEMO_STEPS[demoIndex];
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false); // synchronous guard: two fast clicks must not send two requests
  const [last, setLast] = useState<{ request: CompareRequest; response: CompareResponse } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef<HTMLDialogElement>(null);
  const pauseStarted = useRef<number | null>(null);
  const [debriefScrubT, setDebriefScrubT] = useState<number | null>(null);
  const [t0, setT0] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // ---------- world lifecycle ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let world: World | null = null;
    let cancelled = false;
    import("./world")
      .then(({ createWorld }) => {
        if (cancelled) return;
        world = createWorld(canvas);
        worldRef.current = world;
        if (import.meta.env.DEV) (window as unknown as { __azxWorld?: World }).__azxWorld = world;
        setGl("ok");
      })
      .catch(() => !cancelled && setGl("off"));
    const onResize = () => world?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      world?.dispose();
      worldRef.current = null;
    };
  }, []);

  const step = currentStep(con);
  const glow: Control | null = level === "practice" ? PRACTICE_STEPS[step].control : level === "demo" ? demo.control : null;
  const done: Partial<Record<Control, boolean>> = {};
  if (level === "practice") PRACTICE_STEPS.slice(0, step).forEach((s) => (done[s.control] = true));
  useEffect(() => worldRef.current?.setConsole(con, glow, done), [con, glow, gl, level, step]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => worldRef.current?.setLevel(level), [level, gl]);

  // ---------- level transitions ----------
  const go = useCallback((l: Level) => {
    setLevel(l);
    if (l === "demo") setDemoIndex(0);
    if (l === "practice") setCon(START_CONSOLE);
    if (l === "qualify") setCon((previous) => qualifyStart(previous));
    setHint(null);
    const w = worldRef.current;
    if (l === "briefing") w?.setView("briefing");
    if (l === "practice" || l === "qualify") w?.setView("console");
    if (l === "debrief") w?.setView("window");
    if (l === "qualify") {
      setT0(performance.now());
      setSeconds(0);
      setAttempts([]);
    }
  }, []);

  // User-paced demonstration: no disappearing explanations or timed camera jumps.
  useEffect(() => {
    if (level === "demo") worldRef.current?.setView(demo.view);
    const frame = requestAnimationFrame(() => worldRef.current?.resize());
    return () => cancelAnimationFrame(frame);
  }, [level, demoIndex, demo.view, gl]);

  useEffect(() => {
    if (level !== "qualify" || paused) return;
    const id = window.setInterval(() => setSeconds((performance.now() - t0) / 1000), 500);
    return () => clearInterval(id);
  }, [level, t0, paused]);
  useEffect(() => {
    if (level !== "qualify") { pauseStarted.current = null; return; }
    if (paused) pauseStarted.current = performance.now();
    else if (pauseStarted.current !== null) {
      const duration = performance.now() - pauseStarted.current;
      setT0(previous => previous + duration);
      pauseStarted.current = null;
    }
  }, [paused, level]);
  useEffect(() => {
    if (paused) pauseRef.current?.showModal();
    else pauseRef.current?.close();
  }, [paused]);

  // ---------- compare via the real typed client ----------
  const runCompare = async (c: Console) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    const request = requestFor(c, thresholds);
    setBusy(true);
    setHint(null);
    try {
      const response = await postCompare(request);
      setLast({ request, response });
      setDebriefScrubT(null);
      return { response, synthetic: response.scenarios.some((s) => s.meta.data_label !== "REAL") };
    } catch (e) {
      setHint(`The comparator could not compute this request: ${(e as Error).message} Your settings are kept; press COMPARE to try again.`);
      return null;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const use = async (control: Control, delta = 1) => {
    if (busy || paused) return;
    if (level === "demo") {
      if (control !== demo.control) return setHint(`This step explains ${demo.title.toLowerCase()}. Use Next to explore another control.`);
      if (control === "compare") return setHint("Compare will calculate real Sun/Earth windows in practice. Select Start practice when ready.");
      setCon((previous) => operate(previous, control, delta));
      setHint(`${CONTROL_LABEL[control]} updated. Watch the display above the dials.`);
      return;
    }
    if (level === "practice") {
      const h = hintFor(con, control);
      if (h) return setHint(h);
      setHint(null);
      if (control === "compare") {
        const r = await runCompare(con);
        if (r) go("qualify");
        return;
      }
      setCon(operate(con, control, delta));
      return;
    }
    if (level === "qualify") {
      if (control === "site" || control === "mission") return setHint("Qualification keeps the site and mission fixed. Change Plan B's date.");
      if (control === "plan") return setHint("This challenge edits Plan B only. Plan A remains your baseline.");
      if (control === "date") return setCon(operate({ ...con, plan: "B" }, "date", delta));
      const r = await runCompare(con);
      if (!r) return;
      const next = [...attempts, { dayB: con.dayB, verdictB: r.response.scenarios[1].verdict.level, synthetic: r.synthetic }];
      setAttempts(next);
      if (qualification(next).done) go("debrief");
    }
  };

  useEffect(() => { worldRef.current?.onPick((c, shift) => void use(c, shift ? -1 : 1)); });

  // ---------- look + pause input ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let drag: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => (drag = { x: e.clientX, y: e.clientY });
    const move = (e: PointerEvent) => {
      if (!drag || e.buttons === 0) return;
      worldRef.current?.look((e.clientX - drag.x) * 0.004, (e.clientY - drag.y) * 0.004);
      drag = { x: e.clientX, y: e.clientY };
    };
    const up = () => (drag = null);
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || document.querySelector('nav[aria-label="Main"][data-open="true"]') || document.activeElement?.closest("[data-app-header]")) return;
      if (pauseRef.current?.open) return; // Native dialog handles Escape and restores focus.
      if (e.key === "Escape") { e.preventDefault(); setPaused((p) => !p); return; }
      if (document.activeElement !== canvas) return;
      const k = e.key.toLowerCase();
      const m: Record<string, [number, number]> = { arrowleft: [-0.08, 0], a: [-0.08, 0], arrowright: [0.08, 0], d: [0.08, 0], arrowup: [0, -0.06], w: [0, -0.06], arrowdown: [0, 0.06], s: [0, 0.06] };
      if (m[k]) {
        e.preventDefault();
        worldRef.current?.look(...m[k]);
      }
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
    };
  }, []);

  const openInComparator = () => {
    if (!last) return navigate("/compare");
    const [a, b] = last.request.scenarios;
    setMode("date_shift");
    for (const [id, s] of [["A", a], ["B", b]] as const)
      setScenario(id, {
        label: s.label,
        siteId: s.site.site_id,
        siteName: s.site.name,
        lat: String(s.site.lat_deg),
        lon: String(s.site.lon_east_deg),
        startUtc: s.start_utc.slice(0, 16),
        missionHours: String(s.mission_hours),
      });
    setScrubT(null);
    setLastCompare(last);
    navigate("/compare");
  };

  const replay = () => {
    setCon(START_CONSOLE);
    setAttempts([]);
    setLast(null);
    go("briefing");
  };

  const q = qualification(attempts);
  const synthetic = last?.response.scenarios.some((s) => s.meta.data_label !== "REAL") ?? USE_MOCK;
  const twinDisabled = busy || paused || !(level === "demo" || level === "practice" || level === "qualify");

  return (
    <div className={styles.page}>
      <AppHeader expert={false} />
    <main className={styles.sim} data-guided={level === "demo" || level === "practice" || level === "qualify"}>
      <canvas ref={canvasRef} className={styles.canvas} data-state={gl} tabIndex={0} aria-label="3D mission control room (illustration). Drag or use the arrow keys or WASD to look around; use the console controls below." />

      {/* HUD: level + objective */}
      {level !== "boot" && (
        <header className={styles.hudTop}>
          <span className={styles.levelTag}>{LEVEL_TITLE[level]}</span>
          <span className={styles.row}>
            {gl === "ok" && level !== "briefing" && (
              <button type="button" onClick={() => worldRef.current?.setView(level === "demo" ? demo.view : level === "debrief" ? "window" : "console")}>
                Reset camera
              </button>
            )}
          </span>
        </header>
      )}

      {level === "boot" && (
        <section className={styles.boot} aria-labelledby="sim-title">
          <h1 id="sim-title">Pick the landing day at the lunar south pole</h1>
          <p>Two weeks can turn a sunlit site dark. Learn the console, then find a day that keeps the Sun and Earth in view.</p>
          <div className={styles.row}>
            <MagneticHover reach={40} damping={6} maxShift={6}>
              <ClickBurst color="#ffffff" radius={22} rays={8}>
                <button type="button" className="btn-primary" onClick={() => go("briefing")} autoFocus>Start mission</button>
              </ClickBurst>
            </MagneticHover>
            <Link to="/compare" className="btn">Open the comparator</Link>
            <Link to="/" className="btn">Back to home</Link>
          </div>
          <p className={styles.keys}>{gl === "off" ? "3D unavailable: same steps in 2D." : "Drag to look · Esc to pause"}</p>
        </section>
      )}

      {level === "briefing" && (
        <section className={styles.card} aria-labelledby="brief-h">
          <h2 id="brief-h">Briefing</h2>
          <ul>
            <li>At the lunar south pole the Sun skims the horizon.</li>
            <li>Terrain can block it, and Earth can dip behind the skyline.</li>
            <li>A two-week date shift can turn day into night.</li>
          </ul>
          <p className={styles.goal}>Goal: choose a landing plan that keeps the Sun and Earth in view.</p>
          <button type="button" className="btn-primary" onClick={() => go("demo")}>Watch the demonstration</button>
        </section>
      )}

      {level === "demo" && (
        <aside className={styles.guide} aria-labelledby="demo-h">
          <p className={styles.note}>Demonstration · {demoIndex + 1} of {DEMO_STEPS.length}</p>
          <h2 id="demo-h">{demo.title}</h2>
          <p>{demo.text}</p>
          <div className={styles.row}>
            <button type="button" disabled={demoIndex === 0} onClick={() => { setHint(null); setDemoIndex((i) => i - 1); }}>Previous</button>
            {demoIndex < DEMO_STEPS.length - 1
              ? <button type="button" className="btn-primary" onClick={() => { setHint(null); setDemoIndex((i) => i + 1); }}>Next: {DEMO_STEPS[demoIndex + 1].title}</button>
              : <button type="button" className="btn-primary" onClick={() => go("practice")}>Start practice</button>}
          </div>
          <button type="button" onClick={() => worldRef.current?.setView(demo.view)}>Reset camera</button>
        </aside>
      )}

      {(level === "practice" || level === "qualify") && (
        <aside className={styles.checklist} aria-label={level === "practice" ? "Practice checklist" : "Qualification"}>
          {level === "practice" ? (
            <ol>
              {PRACTICE_STEPS.map((s, i) => (
                <li key={s.id} data-state={i < step ? "done" : i === step ? "now" : "todo"}>
                  {s.text}
                </li>
              ))}
            </ol>
          ) : (
            <div>
              <p className={styles.goal}>Find a GREEN Plan B day at {SIM_SITES[con.site].name} for a {QUALIFY_HOURS} h stay.</p>
              <p className={styles.note}>A full 708 h lunar day is never GREEN here, so the challenge uses 10 days.</p>
              <p className={styles.stats}><span>{q.left} attempts left</span><span>{Math.round(seconds)} s</span></p>
              {USE_MOCK && (
                <p className={styles.note}>
                  <strong>SYNTHETIC</strong> mock data returns one fixed example and cannot pass.
                </p>
              )}
              <button type="button" disabled={busy} onClick={() => go("debrief")}>End challenge</button>
              {attempts.map((a, i) => (
                <p key={i} className={styles.attempt}>
                  {i + 1}. B {dayToDate(a.dayB)}: <strong>{a.verdictB ?? "error"}</strong>
                  {a.synthetic && " (synthetic)"}
                </p>
              ))}
            </div>
          )}
        </aside>
      )}

      {(level === "demo" || level === "practice" || level === "qualify") && (
        <div className={styles.dock}>
          <p className={styles.state} aria-live="polite">
            {SIM_SITES[con.site].name}, editing Plan {con.plan}. A {dayToDate(con.dayA)}, B {dayToDate(con.dayB)}, {con.hours} h
          </p>
          {level === "qualify" && <p className={styles.note}>Only Plan B's date can change.</p>}
          {hint && <p className={styles.hint} role="status">HINT {hint}</p>}
          {busy && <p className={styles.hint} role="status">Computing…</p>}
          <div className={styles.twin} role="group" aria-label="Console controls">
            {(["site", "mission", "plan"] as const).map((c) => (
              <button key={c} type="button" disabled={twinDisabled || (level === "demo" && glow !== c) || (level === "qualify" && (c === "site" || c === "mission" || c === "plan"))} data-glow={glow === c} onClick={() => void use(c)}>
                {CONTROL_LABEL[c]}
              </button>
            ))}
            <span className={styles.dateGroup} data-glow={glow === "date"}>
              <button type="button" disabled={twinDisabled || (level === "demo" && glow !== "date")} onClick={() => void use("date", -1)} aria-label="Date back one day"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg></button>
              Date
              <button type="button" disabled={twinDisabled || (level === "demo" && glow !== "date")} onClick={() => void use("date", 1)} aria-label="Date forward one day"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg></button>
            </span>
            <button type="button" className="btn-primary" disabled={twinDisabled || (level === "demo" && glow !== "compare")} data-glow={glow === "compare"} onClick={() => void use("compare")}>
              Compare
            </button>
          </div>
        </div>
      )}

      {level === "debrief" && (
        <section className={`${styles.card} ${styles.debrief}`} aria-labelledby="debrief-h">
          <h2 id="debrief-h">Debrief</h2>
          {synthetic && (
            <p className={styles.synthetic}>
              <strong>SYNTHETIC</strong> Mock example; it ignores your dials and cannot qualify.
            </p>
          )}
          <p className={styles.result}>{q.passed
              ? `Challenge passed · score ${score(attempts, seconds)}`
              : attempts.length === 0
                ? "Challenge ended without a scored attempt."
                : "Not passed this time."}</p>
          {last && (
            <>
              <p>{conclusion(last.response)}</p>
              <ul className={styles.verdicts}>
                {last.response.scenarios.map((s) => (
                  <li key={s.id}>
                    Plan {s.id}, landing {new Date(s.series.t_unix[0] * 1000).toISOString().slice(0, 10)}:{" "}
                    <strong data-level={s.verdict.level}>{s.verdict.level}</strong> ({s.meta.horizon_mode === "geometric" ? "geometric horizon only" : s.meta.horizon_mode}, {s.meta.data_label}
                    {s.meta.dem ? `, DEM ${s.meta.dem}` : ""})
                  </li>
                ))}
              </ul>
              <div className={styles.timeline}>
                <TimelineLanes data={last.response} alignBy="calendar" scrubT={debriefScrubT} onScrub={setDebriefScrubT} />
              </div>
            </>
          )}
          <div className={styles.row}>
            <ClickBurst color="#ffffff" radius={22} rays={8}>
              <button type="button" className="btn-primary" onClick={openInComparator}>Open in the comparator</button>
            </ClickBurst>
            <button type="button" onClick={replay}>Replay</button>
          </div>
        </section>
      )}

        <dialog ref={pauseRef} className={styles.pause} aria-labelledby="pause-h" onCancel={e => { e.preventDefault(); setPaused(false); }}>
          <h2 id="pause-h">Paused</h2>
          <div className={styles.row}>
            <button type="button" className="btn-primary" onClick={() => setPaused(false)} autoFocus>Resume</button>
            <button type="button" onClick={() => { setPaused(false); replay(); }}>Restart</button>
            <Link to="/compare" className="btn">Open comparator</Link>
            <Link to="/" className="btn">Back to home</Link>
          </div>
        </dialog>
    </main>
    </div>
  );
}
