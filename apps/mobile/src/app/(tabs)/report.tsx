import { FeaturePlaceholder } from "../../components/FeaturePlaceholder";

export default function ReportScreen() {
  return (
    <FeaturePlaceholder
      emoji="⚠️"
      title="Report Incident"
      subtitle="Report phone snatching, robbery, attacks, poor lighting, or suspicious activity around campus and off-campus areas."
      primaryActionLabel="Create Report"
      onPrimaryAction={() => console.log("Create Report")}
    />
  );
}