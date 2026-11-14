import { Link } from "react-router";

export function ReportPage() {
  return (
    <main>
      <h1>Report</h1>
      <p>Content pending, owner TBD (P6). Export is not available yet.</p>
      <h2>Limits</h2>
      <ul>
        <li>Planning and education aid only.</li>
        <li>Not a safety certification.</li>
        <li>Sunlight is not power: this is not a wattage prediction.</li>
        <li>Earth in view is not a radio link: no link is guaranteed.</li>
      </ul>
      <p>
        <Link to="/">Back to Compare</Link>
      </p>
    </main>
  );
}
