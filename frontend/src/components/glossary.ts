// PRD 6.4 plain-language glossary. One source for inline help (Term) and the Methods page.
export const GLOSSARY = {
  solar_elevation: {
    term: "Solar elevation",
    definition: "How high the centre of the Sun is above the local horizontal plane, in degrees.",
  },
  skyline: {
    term: "Skyline",
    definition: "The terrain horizon: for every compass direction, the elevation angle of the highest terrain seen from the site.",
  },
  earthset: {
    term: "Earthset",
    definition: "The moment Earth's centre drops below the skyline at the site.",
  },
  libration: {
    term: "Libration",
    definition: "The Moon's slow wobble as seen from Earth, which moves Earth around a small patch of the lunar sky.",
  },
  dte: {
    term: "DTE",
    definition: "Direct-to-Earth communication: a link that needs Earth above the skyline. Azelux reports visibility only, never a guaranteed link.",
  },
  geometric: {
    term: "Geometric horizon only",
    definition: "No terrain data was used: the horizon is a smooth sphere. Shown on every result that uses it.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
