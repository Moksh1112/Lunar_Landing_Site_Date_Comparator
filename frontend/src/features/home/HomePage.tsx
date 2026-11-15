import { Link } from "react-router";
import moon from "../landing/assets/moon_lroc_color_4k.jpg";
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
          <Link to={PATHS.simulator} className={styles.quiet}>Try the simulator</Link>
        </div>
        <img className={styles.moon} src={moon} alt="The Moon, LROC colour mosaic" width="1200" height="1200" decoding="async" />
      </section>

      <section className={styles.pillars} aria-label="What you can do">
        {PILLARS.map((p) => (
          <div key={p.title} className={styles.pillar}>
            <h2>{p.title}</h2>
            <p>{p.text}</p>
          </div>
        ))}
      </section>
      <p className={styles.credit}>Moon image: NASA LROC visualization mosaic (SVS CGI Moon Kit).</p>
    </div>
  );
}
