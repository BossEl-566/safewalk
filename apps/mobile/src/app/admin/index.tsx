import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Database,
  Footprints,
  MapPin,
  Navigation,
  Phone,
  RadioTower,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import {
  AdminOverview,
  AdminSOSAlert,
  getAdminOverviewApi,
} from "../../lib/adminApi";
import {
  cancelSOSAlertApi,
  resolveSOSAlertApi,
} from "../../lib/sosApi";
import { IncidentReport } from "../../types/incident";
import { WalkSafeSession } from "../../types/walkSafe";

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskColor(level?: string) {
  if (level === "critical" || level === "high") return COLORS.danger;
  if (level === "medium") return COLORS.warning;
  return COLORS.primary;
}

function StatCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "primary" | "danger" | "warning" | "info";
}) {
  const color =
    tone === "danger"
      ? COLORS.danger
      : tone === "warning"
        ? COLORS.warning
        : tone === "info"
          ? COLORS.info
          : COLORS.primary;

  const lightColor =
    tone === "danger"
      ? COLORS.dangerLight
      : tone === "warning"
        ? COLORS.warningLight
        : tone === "info"
          ? COLORS.infoLight
          : COLORS.primaryLight;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: lightColor }]}>
        {icon}
      </View>

      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionTitleBox}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.quickActionIcon}>{icon}</View>

      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionText}>{description}</Text>
      </View>

      <View style={styles.arrowBox}>
        <ChevronRight size={18} color={COLORS.mutedText} />
      </View>
    </Pressable>
  );
}

function SOSAlertCard({
  alert,
  onResolve,
  onCancel,
}: {
  alert: AdminSOSAlert;
  onResolve: () => void;
  onCancel: () => void;
}) {
  const openMap = () => {
    if (!alert.location) {
      Alert.alert("No Location", "This SOS alert has no GPS location.");
      return;
    }

    Linking.openURL(
      `https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`
    );
  };

  const callContact = () => {
    if (!alert.trustedContactPhone) {
      Alert.alert("No Contact", "No trusted contact phone was saved.");
      return;
    }

    Linking.openURL(`tel:${alert.trustedContactPhone}`);
  };

  return (
    <View style={styles.sosCard}>
      <View style={styles.sosTopRow}>
        <View style={styles.sosIcon}>
          <ShieldAlert size={25} color={COLORS.danger} />
        </View>

        <View style={styles.sosHeaderText}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.sosTitle}>Active SOS Alert</Text>

            <View style={styles.criticalPill}>
              <Text style={styles.criticalPillText}>Urgent</Text>
            </View>
          </View>

          <Text style={styles.sosMeta}>
            {alert.userName} • {formatDateTime(alert.createdAt)}
          </Text>
        </View>
      </View>

      <Text style={styles.sosMessage}>{alert.message}</Text>

      <View style={styles.infoRowsBox}>
        <View style={styles.infoRow}>
          <MapPin size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            {alert.location
              ? `${alert.location.latitude.toFixed(5)}, ${alert.location.longitude.toFixed(5)}`
              : "No GPS location"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Phone size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            {alert.trustedContactName || "No trusted contact"}{" "}
            {alert.trustedContactPhone ? `• ${alert.trustedContactPhone}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <Pressable onPress={openMap} style={styles.secondaryAction}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.secondaryActionText}>Map</Text>
        </Pressable>

        <Pressable onPress={callContact} style={styles.secondaryAction}>
          <Phone size={16} color={COLORS.primary} />
          <Text style={styles.secondaryActionText}>Call</Text>
        </Pressable>
      </View>

      <View style={styles.actionGrid}>
        <Pressable onPress={onResolve} style={styles.resolveAction}>
          <CheckCircle2 size={16} color={COLORS.white} />
          <Text style={styles.resolveActionText}>Resolve</Text>
        </Pressable>

        <Pressable onPress={onCancel} style={styles.cancelAction}>
          <XCircle size={16} color={COLORS.danger} />
          <Text style={styles.cancelActionText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WalkSafeSessionCard({ session }: { session: WalkSafeSession }) {
  const riskColor = getRiskColor(session.riskLevel);

  const warningCount = session.nearbyRiskWarnings?.length ?? 0;

  const openMap = () => {
    if (!session.startLocation) {
      Alert.alert("No Location", "This Walk Safe session has no GPS location.");
      return;
    }

    Linking.openURL(
      `https://www.google.com/maps?q=${session.startLocation.latitude},${session.startLocation.longitude}`
    );
  };

  const callContact = () => {
    if (!session.trustedContactPhone) {
      Alert.alert("No Contact", "No trusted contact phone was saved.");
      return;
    }

    Linking.openURL(`tel:${session.trustedContactPhone}`);
  };

  return (
    <View style={styles.walkCard}>
      <View style={styles.walkTopRow}>
        <View style={styles.walkIcon}>
          <Footprints size={25} color={COLORS.primary} />
        </View>

        <View style={styles.walkHeaderText}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.walkTitle}>Active Walk Session</Text>

            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <Text style={styles.walkMeta}>
            Started {formatDateTime(session.startedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.infoRowsBox}>
        <View style={styles.infoRow}>
          <Navigation size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            Destination: {session.destinationName || "Not provided"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Clock size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            Expected arrival: {formatDateTime(session.expectedArrivalAt)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Phone size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            {session.trustedContactName || "No contact"}{" "}
            {session.trustedContactPhone ? `• ${session.trustedContactPhone}` : ""}
          </Text>
        </View>
      </View>

      <View style={[styles.riskStrip, { backgroundColor: `${riskColor}1A` }]}>
        <AlertTriangle size={17} color={riskColor} />

        <Text style={[styles.riskStripText, { color: riskColor }]}>
          {session.riskLevel.toUpperCase()} RISK • {warningCount} nearby warning
          {warningCount === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={styles.actionGrid}>
        <Pressable onPress={openMap} style={styles.secondaryAction}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.secondaryActionText}>Open Map</Text>
        </Pressable>

        <Pressable onPress={callContact} style={styles.secondaryAction}>
          <Phone size={16} color={COLORS.primary} />
          <Text style={styles.secondaryActionText}>Call Contact</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HighRiskReportCard({ report }: { report: IncidentReport }) {
  const isCritical = report.aiRiskScore >= 85;
  const color = isCritical ? COLORS.danger : COLORS.warning;
  const lightColor = isCritical ? COLORS.dangerLight : COLORS.warningLight;

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={[styles.reportIcon, { backgroundColor: lightColor }]}>
          <CircleAlert size={22} color={color} />
        </View>

        <View style={styles.reportHeaderText}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.reportTitle}>{report.title}</Text>

            <View style={[styles.scorePill, { backgroundColor: lightColor }]}>
              <Text style={[styles.scoreText, { color }]}>
                {report.aiRiskScore}
              </Text>
            </View>
          </View>

          <Text style={styles.reportMeta}>
            {report.locationName || "Unknown location"}
          </Text>
        </View>
      </View>

      <Text style={styles.reportDescription}>{report.description}</Text>

      {report.aiSummary ? (
        <View style={styles.aiBox}>
          <Database size={16} color={COLORS.primary} />
          <Text style={styles.aiText}>{report.aiSummary}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getAdminOverviewApi();

      setOverview(data);
    } catch (error) {
      Alert.alert(
        "Admin Sync Failed",
        "Could not load admin dashboard data from the backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOverview();
    }, [fetchOverview])
  );

  const handleResolveSOS = (alertId: string) => {
    Alert.alert("Resolve SOS", "Mark this SOS alert as resolved?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        onPress: async () => {
          await resolveSOSAlertApi(alertId);
          await fetchOverview();
        },
      },
    ]);
  };

  const handleCancelSOS = (alertId: string) => {
    Alert.alert("Cancel SOS", "Cancel this SOS alert?", [
      { text: "Keep Active", style: "cancel" },
      {
        text: "Cancel SOS",
        style: "destructive",
        onPress: async () => {
          await cancelSOSAlertApi(alertId);
          await fetchOverview();
        },
      },
    ]);
  };

  const stats = overview?.stats;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.overline}>Security monitoring</Text>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>

        <Pressable onPress={fetchOverview} style={styles.refreshButton}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <RefreshCcw size={19} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIconOuter}>
            <View style={styles.heroIcon}>
              <ShieldAlert size={34} color={COLORS.danger} />
            </View>
          </View>

          <View style={styles.demoPill}>
            <Text style={styles.demoPillText}>Demo Mode</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Campus Safety Control</Text>

        <Text style={styles.heroText}>
          Monitor active SOS alerts, live walking sessions, and high-risk
          incident reports from the SafeWalk AI database.
        </Text>
      </View>

      {!overview && loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </View>
      ) : null}

      {stats ? (
        <View style={styles.statsGrid}>
          <StatCard
            label="Active SOS"
            value={stats.activeSOSAlerts}
            tone="danger"
            icon={<ShieldAlert size={21} color={COLORS.danger} />}
          />

          <StatCard
            label="Incidents"
            value={stats.totalIncidents}
            tone="primary"
            icon={<Database size={21} color={COLORS.primary} />}
          />

          <StatCard
            label="High Risk"
            value={stats.highRiskIncidents}
            tone="warning"
            icon={<AlertTriangle size={21} color={COLORS.warning} />}
          />

          <StatCard
            label="Critical"
            value={stats.criticalIncidents}
            tone="danger"
            icon={<CircleAlert size={21} color={COLORS.danger} />}
          />

          <StatCard
            label="Active Walks"
            value={stats.activeWalkSafeSessions}
            tone="info"
            icon={<Footprints size={21} color={COLORS.info} />}
          />
        </View>
      ) : null}

      <QuickActionCard
        title="Live Monitoring Center"
        description="Open the live map view for students currently sharing movement."
        icon={<RadioTower size={24} color={COLORS.primary} />}
        onPress={() => router.push("/admin/live-shares")}
      />

      <View style={styles.section}>
        <SectionTitle
          title="Active SOS Alerts"
          subtitle="Emergency alerts that require immediate attention."
        />

        {overview?.activeSOSAlerts.length ? (
          overview.activeSOSAlerts.map((alert) => (
            <SOSAlertCard
              key={alert.id}
              alert={alert}
              onResolve={() => handleResolveSOS(alert.id)}
              onCancel={() => handleCancelSOS(alert.id)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <ShieldCheck size={30} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No active SOS alerts</Text>
            <Text style={styles.emptyText}>
              When a student triggers SOS, the alert will appear here.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle
          title="Active Walk Sessions"
          subtitle="Students currently using monitored walking mode."
        />

        {overview?.activeWalkSafeSessions.length ? (
          overview.activeWalkSafeSessions.map((session) => (
            <WalkSafeSessionCard key={session.id} session={session} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Footprints size={30} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No active Walk Safe sessions</Text>
            <Text style={styles.emptyText}>
              When a student starts Walk Safe mode, the session will appear here.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle
          title="High-Risk Reports"
          subtitle="Incident reports with strong danger signals."
        />

        {overview?.highRiskReports.length ? (
          overview.highRiskReports.map((report) => (
            <HighRiskReportCard key={report.id} report={report} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <CircleAlert size={30} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No high-risk reports</Text>
            <Text style={styles.emptyText}>
              High-risk incident reports will appear here after students submit
              reports with location data.
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: insets.bottom + 130 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  headerText: {
    flex: 1,
  },

  overline: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  headerTitle: {
    marginTop: 3,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 34,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },

  heroIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(220, 38, 38, 0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.10)",
  },

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },

  demoPill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  demoPillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  heroTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
  },

  heroText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    lineHeight: 21,
    fontWeight: "700",
  },

  loadingCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  statsGrid: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  statCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  statIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  quickActionCard: {
    marginTop: SPACING.xl,
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
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionContent: {
    flex: 1,
  },

  quickActionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  quickActionText: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  arrowBox: {
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

  section: {
    marginTop: SPACING.xl,
  },

  sectionTitleBox: {
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

  sosCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.18)",
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  sosTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  sosIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },

  sosHeaderText: {
    flex: 1,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  sosTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.danger,
  },

  sosMeta: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  criticalPill: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  criticalPillText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  sosMessage: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "700",
  },

  infoRowsBox: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  infoRowText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    lineHeight: 18,
  },

  actionGrid: {
    marginTop: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  secondaryActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  resolveAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  resolveActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.white,
  },

  cancelAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  cancelActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.danger,
  },

  walkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  walkTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  walkIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  walkHeaderText: {
    flex: 1,
  },

  walkTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  walkMeta: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  livePill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },

  liveText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  riskStrip: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  riskStripText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    lineHeight: 18,
  },

  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  reportIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  reportHeaderText: {
    flex: 1,
  },

  reportTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  reportMeta: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  scorePill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  scoreText: {
    fontSize: 10,
    fontWeight: "900",
  },

  reportDescription: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "700",
  },

  aiBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  aiText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 18,
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    ...SHADOWS.soft,
  },

  emptyTitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "700",
  },
});