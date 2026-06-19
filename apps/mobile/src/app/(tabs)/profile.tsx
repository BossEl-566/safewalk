import { router } from "expo-router";
import { FeaturePlaceholder } from "../../components/FeaturePlaceholder";

export default function ProfileScreen() {
  return (
    <FeaturePlaceholder
      emoji="👤"
      title="Safety Profile"
      subtitle="Manage your personal safety profile, emergency contacts, medical notes, and alert preferences."
      primaryActionLabel="Manage Emergency Contacts"
      onPrimaryAction={() => router.push("/contacts")}
    />
  );
}