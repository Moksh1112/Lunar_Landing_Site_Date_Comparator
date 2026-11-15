export function viewerErrorHint(message: string): string {
  if (/useMemo|useRef|useState|Invalid hook call|dispatcher/i.test(message))
    return "The 3D viewer's React code could not initialize. Refresh this page to load the current app code. This error does not indicate missing terrain data.";
  if (/import|fetch.*module|chunk/i.test(message))
    return "The 3D viewer code could not load. Refresh the page after checking your connection to the app.";
  return "The graphics viewer could not initialize. Close other 3D tabs and check that browser graphics acceleration is enabled.";
}
