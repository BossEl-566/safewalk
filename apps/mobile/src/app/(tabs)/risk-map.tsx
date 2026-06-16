import { FeaturePlaceholder } from "../../components/FeaturePlaceholder";

export default function RiskMapScreen() {
  return (
    <FeaturePlaceholder
      emoji="🗺️"
      title="Risk Map"
      subtitle="View reported danger zones and receive AI-powered warnings when approaching risky locations."
      primaryActionLabel="View Nearby Risks"
      onPrimaryAction={() => console.log("View Nearby Risks")}
    />
  );
}