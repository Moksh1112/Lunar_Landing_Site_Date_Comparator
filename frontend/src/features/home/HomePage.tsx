import { Link } from "react-router";
import { HomeMoon } from "./HomeMoon";
import { PATHS } from "../../app/routes";
import styles from "./home.module.css";

const PILLARS = [
  { title: "Compare two plans side by side", text: "Pick a site and landing time for Plan A and Plan B and see both over the same mission." },
  { title: "See what a date change does", text: "Shift the landing day and watch sunlight and Earth contact move with it." },
  { title: "Read Sun, Earth and the overlap together", text: "One timeline shows when the Sun is up, when Earth is in view, and when you get both." },
];

export function HomePage() {
  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-h">
        <div className={styles.copy}>
          <h1 id="home-h">Compare lunar landing sites and dates.</h1>
          <p className={styles.lede}>
            Compare two plans to see when the Sun and Earth are above the local horizon, and how changing the site or
            the date changes that.
          </p>
          <div className={styles.actions}>
            <Link to={PATHS.compare} className="btn btn-primary">Compare landing plans</Link>
            <Link to={PATHS.tour} className="btn">What is Azelux?</Link>
          </div>
          <Link to={PATHS.simulator} className={styles.simCta}>
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
        <HomeMoon />
      </section>

      <section className={styles.pillars} aria-label="What you can do">
        {PILLARS.map((p) => (
          <div key={p.title} className={styles.pillar}>
            <h2>{p.title}</h2>
            <p>{p.text}</p>
          </div>
        ))}
      </section>
      <p className={styles.credit}>Moon texture: NASA LROC visualization mosaic (SVS CGI Moon Kit). Satellite is illustrative.</p>
    </div>
  );
}
