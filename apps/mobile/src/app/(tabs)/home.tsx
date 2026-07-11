import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ShieldAlert } from "lucide-react-native";

import { useContactStore } from "../../store/contactStore";
import { useSOSStore } from "../../store/sosStore";
import { getCurrentLocation } from "../../lib/location";
import { Screen } from "../../components/Screen";
import { SafetyCard } from "../../components/SafetyCard";
import { SectionHeader } from "../../components/SectionHeader";
import { COLORS, FONT_SIZE, RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import { createSOSAlertApi } from "../../lib/sosApi";

type SOSCircleButtonProps = {
  onPress: () => void;
};

function SOSCircleButton({ onPress }: SOSCircleButtonProps) {
  return (
    <View style={styles.sosCircleOuter}>
      <View style={styles.sosCircleMiddle}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.sosCircleButton,
            pressed && styles.sosCircleButtonPressed,
          ]}
        >
          <ShieldAlert size={34} color={COLORS.white} />
          <Text style={styles.sosCircleText}>SOS</Text>
          <Text style={styles.sosCircleSubText}>Tap for help</Text>
        </Pressable>
      </View>
    </View>
  );
}

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

      const alert = useSOSStore.getState().getAlertById(alertId);

      if (alert) {
        createSOSAlertApi({
          userName: alert.userName,
          location: alert.location,
          message: alert.message,
          source: "sos_button",
          trustedContactName: contacts[0]?.name ?? "",
          trustedContactPhone: contacts[0]?.phone ?? "",
        }).catch((error) => {
          console.log("SOS backend sync failed:", error);
        });
      }

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

        <SOSCircleButton onPress={handleSOSPress} />

        <Text style={styles.sosHint}>
          Your location will be sent to your trusted contact immediately.
        </Text>
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
    ...SHADOWS.soft,
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

  sosCircleOuter: {
    marginTop: SPACING.xxl,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: "rgba(220, 38, 38, 0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.10)",
  },

  sosCircleMiddle: {
    width: 205,
    height: 205,
    borderRadius: 103,
    backgroundColor: "rgba(220, 38, 38, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.18)",
  },

  sosCircleButton: {
    width: 138,
    height: 138,
    borderRadius: 80,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },

  sosCircleButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },

  sosCircleText: {
    marginTop: SPACING.xs,
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sosCircleSubText: {
    marginTop: 2,
    color: "rgba(255,255,255,0.82)",
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
  },

  sosHint: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 18,
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