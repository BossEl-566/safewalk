import { FeaturePlaceholder } from "../../components/FeaturePlaceholder";

export default function WalkSafeScreen() {
  return (
    <FeaturePlaceholder
      emoji="🚶"
      title="Walk Safe"
      subtitle="Start a monitored walk, share your movement with a trusted contact, and receive alerts near risky areas."
      primaryActionLabel="Start Walk Safe"
      onPrimaryAction={() => console.log("Start Walk Safe")}
    />
  );
}