import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BellRing,
  ChevronRight,
  ContactRound,
  Footprints,
  Map,
  MapPin,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react-native";

import { useContactStore } from "../../store/contactStore";
import { useSOSStore } from "../../store/sosStore";
import { getCurrentLocation } from "../../lib/location";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { createSOSAlertApi } from "../../lib/sosApi";

type SOSCircleButtonProps = {
  onPress: () => void;
};

type SafetyToolCardProps = {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "danger" | "warning" | "info";
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

function SafetyToolCard({
  title,
  description,
  badge,
  icon,
  onPress,
  variant = "primary",
}: SafetyToolCardProps) {
  const color =
    variant === "danger"
      ? COLORS.danger
      : variant === "warning"
        ? COLORS.warning
        : variant === "info"
          ? COLORS.info
          : COLORS.primary;

  const lightColor =
    variant === "danger"
      ? COLORS.dangerLight
      : variant === "warning"
        ? COLORS.warningLight
        : variant === "info"
          ? COLORS.infoLight
          : COLORS.primaryLight;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolCard,
        pressed && styles.toolCardPressed,
      ]}
    >
      <View style={[styles.toolIconBox, { backgroundColor: lightColor }]}>
        {icon}
      </View>

      <View style={styles.toolContent}>
        <View style={styles.toolTitleRow}>
          <Text style={styles.toolTitle}>{title}</Text>

          {badge ? (
            <View style={[styles.toolBadge, { backgroundColor: lightColor }]}>
              <Text style={[styles.toolBadgeText, { color }]}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.toolDescription}>{description}</Text>
      </View>

      <View style={styles.toolArrow}>
        <ChevronRight size={18} color={COLORS.mutedText} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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
        <View style={styles.headerTextBox}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.appName}>SafeWalk AI</Text>
          <Text style={styles.tagline}>
            Walk safer. Alert faster. Stay protected.
          </Text>
        </View>

        <View style={styles.statusPill}>
          <ShieldCheck size={14} color={COLORS.primaryDark} />
          <Text style={styles.statusText}>Protected</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelBox}>
            <RadioTower size={17} color={COLORS.danger} />
            <Text style={styles.heroLabel}>Emergency Ready</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Need help fast?</Text>
        <Text style={styles.heroText}>
          Send your live location to trusted contacts during danger or emergency.
        </Text>

        <SOSCircleButton onPress={handleSOSPress} />

        <View style={styles.sosInfoStrip}>
          <MapPin size={17} color={COLORS.danger} />
          <Text style={styles.sosHint}>
            Your current location will be sent to your trusted contact immediately.
          </Text>
        </View>
      </View>

      <View style={styles.quickStatusRow}>
        <View style={styles.quickStatusCard}>
          <View style={styles.quickStatusIcon}>
            <ContactRound size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.quickStatusValue}>{contacts.length}</Text>
          <Text style={styles.quickStatusLabel}>Trusted contacts</Text>
        </View>

        <View style={styles.quickStatusCard}>
          <View style={styles.quickStatusIcon}>
            <BellRing size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.quickStatusValue}>Live</Text>
          <Text style={styles.quickStatusLabel}>Safety alerts</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Safety tools"
          subtitle="Use these tools before, during, or after a safety incident."
        />

        <View style={styles.toolsList}>
          <SafetyToolCard
            title="Walk Safe"
            description="Start a monitored walk to your hostel, lecture hall, or destination."
            badge="Live"
            variant="primary"
            icon={<Footprints size={23} color={COLORS.primary} />}
            onPress={() => router.push("/(tabs)/walk-safe")}
          />

          <SafetyToolCard
            title="Risk Map"
            description="View unsafe areas based on student reports and danger patterns."
            badge="AI"
            variant="info"
            icon={<Map size={23} color={COLORS.info} />}
            onPress={() => router.push("/(tabs)/risk-map")}
          />

          <SafetyToolCard
            title="Report Incident"
            description="Report robbery, phone snatching, harassment, or suspicious activity."
            variant="danger"
            icon={<TriangleAlert size={23} color={COLORS.danger} />}
            onPress={() => router.push("/(tabs)/report")}
          />

          <SafetyToolCard
            title="Emergency Contacts"
            description="Manage the people who receive your emergency and live-share alerts."
            variant="warning"
            icon={<ContactRound size={23} color={COLORS.warning} />}
            onPress={() => router.push("/contacts")}
          />
        </View>
      </View>

      <View style={styles.warningCard}>
        <View style={styles.warningIconBox}>
          <TriangleAlert size={22} color={COLORS.warningDark} />
        </View>

        <View style={styles.warningTextBox}>
          <Text style={styles.warningTitle}>Tonight’s safety reminder</Text>
          <Text style={styles.warningText}>
            Avoid quiet routes when walking alone. Start Walk Safe mode before
            leaving campus or your hostel.
          </Text>
        </View>
      </View>

      <View style={{ height: insets.bottom + 130 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  headerTextBox: {
    flex: 1,
  },

  greeting: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  appName: {
    marginTop: 3,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
  },

  tagline: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 20,
  },

  statusPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusText: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 34,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  heroTopRow: {
    width: "100%",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  heroLabelBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  heroLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  heroTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  heroText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
    fontWeight: "700",
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

  sosInfoStrip: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },

  sosHint: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.dangerDark,
    fontWeight: "800",
    lineHeight: 18,
  },

  quickStatusRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  quickStatusCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  quickStatusIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },

  quickStatusValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  quickStatusLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  section: {
    marginTop: SPACING.xl,
  },

  toolsList: {
    gap: SPACING.md,
  },

  toolCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    ...SHADOWS.soft,
  },

  toolCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  toolIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  toolContent: {
    flex: 1,
  },

  toolTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  toolTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  toolBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  toolBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  toolDescription: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  toolArrow: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  warningCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },

  warningIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  warningTextBox: {
    flex: 1,
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
    fontWeight: "700",
    lineHeight: 20,
  },
});