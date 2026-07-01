// Ethical Tech CoLab profile used to ground AI grant scoring.
// Edit this to sharpen how the scorer judges fit — it is the single source of
// truth the model reads when valuing every opportunity.

export const ETC_MISSION = {
  organization: "Ethical Tech CoLab (ETC)",
  mission:
    "The Ethical Tech CoLab advances the ethical, equitable, and human-centered use of technology. We research, prototype, and advocate for responsible technology — including but not limited to AI — and build tools and capacity for communities, mission-driven organizations, artists, and policymakers to use technology for the public good.",
  focusAreas: [
    "Responsible / ethical AI",
    "Algorithmic accountability and audits",
    "Digital equity and inclusion",
    "Climate and technology",
    "Technology to combat human trafficking",
    "Technology for the arts and creative sector",
    "Technology governance and policy (support for policymakers)",
    "Good / responsible use of technology broadly",
    "Community-centered technology design",
    "Capacity building for nonprofits and public-interest technologists",
  ],
  strengths: [
    "Applied research with published outputs",
    "Prototyping and open-source tooling",
    "Community and stakeholder engagement",
    "Bridges technologists, communities, artists, and policymakers",
    "Small, senior team — high-quality but limited bandwidth",
  ],
  constraints: [
    "Limited grant-writing bandwidth — effort cost matters",
    "Prefer grants that fund staff time and applied work over pure overhead",
    "Avoid opportunities that require capabilities we do not have (e.g. large-scale clinical trials, hardware manufacturing)",
  ],
  // Important framing for the scorer:
  breadth:
    "ETC is technology-agnostic. AI is one tool among many — data infrastructure, civic/digital tools, and other technologies are equally in scope. Do NOT penalize a grant simply because it is not AI-specific; judge fit against ETC's focus areas and public-interest mission. Private-sector / corporate philanthropy (e.g. Microsoft, Google.org, AWS) is welcome, not just foundations.",
  /**
   * Criteria the scorer must evaluate, with target weights. Weights are guidance
   * for the model; it returns its own per-criterion weights that should sum to ~1.
   */
  criteria: [
    {
      key: "missionAlignment",
      label: "Mission alignment",
      targetWeight: 0.3,
      guidance:
        "How directly does the funder's priorities overlap ETC's mission and focus areas?",
    },
    {
      key: "fundingFit",
      label: "Funding fit",
      targetWeight: 0.2,
      guidance:
        "Does the award size, allowable costs, and grant type match what ETC needs (staff time, applied work)?",
    },
    {
      key: "winProbability",
      label: "Competitiveness",
      targetWeight: 0.2,
      guidance:
        "Given ETC's track record and the likely applicant pool, how competitive would an ETC application be?",
    },
    {
      key: "effort",
      label: "Effort / feasibility",
      targetWeight: 0.15,
      guidance:
        "How heavy is the application and reporting burden relative to ETC's limited bandwidth? Higher score = lighter, more feasible.",
    },
    {
      key: "strategicValue",
      label: "Strategic value",
      targetWeight: 0.15,
      guidance:
        "Beyond the money, does winning build reputation, relationships, or capabilities that compound for ETC?",
    },
  ],
} as const;
