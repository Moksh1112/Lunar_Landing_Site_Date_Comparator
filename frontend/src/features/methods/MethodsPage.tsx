import { Link } from "react-router";
import { useHealthQuery } from "../../app/SyntheticBanner";
import { USE_MOCK } from "../../api/client";
import { GLOSSARY } from "../../components/glossary";
import { EvidenceList } from "./EvidenceList";
import { validationFiles } from "./validationEvidence";
import styles from "./methods.module.css";

const GLOSSARY_ROWS = Object.values(GLOSSARY).map((g) => [g.term, g.definition] as const);

export function MethodsPage() {
  const health = useHealthQuery();
  const files = validationFiles();
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1>Methods and sources</h1>
        <p className={styles.lede}>
          Where every number comes from, what it assumes, and what it does not claim. Validation results appear here once
          the validation owner commits them.
        </p>
      </header>

      <nav aria-label="On this page" className={styles.toc}>
        <a href="#method">Method</a>
        <a href="#data">Data products</a>
        <a href="#visuals">Visualisation credits</a>
        <a href="#validation">Validation</a>
        <a href="#limits">Limits</a>
        <a href="#glossary">Glossary</a>
      </nav>

      <section id="method" className={styles.section}>
        <h2>Method</h2>
        <ol className={styles.steps}>
          <li>
            <strong>Where the Sun and Earth are.</strong> SPICE ephemeris (JPL NAIF DE440) gives Sun and Earth azimuth and
            elevation at the site for every time step, in the MOON_ME body-fixed frame.
          </li>
          <li>
            <strong>Where the skyline is.</strong> Inside verified south-pole LOLA DEM coverage, a skyline (horizon elevation for
            every 0.5° of azimuth) is computed from terrain. Elsewhere the result is labelled <em>geometric horizon only</em>.
          </li>
          <li>
            <strong>Which one is higher.</strong> The Sun (or Earth) counts as visible when its centre is above the skyline at
            its azimuth. Windows, hours, percentages, longest gaps and the verdict follow from that per-step visibility.
          </li>
        </ol>
        <h3>Verdict rule</h3>
        <p>
          Green when every threshold passes. Amber when every metric is within 20 % of its threshold. Red otherwise.
          Thresholds are editable on Compare; the browser recomputes the verdict from the returned metrics without new
          ephemeris. Deltas are always A minus B; the “B compared with A” strip shows the opposite sign, labelled.
        </p>
        <h3>Best-date sweep</h3>
        <p>
          Every landing day in the range (00:00 UTC) is scored on a 30-minute grid, ranked by verdict, then hours with both
          Sun and Earth, then shortest dark gap. The top five are recomputed at a 10-minute step and marked “refined”.
        </p>
      </section>

      <section id="data" className={styles.section}>
        <h2>Data products</h2>
        <dl className={styles.facts}>
          <div><dt>Ephemeris</dt><dd>SPICE DE440 (JPL NAIF), local kernels; JPL Horizons is used only for offline validation.</dd></div>
          <div><dt>Terrain</dt><dd>LOLA south-pole DEMs (20 m near field, 160 m far field) where coverage is verified.</dd></div>
          <div><dt>Horizon modes</dt><dd>terrain, terrain (coarse) or geometric horizon only</dd></div>
          <div>
            <dt>Loaded by this server</dt>
            <dd>
              {health.isPending
                ? "Checking…"
                : health.isError
                  ? "Unavailable: the API did not respond."
                  : `Kernels: ${health.data.kernels_loaded.join(", ") || "none"}. DEMs: ${health.data.dems_loaded.join(", ") || "none"}.`}
              {(USE_MOCK || health.data?.mock) && <> This is a mock server: nothing listed here is a real source.</>}
            </dd>
          </div>
        </dl>
      </section>

      <section id="visuals" className={styles.section}>
        <h2>Visualisation credits</h2>
        <p>The landing page and Simulator are explanatory illustrations. Their body spacing, orientations, lander and diagrams are schematic; they are not computed mission results.</p>
        <ul>
          <li>Moon colour and height preview: <a href="https://svs.gsfc.nasa.gov/4720/">NASA Scientific Visualization Studio CGI Moon Kit</a>, LROC and LOLA instrument teams.</li>
          <li>Earth surface and historical cloud composite: <a href="https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/">NASA Blue Marble</a>, NASA Goddard Space Flight Center, Reto Stöckli; enhancements by Robert Simmon.</li>
          <li>Terrain Analyser uses server DEM tiles. Sun/Earth marker distances, fill lighting and vertical exaggeration aid viewing; brightness is not a shadow or power calculation. Tile sides and base frame the finite display extent; only the top surface represents the DEM.</li>
        </ul>
      </section>

      <section id="validation" className={styles.section}>
        <h2>Validation</h2>
        <p>
          Two cross-checks will be shown here: maximum azimuth and elevation difference against JPL Horizons for the test
          sites, and long-run sunlight and Earth-visibility percentage against NASA PGDA illumination maps per test point.
        </p>
        <EvidenceList files={files} />
      </section>

      <section id="limits" className={styles.section}>
        <h2>Limits</h2>
        <ul className={styles.limits}>
          <li>Planning and education aid only. Not a safety certification.</li>
          <li>Sunlight is not power: Azelux does not predict watts.</li>
          <li>Earth in view is not a radio link: no link is guaranteed.</li>
          <li>Results labelled SYNTHETIC come from fixtures or a mock server and are not real results.</li>
          <li>Visibility uses the centre of the disk; partial Sun at the skyline counts as not visible.</li>
        </ul>
      </section>

      <section id="glossary" className={styles.section}>
        <h2>Glossary</h2>
        <dl className={styles.glossary}>
          {GLOSSARY_ROWS.map(([t, d]) => (
            <div key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p>
        <Link to="/compare">Back to Compare</Link>
      </p>
    </main>
  );
}
