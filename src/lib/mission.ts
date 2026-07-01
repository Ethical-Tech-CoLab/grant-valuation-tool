// Ethical Tech CoLab profile used to ground AI grant scoring.
// Edit this to sharpen how the scorer judges fit — it is the single source of
// truth the model reads when valuing every opportunity.

export const ETC_MISSION = {
  organization: "Ethical Tech CoLab (ETC)",
  mission:
    "The Ethical Tech CoLab advances technology that is equitable, accountable, and human-centered. We research, prototype, and advocate for responsible AI and digital systems, and we build tools and capacity for communities and mission-driven organizations to use technology ethically.",
  focusAreas: [
    "Responsible / ethical AI",
    "Algorithmic accountability and audits",
    "Digital equity and inclusion",
    "Community-centered technology design",
    "Capacity building for nonprofits and public interest tech",
    "Tech policy and advocacy",
  ],
  strengths: [
    "Applied research with published outputs",
    "Prototyping and open-source tooling",
    "Community and stakeholder engagement",
    "Small, senior team — high-quality but limited bandwidth",
  ],
  constraints: [
    "Limited grant-writing bandwidth — effort cost matters",
    "Prefer grants that fund staff time and applied work over pure overhead",
    "Avoid opportunities that require capabilities we do not have (e.g. large-scale clinical trials, hardware manufacturing)",
  ],
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
