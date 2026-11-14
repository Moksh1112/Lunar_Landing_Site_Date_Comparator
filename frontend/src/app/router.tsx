import { Link, createBrowserRouter } from "react-router";

// Placeholder pages: replaced by real features in later tasks.
function Placeholder({ title }: { title: string }) {
  return (
    <main>
      <h1>{title}</h1>
      <p>Placeholder page.</p>
    </main>
  );
}

function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to Compare</Link>
      </p>
    </main>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Placeholder title="Compare" /> },
  { path: "/best-date", element: <Placeholder title="Best date" /> },
  { path: "/methods", element: <Placeholder title="Methods" /> },
  { path: "/report", element: <Placeholder title="Report" /> },
  { path: "*", element: <NotFound /> },
]);
