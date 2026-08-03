import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SMS from "expo-sms";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BellRing,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  ContactRound,
  Database,
  Map,
  MapPin,
  Menu,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UsersRound,
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
import { useSOSStore } from "../../store/sosStore";
import { useIncidentStore } from "../../store/incidentStore";
import { getCurrentLocation } from "../../lib/location";
import { createSOSAlertApi } from "../../lib/sosApi";
import { getIncidentReportsApi } from "../../lib/incidentApi";
import { IncidentReport } from "../../types/incident";

type QuickActionProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onPress: () => void;
  tone?: "primary" | "danger" | "warning" | "info";
};

type WorkflowCardProps = {
  number: string;
  title: string;
  text: string;
  icon: ReactNode;
};

function getToneColors(tone: QuickActionProps["tone"] = "primary") {
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

function isOpenReport(report: IncidentReport) {
  return [
    "pending",
    "submitted",
    "ai_reviewed",
    "assigned",
    "in_progress",
    "escalated",
  ].includes(report.status);
}

function isResolvedReport(report: IncidentReport) {
  return ["resolved", "student_confirmed", "closed"].includes(report.status);
}

function QuickActionCard({
  title,
  description,
  icon,
  onPress,
  tone = "primary",
}: QuickActionProps) {
  const { color, lightColor } = getToneColors(tone);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: lightColor }]}>
        {icon}
      </View>

      <View style={styles.quickActionTextBox}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>

      <View style={styles.quickActionArrow}>
        <ChevronRight size={18} color={color} />
      </View>
    </Pressable>
  );
}

function WorkflowCard({ number, title, text, icon }: WorkflowCardProps) {
  return (
    <View style={styles.workflowCard}>
      <View style={styles.workflowTopRow}>
        <View style={styles.workflowNumber}>
          <Text style={styles.workflowNumberText}>{number}</Text>
        </View>

        <View style={styles.workflowIcon}>{icon}</View>
      </View>

      <Text style={styles.workflowTitle}>{title}</Text>
      <Text style={styles.workflowText}>{text}</Text>
    </View>
  );
}

function buildSOSMessage({
  userName,
  latitude,
  longitude,
}: {
  userName: string;
  latitude: number;
  longitude: number;
}) {
  const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return `EMERGENCY SOS from SafeCampus AI

${userName} may need urgent help at or around the University of Ghana campus.

Current location:
${mapLink}

Coordinates:
Latitude: ${latitude}
Longitude: ${longitude}

Please call or check on them immediately.`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const contacts = useContactStore((state) => state.contacts);
  const createSOSAlert = useSOSStore((state) => state.createSOSAlert);
  const localReports = useIncidentStore((state) => state.reports);

  const [backendReports, setBackendReports] = useState<IncidentReport[]>([]);
  const [usingBackend, setUsingBackend] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const reports = usingBackend ? backendReports : localReports;

  const homeStats = useMemo(() => {
    const totalReports = reports.length;
    const openReports = reports.filter(isOpenReport).length;
    const resolvedReports = reports.filter(isResolvedReport).length;
    const criticalReports = reports.filter(
      (report) =>
        report.priority === "critical" ||
        Number(report.priorityScore ?? report.aiRiskScore ?? 0) >= 85
    ).length;

    return {
      totalReports,
      openReports,
      resolvedReports,
      criticalReports,
    };
  }, [reports]);

  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);

      const data = await getIncidentReportsApi({ limit: 100 });

      setBackendReports(data);
      setUsingBackend(true);
    } catch (error) {
      console.log("Home report sync failed:", error);
      setUsingBackend(false);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

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
      const smsAvailable = await SMS.isAvailableAsync();

      if (!smsAvailable) {
        Alert.alert(
          "SMS Not Available",
          "This device cannot send SMS messages. Test SOS on a real phone with a SIM card."
        );
        return;
      }

      const location = await getCurrentLocation();

      const trustedPhones = contacts
        .map((contact) => contact.phone)
        .filter((phone) => phone && phone.trim().length > 0);

      if (trustedPhones.length === 0) {
        Alert.alert(
          "No Phone Number",
          "Your trusted contact does not have a valid phone number."
        );
        return;
      }

      const sosMessage = buildSOSMessage({
        userName: "SafeCampus User",
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const alertId = createSOSAlert({
        userName: "SafeCampus User",
        location,
      });

      createSOSAlertApi({
        userName: "SafeCampus User",
        location,
        message: sosMessage,
        source: "sos_button",
        trustedContactName: contacts[0]?.name ?? "",
        trustedContactPhone: contacts[0]?.phone ?? "",
      }).catch((error) => {
        console.log("SOS backend sync failed:", error);
      });

      const smsResult = await SMS.sendSMSAsync(trustedPhones, sosMessage);

      if (smsResult.result === "sent") {
        Alert.alert(
          "SOS Message Sent",
          `Emergency SMS was sent to ${trustedPhones.length} trusted contact${
            trustedPhones.length === 1 ? "" : "s"
          }.`
        );
      } else if (smsResult.result === "cancelled") {
        Alert.alert(
          "SOS Message Cancelled",
          "The SMS screen was opened, but the message was not sent."
        );
      } else {
        Alert.alert(
          "SMS Status Unknown",
          "The SMS app was opened, but SafeCampus AI could not confirm whether the message was sent."
        );
      }

      router.push({
        pathname: "/sos/active",
        params: {
          alertId,
          smsStatus: smsResult.result,
          sentTo: trustedPhones.join(", "),
        },
      });
    } catch (error) {
      Alert.alert(
        "SOS Error",
        error instanceof Error
          ? error.message
          : "Unable to send SOS message."
      );
    }
  };

  return (
    <Screen scroll>
      <View style={styles.appShell}>
        <View style={styles.greenHeader}>
          <View style={styles.topNav}>
            <Pressable style={styles.headerIconButton}>
              <Menu size={25} color={COLORS.white} />
            </Pressable>

            <View style={styles.brandBox}>
              <Text style={styles.brandTitle}>SafeCampus AI</Text>
              <Text style={styles.brandSubtitle}>University of Ghana</Text>
            </View>

            <Pressable onPress={fetchReports} style={styles.bellButton}>
              {loadingReports ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <BellRing size={22} color={COLORS.white} />
              )}

              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroPill}>
              <Sparkles size={15} color={COLORS.primaryDark} />
              <Text style={styles.heroPillText}>AI-powered campus response</Text>
            </View>

            <Text style={styles.heroTitle}>Report. Route. Resolve.</Text>

            <Text style={styles.heroText}>
              Students report campus issues with location and photo evidence.
              SafeCampus AI classifies, prioritizes, and routes each case to the
              responsible University of Ghana authority.
            </Text>
          </View>

          <View style={styles.floatingReportCard}>
            <View style={styles.floatingIcon}>
              <ClipboardList size={22} color={COLORS.primary} />
            </View>

            <View style={styles.floatingTextBox}>
              <Text style={styles.floatingTitle}>Need to report something?</Text>
              <Text style={styles.floatingText}>
                Lecture room fault, sanitation, fire, disaster, ICT, or safety issue.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/(tabs)/report")}
              style={styles.plusButton}
            >
              <CirclePlus size={24} color={COLORS.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{homeStats.totalReports}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.info }]}>
              {homeStats.openReports}
            </Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {homeStats.resolvedReports}
            </Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.danger }]}>
              {homeStats.criticalReports}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Main Actions</Text>
          <Text style={styles.sectionSubtitle}>
            Use these tools to report, track, and resolve campus issues.
          </Text>
        </View>

        <View style={styles.quickActionsList}>
          <QuickActionCard
            title="Report Campus Issue"
            description="Submit a problem with exact location, description, and photo evidence."
            tone="primary"
            icon={<Camera size={23} color={COLORS.primary} />}
            onPress={() => router.push("/(tabs)/report")}
          />

          <QuickActionCard
            title="Campus Issue Map"
            description="View open, urgent, resolved, and mapped campus reports."
            tone="info"
            icon={<Map size={23} color={COLORS.info} />}
            onPress={() => router.push("/(tabs)/risk-map")}
          />

          <QuickActionCard
            title="Authority Dashboard"
            description="Accept, start work, resolve, close, or escalate reported cases."
            tone="warning"
            icon={<Wrench size={23} color={COLORS.warning} />}
            onPress={() => router.push("/admin")}
          />

          <QuickActionCard
            title="Emergency Contacts"
            description="Manage trusted people who receive urgent SOS alerts."
            tone="danger"
            icon={<ContactRound size={23} color={COLORS.danger} />}
            onPress={() => router.push("/contacts")}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How SafeCampus AI Works</Text>
          <Text style={styles.sectionSubtitle}>
            This workflow shows what the system does after a student submits a
            report.
          </Text>
        </View>

        <View style={styles.workflowGrid}>
          <WorkflowCard
            number="01"
            title="Student reports"
            text="The student submits a campus problem with date, location, description, and evidence."
            icon={<UsersRound size={20} color={COLORS.primary} />}
          />

          <WorkflowCard
            number="02"
            title="AI classifies"
            text="The system detects issue type, priority score, and the responsible UG unit."
            icon={<Brain size={20} color={COLORS.primary} />}
          />

          <WorkflowCard
            number="03"
            title="Authority acts"
            text="The authority accepts the case, starts work, resolves it, or escalates it."
            icon={<Building2 size={20} color={COLORS.primary} />}
          />

          <WorkflowCard
            number="04"
            title="Proof is stored"
            text="Finished-work photo evidence and status history prove that action was taken."
            icon={<CheckCircle2 size={20} color={COLORS.primary} />}
          />
        </View>

        <View style={styles.emergencyCard}>
          <View style={styles.emergencyTopRow}>
            <View style={styles.emergencyIcon}>
              <ShieldAlert size={26} color={COLORS.danger} />
            </View>

            <View style={styles.emergencyTextBox}>
              <Text style={styles.emergencyTitle}>Emergency SOS</Text>
              <Text style={styles.emergencyText}>
                Use this only for urgent personal safety or medical emergencies.
                Your GPS location will be sent to your trusted contact.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSOSPress}
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.sosButtonPressed,
            ]}
          >
            <ShieldAlert size={22} color={COLORS.white} />
            <Text style={styles.sosButtonText}>Send Emergency SOS</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Database size={22} color={COLORS.primary} />
          </View>

          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>Why this is more than reporting</Text>
            <Text style={styles.infoText}>
              SafeCampus AI creates a traceable response system. Reports are not
              only stored; they are classified, routed, monitored, resolved with
              evidence, and displayed for accountability.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: insets.bottom + 130 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  appShell: {
    marginHorizontal: -SPACING.xxl,
    marginTop: -SPACING.lg,
  },

  greenHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 92,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  brandBox: {
    alignItems: "center",
  },

  brandTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
    fontWeight: "900",
  },

  brandSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  bellButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  heroContent: {
    marginTop: SPACING.xl,
  },

  heroPill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  heroPillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  heroTitle: {
    marginTop: SPACING.lg,
    fontSize: 34,
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  heroText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: "rgba(255,255,255,0.86)",
    lineHeight: 22,
    fontWeight: "700",
  },

  floatingReportCard: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: -42,
    minHeight: 86,
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },

  floatingIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  floatingTextBox: {
    flex: 1,
  },

  floatingTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: "900",
  },

  floatingText: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  plusButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  statsRow: {
    marginTop: 62,
    marginHorizontal: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    ...SHADOWS.soft,
  },

  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  sectionHeader: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
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

  quickActionsList: {
    marginHorizontal: SPACING.lg,
    gap: SPACING.md,
  },

  quickActionCard: {
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

  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionTextBox: {
    flex: 1,
  },

  quickActionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  quickActionDescription: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  quickActionArrow: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  workflowGrid: {
    marginHorizontal: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  workflowCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  workflowTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  workflowNumber: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },

  workflowNumberText: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  workflowIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  workflowTitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: "900",
  },

  workflowText: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  emergencyCard: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.18)",
    ...SHADOWS.soft,
  },

  emergencyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },

  emergencyIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emergencyTextBox: {
    flex: 1,
  },

  emergencyTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    fontWeight: "900",
  },

  emergencyText: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 19,
  },

  sosButton: {
    marginTop: SPACING.lg,
    minHeight: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },

  sosButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  sosButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },

  infoCard: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
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