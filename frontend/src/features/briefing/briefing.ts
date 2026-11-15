// Pocket mission briefing: one self-contained HTML file for the current comparison, replayable offline.
// The file carries a versioned snapshot (schema "azelux.briefing" v1) of the exact compare response, the
// request, provenance, and the gap/explanation results computed by ./gap — the embedded script only
// displays them. It makes no network requests; source links are optional http(s) references.
import type { CompareRequest, CompareResponse } from "../../api/types";
import { conclusion } from "../compare/conclusion";
import { METRIC_KEYS, metricLabel, metricUnit } from "../compare/format";
import { buildProvenance, dataLabelOf, type Provenance } from "../export/exportData";
import { validationFiles } from "../methods/validationEvidence";
import { GAP_DEFINITION, compareLongest, explainGap, fmtH, fmtUtc, gapPosition, horizonPhrase, partText, visibilityGaps, type Explanation, type GapResult } from "../gap/gap";

export const BRIEF_SCHEMA = "azelux.briefing";
export const BRIEF_VERSION = 1;

export type BriefSnapshot = {
  schema: typeof BRIEF_SCHEMA;
  version: typeof BRIEF_VERSION;
  generated_at: string;
  data_label: Provenance["data_label"];
  provenance: Provenance;
  response: CompareResponse;
  gaps: { A: GapResult; B: GapResult };
  explanations: { A: Explanation | null; B: Explanation | null };
  gap_comparison: string;
  validation: { id: string; status: string; scope: string; review: string; title: string; sources: string[] }[];
};

export function buildSnapshot(res: CompareResponse, req: CompareRequest | null, now = new Date()): BriefSnapshot {
  const [A, B] = res.scenarios;
  const gaps = { A: visibilityGaps(A), B: visibilityGaps(B) };
  const ex = (s: typeof A, g: GapResult) => (g.state === "gaps" ? explainGap(s, g.longest) : null);
  return {
    schema: BRIEF_SCHEMA,
    version: BRIEF_VERSION,
    generated_at: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    data_label: dataLabelOf(res),
    provenance: buildProvenance(res, req, now),
    response: res,
    gaps,
    explanations: { A: ex(A, gaps.A), B: ex(B, gaps.B) },
    gap_comparison: compareLongest(gaps.A, gaps.B),
    validation: validationFiles().flatMap((f) =>
      f.state === "ok"
        ? [{ id: f.evidence.check_id, status: f.evidence.status, scope: f.evidence.scope, review: f.evidence.review_status, title: f.evidence.title, sources: f.evidence.sources.map((s) => s.reference) }]
        : [],
    ),
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const nums = (x: unknown) => Array.isArray(x) && x.every((v) => typeof v === "number" && Number.isFinite(v));

/** Structural validation of an embedded snapshot (mirrored by the file's runtime check). */
export function validateSnapshot(x: unknown): string | null {
  if (!isObj(x)) return "not an object";
  if (x.schema !== BRIEF_SCHEMA) return "unknown schema";
  if (x.version !== BRIEF_VERSION) return `unsupported version ${String(x.version)}`;
  const r = x.response;
  if (!isObj(r) || !Array.isArray(r.scenarios) || r.scenarios.length !== 2) return "response must have exactly two scenarios";
  for (const s of r.scenarios as unknown[]) {
    if (!isObj(s) || !isObj(s.series) || !isObj(s.windows) || !isObj(s.meta)) return "scenario is incomplete";
    const n = (s.series.t_unix as unknown[] | undefined)?.length ?? 0;
    for (const k of ["t_unix", "sun_el", "earth_el", "sun_vis", "earth_vis"])
      if (!nums(s.series[k]) || (s.series[k] as unknown[]).length !== n) return `series.${k} is invalid`;
  }
  return null;
}

/** HTML-escape untrusted text (labels, names, source text). */
export const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** JSON safe inside <script type="application/json">: no "</script", "<!--" or line separators. */
export const embedJson = (o: unknown): string =>
  JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

/** Only http(s) links are kept; anything else is shown as text. */
export function safeHref(u: string): string | null {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

const fmtMetric = (v: number | null, unit: string) => (v === null ? "n/a" : `${v.toFixed(1)}${unit === "deg" ? "°" : ` ${unit}`}`);
const modeText = (m: string) => (m === "geometric" ? "geometric (geometric horizon only)" : m);
const tr = (cells: string[], head = false) => `<tr>${cells.map((c) => (head ? `<th scope="col">${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`;

function windowsTable(snap: BriefSnapshot): string {
  const rows: string[] = [];
  for (const s of snap.response.scenarios)
    for (const k of ["sun", "earth", "both"] as const)
      for (const w of s.windows[k])
        rows.push(tr([esc(s.id), esc(k === "both" ? "Sun and Earth" : k === "sun" ? "Sun" : "Earth"), esc(w.start), esc(w.end), esc(fmtH(w.hours)), w.start_censored || w.end_censored ? "yes" : "no"]));
  return `<table><caption>Visibility windows (text equivalent of the timeline)</caption><thead>${tr(["Plan", "Visible", "Start (UTC)", "End (UTC)", "Hours", "Touches mission edge"], true)}</thead><tbody>${rows.join("") || tr(["—", "No windows", "", "", "", ""])}</tbody></table>`;
}

function gapSection(snap: BriefSnapshot): string {
  const one = (id: "A" | "B") => {
    const g = snap.gaps[id];
    const s = snap.response.scenarios.find((x) => x.id === id);
    const e = snap.explanations[id];
    const head = `<h3>${s?.label === `Plan ${id}` ? esc(s.label) : `Plan ${esc(id)}: ${esc(s?.label)}`}</h3>`;
    if (g.state === "unavailable") return `${head}<p>Gap unavailable: ${esc(g.reason)}</p>`;
    if (g.state === "none") return `${head}<p>No gap: the Sun and Earth remain visible together throughout the sampled mission (${esc(fmtH(g.missionHours))}).</p>`;
    const ev = e
      ? `<table><caption>Events in Plan ${esc(id)}'s longest gap</caption><thead>${tr(["Time (UTC)", "Event"], true)}</thead><tbody>${e.events.map((x) => tr([esc(fmtUtc(x.tUnix)), esc(x.text)])).join("")}</tbody></table>`
      : "";
    return `${head}<p class="big">${esc(fmtH(g.longest.hours))}</p><p>${esc(fmtUtc(g.longest.startUnix))} to ${esc(fmtUtc(g.longest.endUnix))}; ${esc(gapPosition(g.longest))}.</p>${
      e ? `<p>${esc(e.summary)}</p>${e.parts.length > 1 ? `<ol>${e.parts.map((p) => `<li>${esc(partText(p, e.horizon))}</li>`).join("")}</ol>` : ""}<ul class="notes">${e.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>${ev}` : ""
    }`;
  };
  return `<section aria-labelledby="gap-h"><h2 id="gap-h">Visibility gap</h2><p>${esc(GAP_DEFINITION)}</p><p><strong>${esc(snap.gap_comparison)}</strong></p><div class="two">${["A", "B"].map((id) => `<div>${one(id as "A" | "B")}</div>`).join("")}</div></section>`;
}

const ICON = {
  sun: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="2"/></svg>',
  earth: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
};

// Runtime: validates the snapshot, then replays it (scrubber, A/B readouts, gap and event navigation).
const RUNTIME = String.raw`(function(){
"use strict";
var el=document.getElementById("azx-brief"),app=document.getElementById("replay"),msg=document.getElementById("replay-msg");
function fail(t){msg.textContent="Interactive replay unavailable: "+t+". The summary and tables above remain complete.";}
var d;try{d=JSON.parse(el.textContent);}catch(e){return fail("snapshot could not be read");}
if(!d||d.schema!=="azelux.briefing"||d.version!==1)return fail("unsupported snapshot version");
var S=d.response&&d.response.scenarios;if(!S||S.length!==2)return fail("snapshot does not contain two plans");
for(var i=0;i<2;i++){var se=S[i].series;if(!se||!se.t_unix||se.t_unix.length<2||se.sun_vis.length!==se.t_unix.length||se.earth_vis.length!==se.t_unix.length)return fail("plan "+S[i].id+" series is incomplete");}
function t0(s){return s.series.t_unix[0];}function t1(s){return s.series.t_unix[s.series.t_unix.length-1];}
var mode=d.response.scenarios&&d.provenance&&d.provenance.request&&d.provenance.request.mode==="date_shift"?"mission":"calendar";
var range=document.getElementById("scrub"),out=document.getElementById("scrub-time"),reads=document.getElementById("reads");
function bounds(){return mode==="calendar"?[Math.min(t0(S[0]),t0(S[1])),Math.max(t1(S[0]),t1(S[1]))]:[0,Math.max(t1(S[0])-t0(S[0]),t1(S[1])-t0(S[1]))];}
function abs(s,v){return mode==="calendar"?v:t0(s)+v;}
function near(a,t){var lo=0,hi=a.length-1;while(hi-lo>1){var m=(lo+hi)>>1;if(a[m]<=t)lo=m;else hi=m;}return Math.abs(a[lo]-t)<=Math.abs(a[hi]-t)?lo:hi;}
function utc(t){return new Date(t*1000).toISOString().slice(0,16).replace("T"," ")+" UTC";}
function txt(tag,t,c){var n=document.createElement(tag);n.textContent=t;if(c)n.className=c;return n;}
function render(){var v=Number(range.value),b=bounds();
 out.textContent=mode==="calendar"?utc(v):"mission day "+(Math.floor(v/86400)+1)+", +"+(v/3600).toFixed(1)+" h";
 range.setAttribute("aria-valuetext",out.textContent);reads.textContent="";
 S.forEach(function(s){var t=abs(s,v),box=document.createElement("div");box.className="read";
  box.appendChild(txt("h3",s.label==="Plan "+s.id?s.label:"Plan "+s.id+": "+s.label));
  if(t<t0(s)||t>t1(s)){box.appendChild(txt("p","Outside this plan's mission."));reads.appendChild(box);return;}
  var k=near(s.series.t_unix,t),sv=s.series.sun_vis[k]===1,ev=s.series.earth_vis[k]===1;
  box.appendChild(txt("p","Nearest sample "+utc(s.series.t_unix[k])));
  [["sun","Sun",sv,s.series.sun_el[k]],["earth","Earth",ev,s.series.earth_el[k]]].forEach(function(r){
   var p=document.createElement("p");p.className="pict "+(r[2]?"up":"down");p.innerHTML=document.getElementById("icon-"+r[0]).innerHTML;
   p.appendChild(document.createTextNode(" "+r[1]+": "+(r[2]?"above":"below")+" the computed horizon (elevation "+Number(r[3]).toFixed(2)+"°)"));box.appendChild(p);});
  box.appendChild(txt("p",sv&&ev?"Both visible together.":"Not both visible: inside a visibility gap.",sv&&ev?"both":"gap"));
  reads.appendChild(box);});}
function setMode(m){mode=m;var b=bounds();range.min=b[0];range.max=b[1];range.step=60;range.value=b[0];
 document.querySelectorAll("[data-mode]").forEach(function(x){x.setAttribute("aria-pressed",String(x.getAttribute("data-mode")===m));});render();}
function go(id,t){var s=S[id==="A"?0:1];range.value=mode==="calendar"?t:t-t0(s);render();range.focus();}
range.addEventListener("input",render);
document.querySelectorAll("[data-mode]").forEach(function(x){x.addEventListener("click",function(){setMode(x.getAttribute("data-mode"));});});
document.querySelectorAll("[data-go]").forEach(function(x){x.addEventListener("click",function(){go(x.getAttribute("data-plan"),Number(x.getAttribute("data-go")));});});
app.hidden=false;setMode(mode);
var g=d.gaps.A.state==="gaps"?["A",d.gaps.A.longest]:d.gaps.B.state==="gaps"?["B",d.gaps.B.longest]:null;
if(g){var s0=S[g[0]==="A"?0:1],mid=(g[1].startUnix+g[1].endUnix)/2;range.value=mode==="calendar"?mid:mid-t0(s0);render();}
})();`;

function replaySection(snap: BriefSnapshot): string {
  const gapsNav: string[] = [];
  const evNav: string[] = [];
  for (const id of ["A", "B"] as const) {
    const g = snap.gaps[id];
    const e = snap.explanations[id];
    if (g.state !== "gaps" || !e) continue;
    gapsNav.push(`<button type="button" data-plan="${id}" data-go="${(g.longest.startUnix + g.longest.endUnix) / 2}">Inspect ${id} gap</button>`);
    evNav.push(`<h4>Plan ${id} events</h4>`, ...e.events.map((x) => `<button type="button" class="ev" data-plan="${id}" data-go="${x.tUnix}">${esc(fmtUtc(x.tUnix))}: ${esc(x.text)}</button>`));
  }
  const nav = gapsNav.length ? [`<div>${gapsNav.join("")}</div>`, ...evNav] : [];
  return `<section id="replay" aria-labelledby="replay-h" hidden>
<h2 id="replay-h">Replay</h2>
<p>Move the scrubber (arrow keys work) to read both plans at the same moment.</p>
<div role="group" aria-label="Align plans by" class="seg"><button type="button" data-mode="calendar">Calendar date (UTC)</button><button type="button" data-mode="mission">Mission time</button></div>
<label class="scrub"><span>Time: <output id="scrub-time"></output></span><input id="scrub" type="range"></label>
<div id="reads" class="two" aria-live="polite"></div>
<h3>Jump to a gap or event</h3><div class="nav">${nav.join("") || "<p>No visibility gap to inspect.</p>"}</div>
</section><p id="replay-msg" role="status"></p>
<template id="icon-sun">${ICON.sun}</template><template id="icon-earth">${ICON.earth}</template>`;
}

const CSS = `:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#000;color:#f5f5f5;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:64rem;margin:0 auto;padding:2rem 1rem 4rem}h1{font-size:2rem;line-height:1.15;margin:0 0 .5rem}h2{font-size:1.4rem;margin:2.5rem 0 .75rem;padding-top:1rem;border-top:1px solid #3a3a3a}h3{font-size:1.05rem;margin:1rem 0 .4rem}
p{margin:0 0 .6rem;max-width:72ch}.muted,.notes{color:#b8b8b8;font-size:.9rem}.big{font-size:1.8rem;font-weight:700;margin:.2rem 0}.badge{display:inline-block;border:1px solid #f5f5f5;padding:0 .4rem;font-weight:700;letter-spacing:.05em}
.synthetic{color:#f6c445;border-color:#f6c445}.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1.5rem}
table{width:100%;border-collapse:collapse;margin:.5rem 0 1rem;font-size:.9rem;font-variant-numeric:tabular-nums}caption{text-align:left;font-weight:600;padding:.3rem 0}th,td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid #3a3a3a;vertical-align:top}th{color:#b8b8b8}
.tbl{overflow-x:auto}button{font:inherit;min-height:2.75rem;padding:0 1rem;background:transparent;color:#f5f5f5;border:1px solid #737373;border-radius:6px;cursor:pointer;margin:.2rem .3rem .2rem 0}
button:hover{border-color:#f5f5f5}button[aria-pressed=true]{background:#f5f5f5;color:#000}:focus-visible{outline:2px solid #fff;outline-offset:2px}
.ev{display:block;text-align:left;width:100%;min-height:2.5rem}.scrub{display:grid;gap:.4rem;margin:1rem 0}.scrub input{width:100%;accent-color:#f5f5f5}
.read{border:1px solid #3a3a3a;border-radius:8px;padding:1rem}.pict{display:flex;align-items:center;gap:.4rem;margin:.2rem 0}.up{color:#4fd88a}.down{color:#ff7a7a}.gap{color:#f6c445;font-weight:600}.both{color:#4fd88a;font-weight:600}
dl.gloss dt{font-weight:600}dl.gloss dd{margin:0 0 .6rem;color:#b8b8b8}a{color:#f5f5f5}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
@media print{:root{color-scheme:light}body{background:#fff;color:#111}h2{border-color:#bbb}th,td{border-color:#ccc}th,.muted,.notes,dl.gloss dd{color:#333}#replay,#replay-msg{display:none}.up{color:#127a3a}.down{color:#b42323}.synthetic{color:#7a5600}a{color:#111}}`;

/** The complete self-contained HTML file. */
export function buildBriefingHtml(res: CompareResponse, req: CompareRequest | null, now = new Date()): string {
  const snap = buildSnapshot(res, req, now);
  const [A, B] = res.scenarios;
  const label = snap.data_label;
  const plansRows = res.scenarios.map((s) => {
    const r = req?.scenarios.find((x) => x.id === s.id);
    return tr([
      esc(s.id),
      esc(s.label),
      esc(s.site.name ?? "Custom point"),
      `${esc(s.site.lat_deg)}°, ${esc(s.site.lon_east_deg)}° E`,
      esc(r?.start_utc ?? fmtUtc(s.series.t_unix[0] ?? 0)),
      esc(r ? `${r.mission_hours} h` : "n/a"),
      esc(`${s.meta.step_minutes} min`),
      esc(`${s.meta.observer_height_m} m`),
      esc(modeText(s.meta.horizon_mode)),
      esc(s.meta.data_label),
    ]);
  });
  const metricsRows = METRIC_KEYS.map((k) =>
    tr([esc(metricLabel(k)), esc(fmtMetric(A.metrics[k], metricUnit(k))), esc(fmtMetric(B.metrics[k], metricUnit(k))), esc(fmtMetric(res.deltas[k], metricUnit(k)))]),
  );
  const th = req?.thresholds;
  const val = snap.validation
    .map((v) => tr([esc(v.id), esc(v.status.toUpperCase()), esc(v.scope === "full_check" ? "Full check" : "Spot check"), esc(v.review === "owner_reported" ? "Owner-reported" : "Independently reproduced"), esc(v.title), v.sources.map((u) => { const h = safeHref(u); return h ? `<a href="${esc(h)}">${esc(u)}</a>` : esc(u); }).join("<br>")]))
    .join("");
  const prov = res.scenarios
    .map((s) => tr([esc(s.id), esc(s.meta.ephemeris), esc(s.meta.kernels.join(", ")), esc(s.meta.dem ?? "none"), esc(s.meta.manifest_sha256 ?? "not supplied"), esc(s.meta.contract_version), esc(s.meta.app_version), esc(s.meta.computed_at)]))
    .join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">
<title>Azelux mission briefing: ${esc(A.label)} vs ${esc(B.label)}</title><style>${CSS}</style></head>
<body><main>
<h1>Azelux mission briefing</h1>
<p><span class="badge${label === "REAL" ? "" : " synthetic"}">${esc(label)}</span> ${esc(A.label)} vs ${esc(B.label)}</p>
<p class="muted">Snapshot generated ${esc(snap.generated_at)}. It replays this computed comparison only: it cannot calculate new sites or dates offline, and it does not guarantee that the cited sources are still available. Times are UTC; longitudes are east-positive; differences are A minus B.</p>
${label !== "REAL" ? '<p class="synthetic"><strong>SYNTHETIC:</strong> this comparison used fixed example data, not a real calculation for these plans.</p>' : ""}
<h2>Summary</h2><p><strong>${esc(conclusion(res))}</strong></p>
<p>Verdicts: Plan A ${esc(A.verdict.level.toUpperCase())}${A.verdict.failed.length ? ` (failed: ${esc(A.verdict.failed.join(", "))})` : ""}; Plan B ${esc(B.verdict.level.toUpperCase())}${B.verdict.failed.length ? ` (failed: ${esc(B.verdict.failed.join(", "))})` : ""}.</p>
${gapSection(snap)}
${replaySection(snap)}
<h2>Plans</h2><div class="tbl"><table><thead>${tr(["Plan", "Label", "Site", "Latitude, longitude", "Start (UTC)", "Mission", "Step", "Observer height", "Horizon mode", "Data"], true)}</thead><tbody>${plansRows.join("")}</tbody></table></div>
${th ? `<p class="muted">Thresholds: sunlight ≥ ${esc(th.sun_pct_min)} %, Earth ≥ ${esc(th.earth_pct_min)} %, dark gap ≤ ${esc(th.dark_gap_h_max)} h, Earth blackout ≤ ${esc(th.blackout_h_max)} h.</p>` : ""}
<h2>Metrics</h2><div class="tbl"><table><thead>${tr(["Metric", "Plan A", "Plan B", "A − B"], true)}</thead><tbody>${metricsRows.join("")}</tbody></table></div>
<h2>Visibility windows</h2><div class="tbl">${windowsTable(snap)}</div>
<h2>Sources and methods</h2><p>Positions from SPICE at runtime; visibility is the body centre above ${esc(horizonPhrase(A.meta.horizon_mode))} for Plan A and ${esc(horizonPhrase(B.meta.horizon_mode))} for Plan B.</p>
<div class="tbl"><table><thead>${tr(["Plan", "Ephemeris", "Kernels", "DEM", "Data manifest (SHA-256)", "Contract", "App", "Computed at"], true)}</thead><tbody>${prov}</tbody></table></div>
<h2>Validation status</h2><div class="tbl"><table><thead>${tr(["Check", "Status", "Scope", "Review", "Title", "Sources"], true)}</thead><tbody>${val || tr(["—", "No validation files bundled", "", "", "", ""])}</tbody></table></div>
<p class="muted">PGDA comparison: V4 (this app's body-centre rule) stays a recorded FAIL. V4b, using the reference's any-visible-fraction disc rule hourly at the same five points and 5-point target, passes all ten rows and is the acceptance basis adopted by Moksh on 15 Nov 2026. V4b validates a different visibility definition, so it does not show that the centre-based results in this briefing match PGDA within 5 points. V6 is an owner-reviewed qualitative check, not independent certification.</p>
<h2>Limitations</h2><ul>${[...res.limitations, snap.provenance.disclaimer].map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<h2>Glossary</h2><dl class="gloss">
<dt>Visibility gap</dt><dd>${esc(GAP_DEFINITION)}</dd>
<dt>Computed horizon</dt><dd>The skyline used for each plan: terrain from elevation maps, or a smooth-sphere horizon when no terrain applies.</dd>
<dt>UTC</dt><dd>Coordinated Universal Time. All times here are UTC.</dd>
<dt>Touches mission edge (censored)</dt><dd>The interval reaches the mission start or end, so it may extend beyond the mission.</dd>
<dt>A − B</dt><dd>Plan A's value minus Plan B's value.</dd></dl>
</main>
<script type="application/json" id="azx-brief">${embedJson(snap)}</script>
<script>${RUNTIME}</script>
</body></html>`;
}

export const briefingFileName = (res: CompareResponse, now = new Date()) =>
  `azelux-briefing-${res.scenarios[0].meta.data_label.toLowerCase()}-${now.toISOString().slice(0, 16).replace(/[:T]/g, "")}.html`;
