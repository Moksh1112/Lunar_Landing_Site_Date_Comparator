import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { MoonScene, Readout } from "./moonScene";
import styles from "./landing.module.css";

const CHAPTERS = 5;
const SITE_NAMES = { A: "IM-2 Athena", B: "IM-1 Odysseus" } as const;

/** Standalone landing page (outside the app shell): problem → method → proof, over a scroll-driven 3D scene. */
export function LandingPage() {
  const { pathname } = useLocation();
  const storyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webgl, setWebgl] = useState<"loading" | "ok" | "off">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    const story = storyRef.current;
    if (!canvas || !story) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      try {
        const [{ createMoonScene }, gsapMod, stMod] = await Promise.all([
          import("./moonScene"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (cancelled) return;
        const scene = createMoonScene(canvas);
        setWebgl("ok");
        const onResize = () => scene.resize();
        window.addEventListener("resize", onResize);
        cleanups.push(() => window.removeEventListener("resize", onResize), () => scene.dispose());

        const chapters = [...story.querySelectorAll<HTMLElement>("[data-chapter]")];
        if (reduce) {
          // Reduced motion: no scrubbing; each chapter shows its view as it becomes current.
          const io = new IntersectionObserver(
            (entries) =>
              entries.forEach(
                (e) => e.isIntersecting && scene.setProgress(Number(e.target.getAttribute("data-chapter")) / (CHAPTERS - 1)),
              ),
            { threshold: 0.5 },
          );
          chapters.forEach((c) => io.observe(c));
          cleanups.push(() => io.disconnect());
        } else {
          const gsap = gsapMod.gsap;
          const { ScrollTrigger } = stMod;
          gsap.registerPlugin(ScrollTrigger);
          const ctx = gsap.context(() => {
          const state = { p: 0 };
          const tween = gsap.to(state, { p: 1, ease: "none", onUpdate: () => scene.setProgress(state.p) });
          ScrollTrigger.create({
            trigger: story,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            animation: tween,
          });
          }, story);
          cleanups.push(() => ctx.revert());
        }
      } catch {
        if (!cancelled) setWebgl("off"); // no WebGL: the text and diagrams carry the page alone
      }
    })();
    return () => {
      cancelled = true;
      cleanups.forEach((f) => f());
    };
  }, []);

  return (
    <div className={styles.landing}>
      <a href="#landing-main" className={styles.skip}>Skip to content</a>
      <header className={styles.top}>
        <Link to="/" className={styles.brand} aria-label="Azelux home">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 13.5 L8 11 L11 12.5 L15 9.5 L21 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Azelux
        </Link>
        <nav aria-label="Landing" className={styles.topNav}>
          <a href="#h-problem">Problem</a>
          <a href="#h-method">Method</a>
          <a href="#h-sim">Simulation</a>
          <a href="#h-proof">Proof</a>
        </nav>
        <ThemeToggle />
        {pathname !== "/" && <Link to="/" className={`btn ${styles.launch} ${styles.homeLink}`}>Back to home</Link>}
        <Link to="/compare" className={`btn btn-primary ${styles.launch}`}>Open comparator</Link>
      </header>

      <main id="landing-main" tabIndex={-1}>
        <div className={styles.story} ref={storyRef}>
          <div className={styles.stage} aria-hidden="true">
            <canvas ref={canvasRef} className={styles.canvas} data-state={webgl} />
          </div>

          <section className={`${styles.chapter} ${styles.hero}`} data-chapter="0" aria-labelledby="h-hero">
            <div className={styles.panel}>
              <h1 id="h-hero" className={styles.display}>
                Land where the Sun and Earth stay in view.
              </h1>
              <p className={styles.lead}>
                Azelux compares two lunar landing plans, site and date, hour by hour: sunlight for power, Earth in view
                for direct-to-Earth contact, and the hours you get both.
              </p>
              <div className={styles.ctas}>
                <Link to="/compare" className={`btn btn-primary ${styles.cta}`}>Compare two plans</Link>
                <Link to="/best-date" className={`btn ${styles.cta} ${styles.ghost}`}>Find the best date</Link>
              </div>
              <Link to="/learn/simulator" className={styles.simCta}>
                <svg className={styles.simIcon} viewBox="0 0 32 32" aria-hidden="true">
                  <rect x="3" y="9" width="26" height="15" rx="7.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M10 13.5v6M7 16.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="21" cy="15" r="1.6" fill="currentColor" /><circle cx="24.5" cy="18.5" r="1.6" fill="currentColor" />
                </svg>
                <span className={styles.simText}>
                  <strong>Try the simulator</strong>
                  <span>Fly a mission console in 3D and find a landing day that keeps the lights on.</span>
                </span>
                <svg className={styles.simArrow} viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
          </section>

          <section className={styles.chapter} data-chapter="1" aria-labelledby="h-problem">
            <div className={styles.panel}>
              <h2 id="h-problem">At the south pole, the Sun barely rises.</h2>
              <p>
                Near the lunar south pole the Sun circles a few degrees above or below the horizon. A ridge kilometres
                away can block it, and Earth can dip behind the same skyline.
              </p>
              <ul className={styles.facts}>
                <li><strong>708 h</strong><span>one lunar day, about 29.5 Earth days</span></li>
                <li><strong>A few °</strong><span>how high the Sun gets near the pole</span></li>
                <li><strong>2 weeks</strong><span>a date shift can turn day into night for a whole mission</span></li>
              </ul>
            </div>
          </section>

          <section className={styles.chapter} data-chapter="2" aria-labelledby="h-method">
            <div className={styles.panel}>
              <h2 id="h-method">How Azelux answers it.</h2>
              <p>Every result comes from three steps, run for both plans at their requested dates and sample step.</p>
              <ol className={styles.steps}>
                <li><strong>Where the Sun and Earth are.</strong> NASA SPICE (DE440) gives their azimuth and elevation at the site (10-minute default for comparisons).</li>
                <li><strong>Where the skyline is.</strong> Inside south-pole coverage, LOLA terrain gives the horizon in every direction; elsewhere the result says "geometric horizon only".</li>
                <li><strong>Which one is higher.</strong> Visible when the body's centre clears the skyline. Windows, gaps, A − B deltas and a verdict follow.</li>
              </ol>
              <PipelineDiagram />
            </div>
          </section>

          <section className={styles.chapter} data-chapter="3" aria-labelledby="h-compare">
            <div className={styles.panel}>
              <h2 id="h-compare">Two plans, one timeline.</h2>
              <p>
                Plan A and Plan B land on the same axis, so you see when each has sunlight, Earth and both, and where
                they differ. Scrub to any moment to read both skies at once.
              </p>
              <TimelineDiagram />
              <ul className={styles.ticks}>
                <li>Green, amber or red verdict against thresholds you set</li>
                <li>Best-date finder that loads the best day as Plan B</li>
                <li>CSV, JSON and a printable report with provenance</li>
              </ul>
            </div>
          </section>

          <section className={styles.chapter} data-chapter="4" aria-labelledby="h-proof">
            <div className={styles.panel}>
              <h2 id="h-proof">Labelled, sourced, honest.</h2>
              <figure className={styles.example}>
                <figcaption>Example computed on a local server with SPICE DE440</figcaption>
                <p className={styles.exampleLine}>IM-1 Odysseus site, two 240 h missions two weeks apart:</p>
                <div className={styles.exampleNums}>
                  <span><b className={styles.a}>A</b> 1 Mar 2027 <strong>0 h</strong> sunlight</span>
                  <span><b className={styles.b}>B</b> 15 Mar 2027 <strong>224.6 h</strong> sunlight</span>
                </div>
                <p className={styles.note}>
                  Geometric horizon only (the site is north of the 80.7° S terrain limit). A recorded computation from an earlier local run, not a live result or validation.
                </p>
              </figure>
              <ul className={styles.ticks}>
                <li>Every result names its ephemeris, horizon mode and terrain data.</li>
                <li>Full V1/V2 ephemeris checks are recorded in Methods. Terrain-map comparison V4 still fails its target; see the published results and limitations.</li>
                <li>No safety certification, no wattage prediction, no guaranteed radio link.</li>
              </ul>
            </div>
          </section>
        </div>

        <SimSection />

        <section className={styles.close} aria-labelledby="h-close">
          <h2 id="h-close">Pick two plans and see the difference.</h2>
          <p>The comparator computes a starter example on first visit; edit either plan to explore your own comparison.</p>
          <div className={styles.ctas}>
            <Link to="/compare" className={`btn btn-primary ${styles.cta}`}>Compare landing plans</Link>
            <Link to="/learn/simulator" className={`btn ${styles.cta} ${styles.ghost}`}>Try the simulator</Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Azelux: a planning and education aid. Not a safety certification, power prediction or guaranteed radio link.</span>
        <nav aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/best-date">Best date</Link>
          <Link to="/methods">Methods</Link>
        </nav>
      </footer>
    </div>
  );
}

function PipelineDiagram() {
  const nodes = ["SPICE ephemeris", "Terrain skyline", "Visibility per step", "Verdict + deltas"];
  return (
    <svg className={styles.diagram} viewBox="0 0 640 96" role="img" aria-label="Pipeline: SPICE ephemeris, then terrain skyline, then visibility per step, then windows, deltas and verdict.">
      {nodes.map((n, i) => (
        <g key={n} transform={`translate(${i * 162},18)`}>
          <rect width="138" height="56" rx="6" className={i === 3 ? styles.nodeStrong : styles.node} />
          <text x="69" y="33" textAnchor="middle" className={i === 3 ? styles.nodeTextStrong : styles.nodeText}>{n}</text>
          {i < 3 && <path d="M142 28 h16 m-6 -5 l6 5 l-6 5" className={styles.arrow} />}
        </g>
      ))}
    </svg>
  );
}

function TimelineDiagram() {
  const lanes = [
    { label: "A Sun", cls: styles.laneA, bars: [[0, 120], [260, 520]] },
    { label: "A Earth", cls: styles.laneA, bars: [[0, 300], [360, 560]] },
    { label: "B Sun", cls: styles.laneB, bars: [[80, 300], [430, 560]] },
    { label: "B Earth", cls: styles.laneB, bars: [[0, 180], [330, 560]] },
  ];
  return (
    <figure className={styles.timeline}>
      <svg viewBox="0 0 640 132" role="img" aria-label="Schematic timeline: lanes for Plan A and Plan B sunlight and Earth visibility on one time axis.">
        {lanes.map((l, i) => (
          <g key={l.label} transform={`translate(0,${i * 30 + 6})`}>
            <text x="0" y="15" className={styles.laneLabel}>{l.label}</text>
            <line x1="76" x2="636" y1="22" y2="22" className={styles.laneRule} />
            {l.bars.map(([s, e]) => <rect key={s} x={76 + s} y="4" width={e - s} height="16" rx="2" className={l.cls} />)}
          </g>
        ))}
        <line x1="76" x2="76" y1="0" y2="128" className={styles.laneRule} />
        <line x1="410" x2="410" y1="0" y2="128" className={styles.scrub} />
      </svg>
      <figcaption>Schematic. The comparator draws this from real responses.</figcaption>
    </figure>
  );
}

/** Hands-on 3D simulation: orbit the Moon, sweep the Sun through a lunar day, land at A or B. */
function SimSection() {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<MoonScene | null>(null);
  const [hours, setHours] = useState(0);
  const [read, setRead] = useState<Readout | null>(null);
  const [state, setState] = useState<"idle" | "ok" | "off">("idle");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let scene: MoonScene | null = null;
    let cancelled = false;
    const start = async () => {
      try {
        const { createMoonScene } = await import("./moonScene");
        if (cancelled) return;
        scene = createMoonScene(canvas, { interactive: true });
        sceneRef.current = scene;
        setRead(scene.setSunHours(0));
        setState("ok");
      } catch {
        if (!cancelled) setState("off");
      }
    };
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(canvas);
    const onResize = () => scene?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      io.disconnect();
      window.removeEventListener("resize", onResize);
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const fmt = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}°`;
  return (
    <section className={styles.sim} aria-labelledby="h-sim">
      <div className={styles.simHead}>
        <h2 id="h-sim">Explore an illustrative mission.</h2>
        <p>Orbit the Moon and move a schematic Sun through a 708-hour cycle. This demonstrates the controls, not the conditions of an actual mission.</p>
        <p role="note">SYNTHETIC: invented Sun/Earth directions, smooth-sphere visibility, no SPICE or terrain computation. Site names locate markers only.</p>
      </div>
      <div className={styles.simGrid}>
        <div className={styles.simStage}>
          <canvas
            ref={ref}
            className={styles.simCanvas}
            data-state={state}
            tabIndex={0}
            aria-label="Synthetic interactive Moon illustration. Drag, or focus and use Control/Command plus arrow keys, to orbit; scroll or pinch to zoom."
          />
          <p className={styles.simNote}>Illustration with a smooth-sphere horizon. Terrain-aware results come from the comparator.</p>
        </div>
        <div className={styles.simPanel}>
          <div role="group" aria-label="Landing site" className={styles.siteSwitch}>
            {(["A", "B"] as const).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={read?.site === id}
                disabled={state !== "ok"}
                onClick={() => sceneRef.current && setRead(sceneRef.current.landAt(id))}
              >
                <b className={id === "A" ? styles.a : styles.b}>{id}</b> Land at {SITE_NAMES[id]}
              </button>
            ))}
          </div>
          <label className={styles.slider}>
            <span>
              Illustrative hour <output>{hours} h</output>
            </span>
            <input
              type="range"
              aria-label="Illustrative hour (synthetic)"
              min={0}
              max={708}
              step={6}
              value={hours}
              disabled={state !== "ok"}
              onChange={(e) => {
                const h = Number(e.target.value);
                setHours(h);
                if (sceneRef.current) setRead(sceneRef.current.setSunHours(h));
              }}
            />
          </label>
          <dl className={styles.readout} aria-live="polite">
            <div>
              <dt>Site</dt>
              <dd>{read ? `${read.site}: ${SITE_NAMES[read.site]}` : state === "off" ? "3D unavailable" : "Loading…"}</dd>
            </div>
            <div>
              <dt className={styles.sunText}>Illustrative Sun elevation</dt>
              <dd>{read ? `${fmt(read.sunElDeg)} ${read.sunUp ? "above" : "below"} the horizon` : "–"}</dd>
            </div>
            <div>
              <dt className={styles.earthText}>Illustrative Earth elevation</dt>
              <dd>{read ? `${fmt(read.earthElDeg)} ${read.earthUp ? "in view" : "below the horizon"}` : "–"}</dd>
            </div>
          </dl>
          {state === "off" && <p className={styles.simNote}>3D is unavailable in this browser; the comparator works without it.</p>}
          <Link to="/compare" className={`btn btn-primary ${styles.cta}`}>Get terrain-aware numbers</Link>
        </div>
      </div>
    </section>
  );
}
