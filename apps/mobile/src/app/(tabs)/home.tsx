import { Alert, StyleSheet, Text, View } from "react-native";
import { useContactStore } from "../../store/contactStore";
import { useSOSStore } from "../../store/sosStore";
import { getCurrentLocation } from "../../lib/location";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { SafetyCard } from "../../components/SafetyCard";
import { SectionHeader } from "../../components/SectionHeader";
import { EmergencyButton } from "../../components/EmergencyButton";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";

export default function HomeScreen() {
  const contacts = useContactStore((state) => state.contacts);
const createSOSAlert = useSOSStore((state) => state.createSOSAlert);

const handleSOSPress = async () => {
  if (contacts.length === 0) {
    Alert.alert(
      "No Emergency Contacts",
      "Add at least one trusted contact before using SOS.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Contact",
          onPress: () => router.push("/contacts"),
        },
      ]
    );

    return;
  }

  try {
    const location = await getCurrentLocation();

    const alertId = createSOSAlert({
      userName: "SafeWalk User",
      location,
    });

    router.push({
      pathname: "/sos/active",
      params: { alertId },
    });
  } catch (error) {
    Alert.alert(
      "Location Error",
      error instanceof Error
        ? error.message
        : "Unable to get your current location."
    );
  }
};

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>SafeWalk AI</Text>
          <Text style={styles.tagline}>
            Walk safer. Alert faster. Stay protected.
          </Text>
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>Protected</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Need help fast?</Text>
        <Text style={styles.heroText}>
          Send your live location to trusted contacts during danger or emergency.
        </Text>

        <EmergencyButton
          onPress={handleSOSPress}
          style={styles.sosButton}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Safety tools"
          subtitle="Use these tools before, during, or after a safety incident."
        />

        <View style={styles.grid}>
          <SafetyCard
            title="Walk Safe"
            description="Start a monitored walk to your hostel or destination."
            icon="🚶"
            badge="Live"
            onPress={() => router.push("/(tabs)/walk-safe")}
            style={styles.gridCard}
          />

          <SafetyCard
            title="Risk Map"
            description="View unsafe areas based on student reports."
            icon="📍"
            badge="AI"
            onPress={() => router.push("/(tabs)/risk-map")}
            style={styles.gridCard}
          />

          <SafetyCard
            title="Report"
            description="Report phone snatching, robbery, or suspicious activity."
            icon="⚠️"
            onPress={() => router.push("/(tabs)/report")}
            style={styles.gridCard}
          />

          <SafetyCard
  title="Contacts"
  description="Manage people who receive emergency alerts."
  icon="👥"
  onPress={() => router.push("/contacts")}
  style={styles.gridCard}
/>
        </View>
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>Tonight’s safety reminder</Text>
        <Text style={styles.warningText}>
          Avoid quiet routes when walking alone. Start Walk Safe mode before leaving campus or your hostel.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  appName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
  },

  tagline: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
  },

  statusPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  statusText: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  heroTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  heroText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  sosButton: {
    marginTop: SPACING.xl,
  },

  section: {
    marginTop: SPACING.xl,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  gridCard: {
    width: "47%",
  },

  warningCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  warningTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.warningDark,
  },
  

  warningText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.warningDark,
    lineHeight: 20,
  },
});