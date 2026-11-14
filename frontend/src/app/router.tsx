import { Link, createBrowserRouter } from "react-router";
import { BestDatePage } from "../features/bestdate/BestDatePage";
import { ComparePage } from "../features/compare/ComparePage";
import { MethodsPage } from "../features/methods/MethodsPage";
import { ReportPage } from "../features/report/ReportPage";
import { AppShell } from "./AppShell";

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
      { path: "/best-date", element: <BestDatePage /> },
      { path: "/methods", element: <MethodsPage /> },
      { path: "/report", element: <ReportPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
