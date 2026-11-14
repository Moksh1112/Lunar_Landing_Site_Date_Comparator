import { Link, createBrowserRouter } from "react-router";
import { ComparePage } from "../features/compare/ComparePage";
import { MethodsPage } from "../features/methods/MethodsPage";
import { ReportPage } from "../features/report/ReportPage";
import { AppShell } from "./AppShell";

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
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <ComparePage /> },
      { path: "/best-date", element: <Placeholder title="Best date" /> },
      { path: "/methods", element: <MethodsPage /> },
      { path: "/report", element: <ReportPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
