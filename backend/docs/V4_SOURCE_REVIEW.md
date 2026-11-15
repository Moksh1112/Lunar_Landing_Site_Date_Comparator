# V4 scientific source review — 15 November 2026

The centre-rule V4 result remains FAIL: 7.785% sunlight versus 14.084% PGDA at
(-88, 90 E), a 6.299 percentage-point difference, exceeding the <=5 target.
No point, runtime visibility rule or acceptance tolerance was changed.

Official source review:
- PGDA 69: https://pgda.gsfc.nasa.gov/products/69
- Solar label: https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/AVGVISIB_85S_060M_201608.LBL
- The label describes nonzero illumination for any fraction of the solar disc.
  The runtime/PRD uses the body's centre. This affects Sun as well as Earth.
- The reference is based on LDEM_85S_060M, mean Earth/polar axis DE421, 60 m pixels,
  with DN*0.00004 scaling. Our skyline uses the newer PGDA 90 DEM plus far terrain.
- Label START_TIME/STOP_TIME (2009–2013) accompany LOLA acquisition metadata.
  They do not establish the 18.6-year illumination averaging epoch; do not treat
  them as the simulation interval. PGDA describes hourly samples over 18.6 years.

New, separate diagnostic (validation/V4-disc-sensitivity.json):
- Same point, terrain, daily samples and 2000 start as the failed V4 test.
- Centre: 7.785%; adding a fixed 0.27 degree solar radius: 10.066%.
- Reference: 14.084%; 3x3 pixel neighbourhood: 13.120–14.520%.
- The approximate limb diagnostic differs by 4.018 percentage points. It explains
  2.281 points of the original gap, but is NOT an exact disc model or a V4 pass.
  Skyline variation across the solar disc, changing radius, reference epoch and
  terrain differences remain unaccounted for.

Reproduce the diagnostic from repository root:

    node scripts/python.mjs backend/tools/diagnose_disc_visibility.py

It prints JSON only. Save output with the host shell to avoid OneDrive Python write
locks. It does not overwrite validation/results/V4-illumination.json.

Decision: preserve the failed centre-rule acceptance result and expose the confirmed
semantic mismatch. Further like-for-like scientific comparison needs the reference
averaging epoch and terrain/disc conventions; this cannot be fixed by changing a UI
label or relaxing the target. No repeated coarse/20 m attempt is proposed.

V6 is separate: PRD 8.3 assigns a qualitative review to P2. Its new reproducible
runner and explicit owner assessment record the observed ranges without a fabricated
numeric tolerance. It remains a spot check, not external scientific validation.
