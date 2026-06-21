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
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Database,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldAlert,
  XCircle,
  Clock,
Footprints,
Navigation,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { SectionHeader } from "../../components/SectionHeader";
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  tone?: "primary" | "danger" | "warning";
}) {
  const color =
    tone === "danger"
      ? COLORS.danger
      : tone === "warning"
        ? COLORS.warning
        : COLORS.primary;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <BarChart3 size={21} color={color} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
      <View style={styles.sosHeader}>
        <View style={styles.sosIcon}>
          <ShieldAlert size={24} color={COLORS.danger} />
        </View>

        <View style={styles.sosHeaderText}>
          <Text style={styles.sosTitle}>Active SOS Alert</Text>
          <Text style={styles.sosMeta}>
            {alert.userName} • {formatDateTime(alert.createdAt)}
          </Text>
        </View>
      </View>

      <Text style={styles.sosMessage}>{alert.message}</Text>

      <View style={styles.sosInfoRow}>
        <MapPin size={16} color={COLORS.mutedText} />
        <Text style={styles.sosInfoText}>
          {alert.location
            ? `${alert.location.latitude.toFixed(5)}, ${alert.location.longitude.toFixed(5)}`
            : "No GPS location"}
        </Text>
      </View>

      <View style={styles.sosInfoRow}>
        <Phone size={16} color={COLORS.mutedText} />
        <Text style={styles.sosInfoText}>
          {alert.trustedContactName || "No trusted contact"}{" "}
          {alert.trustedContactPhone ? `• ${alert.trustedContactPhone}` : ""}
        </Text>
      </View>

      <View style={styles.sosActions}>
        <AppButton
          title="Open Map"
          onPress={openMap}
          variant="secondary"
        />

        <AppButton
          title="Call Contact"
          onPress={callContact}
          variant="secondary"
        />

        <AppButton
          title="Resolve"
          onPress={onResolve}
          variant="primary"
          icon={<CheckCircle2 size={20} color={COLORS.white} />}
        />

        <AppButton
          title="Cancel"
          onPress={onCancel}
          variant="ghost"
          icon={<XCircle size={20} color={COLORS.primaryDark} />}
        />
      </View>
    </View>
  );
}

function WalkSafeSessionCard({ session }: { session: WalkSafeSession }) {
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
      <View style={styles.walkHeader}>
        <View style={styles.walkIcon}>
          <Footprints size={24} color={COLORS.primary} />
        </View>

        <View style={styles.walkHeaderText}>
          <Text style={styles.walkTitle}>Active Walk Safe Session</Text>
          <Text style={styles.walkMeta}>
            Started {formatDateTime(session.startedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.walkInfoRow}>
        <Navigation size={16} color={COLORS.mutedText} />
        <Text style={styles.walkInfoText}>
          Destination: {session.destinationName}
        </Text>
      </View>

      <View style={styles.walkInfoRow}>
        <Clock size={16} color={COLORS.mutedText} />
        <Text style={styles.walkInfoText}>
          Expected arrival: {formatDateTime(session.expectedArrivalAt)}
        </Text>
      </View>

      <View style={styles.walkInfoRow}>
        <Phone size={16} color={COLORS.mutedText} />
        <Text style={styles.walkInfoText}>
          {session.trustedContactName} • {session.trustedContactPhone}
        </Text>
      </View>

      <View style={styles.walkRiskBox}>
        <AlertTriangle
          size={17}
          color={
            session.riskLevel === "critical" || session.riskLevel === "high"
              ? COLORS.danger
              : session.riskLevel === "medium"
                ? COLORS.warning
                : COLORS.primary
          }
        />

        <Text style={styles.walkRiskText}>
          Risk level: {session.riskLevel.toUpperCase()} •{" "}
          {session.nearbyRiskWarnings.length} nearby warning
          {session.nearbyRiskWarnings.length === 1 ? "" : "s"}
        </Text>
      </View>

      <View style={styles.walkActions}>
        <AppButton
          title="Open Map"
          onPress={openMap}
          variant="secondary"
        />

        <AppButton
          title="Call Contact"
          onPress={callContact}
          variant="secondary"
        />
      </View>
    </View>
  );
}

function HighRiskReportCard({ report }: { report: IncidentReport }) {
  const isCritical = report.aiRiskScore >= 85;

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View
          style={[
            styles.reportIcon,
            {
              backgroundColor: isCritical
                ? COLORS.dangerLight
                : COLORS.warningLight,
            },
          ]}
        >
          <CircleAlert
            size={22}
            color={isCritical ? COLORS.danger : COLORS.warning}
          />
        </View>

        <View style={styles.reportHeaderText}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportMeta}>
            {report.locationName || "Unknown location"} • Score{" "}
            {report.aiRiskScore}
          </Text>
        </View>
      </View>

      <Text style={styles.reportDescription}>{report.description}</Text>

      <View style={styles.aiBox}>
        <Database size={16} color={COLORS.primary} />
        <Text style={styles.aiText}>{report.aiSummary}</Text>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
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
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Security monitoring view</Text>
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
        <View style={styles.heroIcon}>
          <ShieldAlert size={34} color={COLORS.danger} />
        </View>

        <Text style={styles.heroTitle}>Campus Safety Control</Text>
        <Text style={styles.heroText}>
          Monitor active SOS alerts, dangerous incident reports, and high-risk
          areas from the SafeWalk AI database.
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
          />

          <StatCard
            label="Incidents"
            value={stats.totalIncidents}
          />

          <StatCard
            label="High Risk"
            value={stats.highRiskIncidents}
            tone="warning"
          />

          <StatCard
            label="Critical"
            value={stats.criticalIncidents}
            tone="danger"
          />
          <StatCard
  label="Active Walks"
  value={stats.activeWalkSafeSessions}
  tone="primary"
/>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
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
            <AlertTriangle size={26} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No active SOS alerts</Text>
            <Text style={styles.emptyText}>
              When a student triggers SOS, the alert will appear here.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
  <SectionHeader
    title="Active Walk Safe Sessions"
    subtitle="Students currently using monitored walking mode."
  />

  {overview?.activeWalkSafeSessions.length ? (
    overview.activeWalkSafeSessions.map((session) => (
      <WalkSafeSessionCard key={session.id} session={session} />
    ))
  ) : (
    <View style={styles.emptyCard}>
      <Footprints size={26} color={COLORS.primary} />
      <Text style={styles.emptyTitle}>No active Walk Safe sessions</Text>
      <Text style={styles.emptyText}>
        When a student starts Walk Safe mode, the session will appear here.
      </Text>
    </View>
  )}
</View>

      <View style={styles.section}>
        <SectionHeader
          title="High-Risk Reports"
          subtitle="Incident reports with strong risk signals."
        />

        {overview?.highRiskReports.length ? (
          overview.highRiskReports.map((report) => (
            <HighRiskReportCard key={report.id} report={report} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <CircleAlert size={26} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No high-risk reports</Text>
            <Text style={styles.emptyText}>
              High-risk incident reports will appear here after students submit
              them.
            </Text>
          </View>
        )}
      </View>
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
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
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
    textAlign: "center",
    lineHeight: 21,
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
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  section: {
    marginTop: SPACING.xl,
  },

  sosCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dangerLight,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  sosHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  sosIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },

  sosHeaderText: {
    flex: 1,
  },

  sosTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.danger,
  },

  sosMeta: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  sosMessage: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "600",
  },

  sosInfoRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  sosInfoText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  sosActions: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
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
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  reportHeaderText: {
    flex: 1,
  },

  reportTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  reportMeta: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  reportDescription: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "600",
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
    padding: SPACING.lg,
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
  },
  walkCard: {
  backgroundColor: COLORS.surface,
  borderRadius: RADIUS.xl,
  padding: SPACING.lg,
  borderWidth: 1,
  borderColor: COLORS.primaryLight,
  marginBottom: SPACING.md,
  ...SHADOWS.soft,
},

walkHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.md,
},

walkIcon: {
  width: 48,
  height: 48,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primaryLight,
  alignItems: "center",
  justifyContent: "center",
},

walkHeaderText: {
  flex: 1,
},

walkTitle: {
  fontSize: FONT_SIZE.md,
  fontWeight: "900",
  color: COLORS.primaryDark,
},

walkMeta: {
  marginTop: 2,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
},

walkInfoRow: {
  marginTop: SPACING.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.sm,
},

walkInfoText: {
  flex: 1,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
},

walkRiskBox: {
  marginTop: SPACING.md,
  backgroundColor: COLORS.primaryLight,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.sm,
},

walkRiskText: {
  flex: 1,
  fontSize: FONT_SIZE.xs,
  color: COLORS.primaryDark,
  fontWeight: "900",
  lineHeight: 18,
},

walkActions: {
  marginTop: SPACING.lg,
  gap: SPACING.md,
},
});