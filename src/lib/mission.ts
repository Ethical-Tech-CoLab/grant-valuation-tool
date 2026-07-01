// Ethical Tech CoLab profile used to ground AI grant scoring and proposal drafts.
// Edit this to sharpen how the scorer judges fit — it is the single source of
// truth the model reads when valuing every opportunity.
//
// Sourced from the org's site: https://ethical-tech-colab.github.io/website/

export const ETC_MISSION = {
  organization: "NYU Ethical Tech CoLab (ETC)",
  website: "https://ethical-tech-colab.github.io/website/",
  mission:
    "The NYU Ethical Tech CoLab is a research collaboration between NYU's Center for Global Affairs and Microsoft Research. We explore intervention opportunities at the intersection of emerging technologies and the human condition — designing and prototyping tech interventions for migration, forced labor, internally displaced people (IDPs), and refugees. We build prototypes that hold up outside the lab, in partnership with institutions, agencies, and affected communities.",
  partners: ["NYU Center for Global Affairs (CGA)", "Microsoft Research"],
  focusAreas: [
    "Technology for migration, refugees, and internally displaced people (IDPs)",
    "Technology to combat forced labor and uphold labor rights",
    "AI for disaster response and evacuation decisions",
    "Ethical return and provenance of cultural heritage / cultural artifacts",
    "Verifiable ethical claims and traceability in supply chains",
    "AI to rehearse and support high-stakes diplomacy",
    "Trust infrastructure and information equity",
    "Climate accountability",
    "AI safety",
    "Civic technology and restorative justice",
    "Pedagogy and training at the tech–human-rights intersection",
  ],
  // ETC's current, active research projects — concrete anchors for judging fit
  // and for proposing work that extends what the CoLab already does.
  currentProjects: [
    { name: "Evacuation", question: "How can AI inform evacuation decisions?" },
    {
      name: "Cultural Heritage",
      question: "How can technology support the ethical return of cultural artifacts?",
    },
    {
      name: "Traceability",
      question: "How can ethical claims in supply chains be made verifiable?",
    },
    {
      name: "Diplomacy",
      question: "How can AI help practitioners rehearse high-stakes diplomacy?",
    },
  ],
  strengths: [
    "Applied research that prototypes interventions which hold up outside the lab",
    "Backed by NYU's Center for Global Affairs and collaborating with Microsoft Research",
    "Deep partnerships with institutions, agencies, and affected communities",
    "Bridges global-affairs / human-rights expertise with emerging technology",
    "Interdisciplinary team spanning policy, research, and technical prototyping",
  ],
  constraints: [
    "Prefer grants that fund applied research, prototyping, and researcher/staff time over pure overhead",
    "Strongest fit is human-centered tech interventions for migration, forced labor, disaster response, and human rights — not general-purpose software",
    "Avoid opportunities requiring capabilities outside the intervention-design wheelhouse (e.g. large-scale clinical trials, hardware manufacturing)",
  ],
  // Important framing for the scorer:
  breadth:
    "ETC works at the intersection of emerging technology and the human condition. AI is a central but not exclusive tool — data infrastructure, provenance/traceability systems, civic tech, and trust infrastructure are equally in scope. Judge fit against ETC's humanitarian and human-rights focus (migration, forced labor, refugees/IDPs, disaster response, cultural heritage, supply-chain traceability) and its applied-research-plus-prototyping model. Both corporate and foundation funders are welcome — ETC already partners with Microsoft Research. Do NOT penalize a grant simply because it is not AI-specific.",
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
        "How directly do the funder's priorities overlap ETC's mission, focus areas, and current projects (migration, forced labor, disaster response, cultural heritage, traceability, diplomacy)?",
    },
    {
      key: "fundingFit",
      label: "Funding fit",
      targetWeight: 0.2,
      guidance:
        "Does the award size, allowable costs, and grant type match what ETC needs (applied research, prototyping, researcher/staff time)?",
    },
    {
      key: "winProbability",
      label: "Competitiveness",
      targetWeight: 0.2,
      guidance:
        "Given ETC's track record, its NYU CGA + Microsoft Research backing, and the likely applicant pool, how competitive would an ETC application be?",
    },
    {
      key: "effort",
      label: "Effort / feasibility",
      targetWeight: 0.15,
      guidance:
        "How heavy is the application and reporting burden relative to ETC's bandwidth? Higher score = lighter, more feasible.",
    },
    {
      key: "strategicValue",
      label: "Strategic value",
      targetWeight: 0.15,
      guidance:
        "Beyond the money, does winning build reputation, relationships, or capabilities that compound for ETC and extend its current projects?",
    },
  ],
} as const;
