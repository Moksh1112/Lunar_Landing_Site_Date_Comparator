# P1 current library source review - 15 November 2026

Reviewed the ten entries in backend source `7d6ac55`, unchanged in integration
`38f72b7`, against the linked primary source pages opened during takeover.
The real `/api/v1/sites` response also contained ten entries. This review verifies
the published coordinate transcription; it does not certify reference-frame
equivalence to runtime DE440, terrain installation or full F1 breadth.

| Entry | Latitude, east longitude in repository | Primary source / finding |
| --- | --- | --- |
| IM-1 Odysseus | -80.13, 1.44 | [NASA LRO release](https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/) matches both coordinates. North of the implemented south-polar terrain limit. |
| IM-2 Athena | -84.7906, 29.1957 | [LROC actual landing site](https://lroc.im-ldi.com/images/1408) matches. |
| IM-2 intended | -84.78, 29.13 | [LROC planned target](https://lroc.im-ldi.com/images/1401) matches; explicitly a target, not the actual landing. |
| Apollo 11 LM | 0.67416, 23.47314 | [NASA NSSDCA](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html) lunar-module row matches. |
| Apollo 12 LM | -3.0128, 336.5781 | Same NASA table: -23.4219 longitude normalized by adding 360. |
| Apollo 14 LM | -3.64589, 342.52806 | Same NASA table: -17.47194 longitude normalized by adding 360. |
| Apollo 15 LM | 26.13239, 3.6333 | Same NASA table, lunar-module row matches. |
| Apollo 16 LM | -8.9734, 15.5011 | Same NASA table, lunar-module row matches. |
| Apollo 17 LM | 20.1911, 30.7723 | Same NASA table, lunar-module row matches. |
| LCROSS Centaur impact | -84.6796, 311.2907 | [NASA NTRS abstract](https://ntrs.nasa.gov/citations/20140005563): -48.7093 longitude normalized by adding 360; latitude uncertainty 115 m and longitude uncertainty 44 m retained. Not a landing site. |

The NASA Apollo source identifies its coordinates as planetocentric DE421 Mean
Earth/Polar Axis. LM rows were used, not reflector/ALSEP positions. Reference-frame
conventions remain an owner/scientific concern; this audit does not transform them.

Coverage inventory: six Apollo entries, three CLPS entries and one impact reference.
There is no `international` or separate `commercial` entry, and no verified Artemis
candidate point. CLPS entries do not satisfy missing international representation.
F1 remains partial until the owner supplies official sources and approved coverage
or the Coordinator explicitly revises scope. No invented coordinates or owner-source
edits were made. The approved v1.1 `reference` group is documented in the contract;
the older v1.0 enum example does not supersede that activation.
