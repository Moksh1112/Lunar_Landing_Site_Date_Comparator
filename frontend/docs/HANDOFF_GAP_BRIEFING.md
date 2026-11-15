# Visibility gap, Explain this interval, offline briefing (15 Nov 2026)

Branch `feat/p4-frontend-s0` (frontend owner). Based on integration `60ab2b5`. Authorized by the
user as an Iteration-1 extension. It does not change science, thresholds, the API contract or
the backend.

## What it answers

"When do I lose simultaneous Sun and Earth visibility, what does the computed data show during
that interval, and how does the other plan differ?"

## 1. Start with the gap

**Definition, as shown in the UI:** "An interval when the Sun and Earth are not both above the
selected horizon." It makes no power or radio-link claim.

**Semantics** (`src/features/gap/gap.ts`). These match backend
`app/metrics/windows.py::longest_gap_hours` exactly:

- **Mission span:** first to last `series.t_unix` sample.
- **Gaps:** the parts of that span not covered by canonical `windows.both`. The window edges
  used are the backend's interpolated, second-rounded times. Stretches under 1 s are rounding
  and are ignored.
- **Edge gaps** are included and flagged:
  - Touching the start: "may have begun earlier".
  - Touching the end: "may continue".
- **Longest gap:** the maximum duration; on a tie the earliest wins.
- **Edge states:**
  - Whole-mission gap: shown directly.
  - No gap: "remain visible together throughout the sampled mission".
  - Fewer than 2 samples or unreadable windows: "unavailable", never a fabricated gap.

**Default focus:** each newly computed comparison opens on Plan A's longest gap, or B's if A
has none, or the mission start if neither has one.

- The shared scrubber is set to the gap midpoint.
- Date-shift comparisons switch to mission-relative alignment.
- User focus and scrubber survive threshold edits and navigation. Switching alignment
  re-expresses the focused gap.
- Results stored without a fresh compare (the simulator handoff) keep mission start, as before.

**UI:**

- "Inspect A gap" and "Inspect B gap" buttons (`aria-pressed`).
- A dashed outline of the focused gap across that plan's three timeline lanes.
- A labelled A/B sentence: "Longest visibility gap: Plan A x h, Plan B y h. Plan … is shorter
  by z h". It only says which plan is shorter, from the measured values.
- The canonical A−B metrics are unchanged.

## 2. Explain this interval

`explainGap()` is deterministic. It uses no AI and no external request.

- **Split points:** the gap is split at every canonical `windows.sun` and `windows.earth` edge
  inside it. Each part's cause is sun, earth, both, or "windows disagree".
- **Summary:** a single part gets one sentence. Several parts get a total time per cause plus
  an ordered list of the parts.
- **Event list:** an expandable list; each event button moves the shared scrubber to that time.
- **At the selected time:** the nearest sample's Sun and Earth azimuth/elevation, the skyline
  elevation at that azimuth, and the returned visibility bit, all with units.
- **Wording follows `horizon_mode`:**
  - "computed terrain skyline"
  - "computed coarse-terrain skyline (160 m DEM)"
  - "geometric horizon (smooth sphere, no terrain)"; in this mode no terrain obstruction is
    stated.
- No named terrain features are given.
- **Notes** state the step-limited edge precision and censoring.
- **Provenance** is shown beside it: data label, mode, DEM, ephemeris and step.
- **Where it appears:** the comparator, the Report (static), the JSON export (`visibility_gaps`),
  CSV `#` lines, and the briefing.

## 3. Pocket mission briefing

Export → "Download offline briefing (HTML)" downloads one file:

- **Snapshot:** schema `azelux.briefing` v1 (`src/features/briefing/briefing.ts`).
- **Contents:**
  - the exact compare response and request;
  - provenance, the same as the JSON export;
  - gap and explanation results from the shared functions;
  - the bundled V1–V6 validation status (V4 FAIL shown as is, with the disc-convention note;
    V6 "owner-reviewed qualitative").
- **Runtime checks:** the embedded script validates the schema, version and series lengths
  before replaying, and shows a recoverable message if they fail.
- **Without JavaScript:** a full static summary, plans, thresholds, metrics with A−B, a
  windows table (the text equivalent of the timeline), gaps and explanations with event
  tables, sources/methods with hashes, validation, limitations and a glossary.
- **With JavaScript, adds:**
  - a keyboard scrubber with calendar/mission alignment;
  - A/B readouts with Sun/Earth pictograms and text labels;
  - gap and event jump buttons.
- **Safety:**
  - All untrusted text is escaped.
  - Embedded JSON escapes `<`, `>`, `&` and U+2028/2029, so there is no `</script>` breakout.
  - Links are http(s) only.
  - CSP `default-src 'none'`; no remote fonts, images, scripts or analytics.
  - Optional source links need internet to follow; viewing does not.
- **Print:** white paper with dark text; the replay section is hidden.
- **Limits** (stated in the file): it is a snapshot generated at a recorded time. It cannot
  compute new sites or dates and does not guarantee the sources are still available.
- **Size:** proportional to the response. A real 708 h, 10 min, two-plan comparison gave a
  file of about 409 KB. No rasters, kernels or textures are embedded.
- **On error:** if generation fails, an alert is shown and the result is kept.

## Checks (actual)

- **Unit tests:** `tsc -b`, `eslint src` clean; `vitest` 175 passed (27 new):
  - **Gap cases:** no gap, whole mission, multiple gaps with edge gaps, ties, censoring,
    unavailable, different mission lengths.
  - **Causes:** Sun-only, Earth-only and changing causes.
  - **Modes and labels:** geometric and coarse wording, synthetic label.
  - **A/B:** labelled sentence, calendar/mission scrubber values.
  - **Briefing:** snapshot parity with the JSON export and its round trip through the HTML;
    malicious labels, quotes and closing-script sequences; http(s)-only links; no remote
    references; no-script and print content.
  - **Store focus:** default A, date-shift mission alignment, focus kept under threshold
    edits, alignment re-expression, handoff reset.
- **Build:** OK.
- **Real backend** (own instance, mock:false, manifest `1dcb16ff…`, CDP headless Edge,
  `C:/azx/gap_e2e.mjs`). Starter comparison, REAL `terrain_coarse` / `far_160m`:
  - **Default focus:** opens on Plan A's whole-mission gap (708.0 h) with the timeline
    outline. B is 652.4 h (2 gaps, end-censored). "Plan B's longest gap is shorter by 55.6 h."
  - **Inspect B:** shows 3 parts (Earth only 11.5 h, both 342.9 h, Sun only 298.0 h).
  - **Event jump:** moves the scrubber. The reading at 2026-03-30 12:00 shows Sun el 0.34° below
    the 2.89° skyline and Earth 0.56° above 0.46°, consistent with the returned bits.
  - **Keyboard:** arrow keys move the scrubber; focus is not snapped back.
- **Downloaded file opened offline** (the network emulated offline, then reloaded):
  - The replay renders; keyboard scrubbing and gap/event jumps work.
  - **Zero** non-file network requests.
  - Print media gives a white body and #111 text, with the replay hidden.
  - With page JavaScript disabled at 375 and 1440 px: the full summary shows, the replay stays
    hidden, and there is no horizontal overflow.
- **Final artifact:** after the last edits, a fresh download was re-checked. File
  `azelux-briefing-real-…html`, 408 KB, SHA-256 `fb43777623d8c80e6bd8c6977d00177ae2b298c8d67c68c99b6687a07e48afa3`.
  It passed the same offline replay, keyboard, jump, print and no-JavaScript checks, with
  0 network requests.
- **Layout sweep** (`C:/azx/mono_sweep.mjs`):
  - 8 routes at 320×640, 375×812, 768×1024, 1440×900, 1440×600 and 1280×560.
  - Result, 48/48: no horizontal overflow, no clipped control, black body, no script errors.
- **Existing journeys on this build, real backend** (`C:/azx/nav_flow.mjs`):
  - Tour → Compare.
  - Legacy redirects with query and hash kept.
  - Back fallbacks and browser Back/Forward.
  - The 404 page, and the Learn and mobile menus with Escape.
  - Best Date → Load as Plan B.
  - Result kept across navigation.
  - Report print: white paper, 8 SVGs, REAL label.
  - Simulator qualification passed, with the handoff "+210.1 h".
  - Plain simulator exit.
  - Home → Compare: the script clicked before the lazy page rendered. A manual re-check in the
    browser pane (link ready after 1.1 s) reached `/compare`.

## Not verified / limits

- No physical devices, other browsers or screen-reader speech. Viewport emulation only.
- No human usability participants.
- The briefing replays the snapshot's samples. It is not a calculator.
- Event times inherit the sample step's interpolation precision.
- V4 remains FAIL (see `backend/docs/V4_DECISION_2026-11-15.md`).
