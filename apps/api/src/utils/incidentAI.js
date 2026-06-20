const categoryLabels = {
  phone_snatch: "Phone snatching",
  robbery: "Robbery",
  attack: "Attack",
  suspicious_motorbike: "Suspicious motorbike activity",
  forced_momo_withdrawal: "Forced mobile money withdrawal",
  poor_lighting: "Poor lighting",
  harassment: "Harassment",
  unsafe_shortcut: "Unsafe shortcut",
  accident: "Accident",
  medical_emergency: "Medical emergency",
  other: "Other safety issue",
};

const severityScores = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 90,
};

function getIncidentCategoryLabel(category) {
  return categoryLabels[category] || "Other safety issue";
}

function generateIncidentAI({
  category,
  severity,
  areaType,
  victimWasAlone,
  weaponInvolved,
  description = "",
}) {
  let score = severityScores[severity] || 50;

  if (victimWasAlone) score += 8;
  if (weaponInvolved) score += 12;
  if (areaType === "off_campus") score += 5;

  if (
    category === "robbery" ||
    category === "attack" ||
    category === "forced_momo_withdrawal"
  ) {
    score += 8;
  }

  const lowerDescription = description.toLowerCase();

  if (
    lowerDescription.includes("motor") ||
    lowerDescription.includes("bike")
  ) {
    score += 5;
  }

  const aiRiskScore = Math.min(score, 100);

  const aiSummary = `${getIncidentCategoryLabel(
    category
  )} report classified as ${String(severity).toUpperCase()} risk. ${
    victimWasAlone ? "Victim was alone. " : ""
  }${weaponInvolved ? "Weapon involvement reported. " : ""}${
    areaType === "off_campus"
      ? "Incident occurred off-campus."
      : areaType === "on_campus"
        ? "Incident occurred on-campus."
        : "Area type is unknown."
  }`;

  return {
    aiRiskScore,
    aiSummary,
    title: getIncidentCategoryLabel(category),
  };
}

module.exports = {
  generateIncidentAI,
  getIncidentCategoryLabel,
};