import { createBrowserRouter } from "react-router";
import { routeObjects } from "./routeObjects";

/** Route map: see ./routes.ts (PATHS, legacy redirects, back fallbacks). */
export const router = createBrowserRouter(routeObjects);
