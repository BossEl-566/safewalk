import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardList,
  ContactRound,
  Database,
  FileClock,
  Map,
  RefreshCcw,
  Settings,
  ShieldAlert,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { useContactStore } from "../../store/contactStore";
import { useIncidentStore } from "../../store/incidentStore";

type MenuCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  tone?: "primary" | "danger" | "warning" | "info";
};

function getToneColors(tone: MenuCardProps["tone"] = "primary") {
  if (tone === "danger") {
    return {
      color: COLORS.danger,
      lightColor: COLORS.dangerLight,
    };
  }

  if (tone === "warning") {
    return {
      color: COLORS.warning,
      lightColor: COLORS.warningLight,
    };
  }

  if (tone === "info") {
    return {
      color: COLORS.info,
      lightColor: COLORS.infoLight,
    };
  }

  return {
    color: COLORS.primary,
    lightColor: COLORS.primaryLight,
  };
}

function MenuCard({
  title,
  description,
  icon,
  onPress,
  tone = "primary",
}: MenuCardProps) {
  const { color, lightColor } = getToneColors(tone);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuCard, pressed && styles.cardPressed]}
    >
      <View style={[styles.menuIcon, { backgroundColor: lightColor }]}>
        {icon}
      </View>

      <View style={styles.menuTextBox}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>

      <View style={styles.menuArrow}>
        <ArrowRight size={18} color={color} />
      </View>
    </Pressable>
  );
}

function StatusCard({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  tone?: "primary" | "danger" | "warning" | "info";
}) {
  const { color } = getToneColors(tone);

  return (
    <View style={styles.statusCard}>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const contacts = useContactStore((state) => state.contacts);
  const reports = useIncidentStore((state) => state.reports);

  const openReports = reports.filter((report) =>
    [
      "pending",
      "submitted",
      "ai_reviewed",
      "assigned",
      "in_progress",
      "escalated",
    ].includes(report.status)
  ).length;

  const resolvedReports = reports.filter((report) =>
    ["resolved", "student_confirmed", "closed"].includes(report.status)
  ).length;

  const criticalReports = reports.filter(
    (report) =>
      report.priority === "critical" ||
      Number(report.priorityScore ?? report.aiRiskScore ?? 0) >= 85
  ).length;

  const handleRunOnboardingAgain = async () => {
    try {
      await AsyncStorage.multiRemove([
        "safewalk-onboarding-complete",
        "safecampus-onboarding-complete",
        "onboarding-complete",
        "hasCompletedOnboarding",
      ]);

      router.replace("/onboarding" as any);
    } catch (error) {
      Alert.alert(
        "Onboarding Error",
        "Could not open onboarding. Please try again."
      );
    }
  };

  const handleResetDemoApp = () => {
    Alert.alert(
      "Reset Demo App?",
      "This will clear saved demo data on this phone, including local reports, contacts, active sessions, and onboarding status. Backend MongoDB reports will remain unless deleted from the backend.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();

              Alert.alert(
                "Demo Reset Complete",
                "The local app data has been reset. Start onboarding again.",
                [
                  {
                    text: "Start Onboarding",
                    onPress: () => router.replace("/onboarding" as any),
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                "Reset Failed",
                "Could not reset the demo data. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}>
            <UserRound size={42} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.heroTitle}>SafeCampus AI Profile</Text>

        <Text style={styles.heroSubtitle}>
          University of Ghana campus issue reporting, response tracking, and
          authority workflow demo.
        </Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Sparkles size={14} color={COLORS.primaryDark} />
            <Text style={styles.badgeText}>AI Routing</Text>
          </View>

          <View style={styles.badge}>
            <Building2 size={14} color={COLORS.primaryDark} />
            <Text style={styles.badgeText}>UG Legon</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusRow}>
        <StatusCard label="Local Reports" value={reports.length} />
        <StatusCard label="Open" value={openReports} tone="info" />
      </View>

      <View style={styles.statusRow}>
        <StatusCard label="Resolved" value={resolvedReports} />
        <StatusCard label="Critical" value={criticalReports} tone="danger" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Student Tools</Text>
        <Text style={styles.sectionSubtitle}>
          Report problems, track issue locations, and manage emergency contacts.
        </Text>
      </View>

      <View style={styles.menuList}>
        <MenuCard
          title="Report Campus Issue"
          description="Submit a campus issue with location, description, and photo evidence."
          icon={<ClipboardList size={23} color={COLORS.primary} />}
          onPress={() => router.push("/(tabs)/report")}
        />

        <MenuCard
          title="Campus Issue Map"
          description="View open, urgent, resolved, and mapped campus reports."
          tone="info"
          icon={<Map size={23} color={COLORS.info} />}
          onPress={() => router.push("/(tabs)/risk-map")}
        />

        <MenuCard
          title="Emergency Contacts"
          description="Manage contacts who receive SOS location alerts."
          tone="danger"
          icon={<ContactRound size={23} color={COLORS.danger} />}
          onPress={() => router.push("/contacts")}
        />

        <MenuCard
          title="Activity History"
          description="Review previous activities and report history."
          tone="warning"
          icon={<FileClock size={23} color={COLORS.warning} />}
          onPress={() => router.push("/activity")}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Authority & Demo Tools</Text>
        <Text style={styles.sectionSubtitle}>
          Use these features to demonstrate what happens after a report is
          submitted.
        </Text>
      </View>

      <View style={styles.menuList}>
        <MenuCard
          title="Authority Dashboard"
          description="Accept, start work, resolve with finished-work photo, close, or escalate cases."
          icon={<Wrench size={23} color={COLORS.primary} />}
          onPress={() => router.push("/admin")}
        />

        <MenuCard
          title="Live Monitoring Center"
          description="Optional safety monitoring module retained from the earlier SafeWalk version."
          tone="info"
          icon={<Database size={23} color={COLORS.info} />}
          onPress={() => router.push("/admin/live-shares")}
        />

        <MenuCard
          title="Run Onboarding Again"
          description="Restart onboarding when preparing for a fresh presentation demo."
          tone="warning"
          icon={<RefreshCcw size={23} color={COLORS.warning} />}
          onPress={handleRunOnboardingAgain}
        />

        <MenuCard
          title="Reset Demo & Start Fresh"
          description="Clear local demo data on this phone before presenting."
          tone="danger"
          icon={<ShieldAlert size={23} color={COLORS.danger} />}
          onPress={handleResetDemoApp}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>System Features</Text>
        <Text style={styles.sectionSubtitle}>
          These points help you explain the project during presentation.
        </Text>
      </View>

      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <ClipboardList size={24} color={COLORS.primary} />
          <Text style={styles.featureTitle}>Structured Reports</Text>
          <Text style={styles.featureText}>
            Students submit exact location, date, description, and photo
            evidence.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Sparkles size={24} color={COLORS.primary} />
          <Text style={styles.featureTitle}>AI Classification</Text>
          <Text style={styles.featureText}>
            The system detects issue type, priority score, and responsible unit.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Wrench size={24} color={COLORS.primary} />
          <Text style={styles.featureTitle}>Authority Workflow</Text>
          <Text style={styles.featureText}>
            Authorities accept, start work, resolve, close, or escalate cases.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <CheckCircle2 size={24} color={COLORS.primary} />
          <Text style={styles.featureTitle}>Proof of Work</Text>
          <Text style={styles.featureText}>
            Finished-work photos and status history prove action was taken.
          </Text>
        </View>
      </View>

      <View style={{ height: insets.bottom + 130 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 34,
    padding: SPACING.xl,
    alignItems: "center",
    ...SHADOWS.soft,
  },

  avatarOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "center",
  },

  heroSubtitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: "rgba(255,255,255,0.86)",
    textAlign: "center",
    lineHeight: 21,
    fontWeight: "700",
  },

  badgeRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: SPACING.sm,
  },

  badge: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  badgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  statusRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  statusCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  statusValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.primary,
  },

  statusLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  sectionHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 20,
  },

  menuList: {
    gap: SPACING.md,
  },

  menuCard: {
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

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  menuTextBox: {
    flex: 1,
  },

  menuTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "900",
  },

  menuDescription: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  menuArrow: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  featureCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  featureTitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: "900",
  },

  featureText: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  infoCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  infoTextBox: {
    flex: 1,
  },

  infoTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  infoText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 20,
  },
});