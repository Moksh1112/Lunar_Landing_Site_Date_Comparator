# Active Azelux SYNTHETIC fixtures
These replace all earlier fixture proposals. Regenerate with `npm run fixtures`.
Every numeric value, coordinate, kernel/DEM reference and terrain image is synthetic.
No downloads/science computation are implied. sites.ok.json entries have verified=false
because example.invalid is not scientific evidence. The default verified-only site
picker should hide them; frontend owner must use a clearly labelled explicit mock
preview or the compare fixture directly until verified sites exist.
Health mock has empty resource lists and mock=true. Sites and errors lack a
contract data_label field: clients must label their mock transport visibly too.
No unapproved schema field is silently added to solve that open contract issue.

Compared with supplied kit: window edges interpolate signed elevation/skyline,
combined windows intersect target windows, longest gaps share the window basis,
and sweep percentages derive from hours. These are fixture-authoring corrections,
not backend implementation or astronomical validation. Timestamps have whole seconds;
rounding tolerance and same-window both-event policy need owner acknowledgment.
