import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  Database,
  Footprints,
  RefreshCcw,
  ShieldAlert,
  WifiOff,
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
  ActivityItem,
  ActivityType,
  getActivityHistoryApi,
} from "../../lib/activityApi";
import { useIncidentStore } from "../../store/incidentStore";
import { useSOSStore } from "../../store/sosStore";
import { useWalkSafeStore } from "../../store/walkSafeStore";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivityIcon(type: ActivityType) {
  if (type === "sos") {
    return <ShieldAlert size={23} color={COLORS.danger} />;
  }

  if (type === "walk_safe") {
    return <Footprints size={23} color={COLORS.primary} />;
  }

  return <AlertTriangle size={23} color={COLORS.warning} />;
}

function getActivityTone(type: ActivityType) {
  if (type === "sos") return COLORS.dangerLight;
  if (type === "walk_safe") return COLORS.primaryLight;
  return COLORS.warningLight;
}

function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <View style={styles.activityCard}>
      <View
        style={[
          styles.activityIcon,
          {
            backgroundColor: getActivityTone(item.type),
          },
        ]}
      >
        {getActivityIcon(item.type)}
      </View>

      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{item.title}</Text>

          {item.riskScore !== undefined ? (
            <View style={styles.riskPill}>
              <Text style={styles.riskText}>Score {item.riskScore}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.activitySubtitle}>{item.subtitle}</Text>

        <Text style={styles.activityDescription}>{item.description}</Text>

        <View style={styles.activityFooter}>
          <Text style={styles.activityDate}>
            {formatDateTime(item.createdAt)}
          </Text>

          {item.status ? (
            <Text style={styles.activityStatus}>
              {item.status.toUpperCase()}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function buildLocalActivities({
  incidents,
  sosAlerts,
  walks,
}: {
  incidents: ReturnType<typeof useIncidentStore.getState>["reports"];
  sosAlerts: ReturnType<typeof useSOSStore.getState>["alerts"];
  walks: ReturnType<typeof useWalkSafeStore.getState>["sessions"];
}): ActivityItem[] {
  const incidentActivities: ActivityItem[] = incidents.map((report) => ({
    id: report.id,
    type: "incident",
    title: report.title,
    subtitle: report.locationName || "Incident report",
    description: report.aiSummary || report.description,
    status: report.status,
    riskScore: report.aiRiskScore,
    createdAt: report.createdAt,
  }));

  const sosActivities: ActivityItem[] = sosAlerts.map((alert) => ({
    id: alert.id,
    type: "sos",
    title: "SOS Alert",
    subtitle: `${alert.status} emergency alert`,
    description: alert.message,
    status: alert.status,
    createdAt: alert.createdAt,
  }));

  const walkActivities: ActivityItem[] = walks.map((session) => ({
    id: session.id,
    type: "walk_safe",
    title: "Walk Safe Session",
    subtitle: `${session.status} • ${session.destinationName}`,
    description: `Trusted contact: ${session.trustedContactName}. Risk level: ${session.riskLevel.toUpperCase()}.`,
    status: session.status,
    createdAt: session.startedAt,
  }));

  return [...incidentActivities, ...sosActivities, ...walkActivities].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default function ActivityHistoryScreen() {
  const incidents = useIncidentStore((state) => state.reports);
  const sosAlerts = useSOSStore((state) => state.alerts);
  const walks = useWalkSafeStore((state) => state.sessions);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingBackend, setUsingBackend] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);

      const backendActivities = await getActivityHistoryApi();

      setActivities(backendActivities);
      setUsingBackend(true);
    } catch (error) {
      console.log("Activity backend fetch failed:", error);

      const localActivities = buildLocalActivities({
        incidents,
        sosAlerts,
        walks,
      });

      setActivities(localActivities);
      setUsingBackend(false);
    } finally {
      setLoading(false);
    }
  }, [incidents, sosAlerts, walks]);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  const totalSOS = activities.filter((item) => item.type === "sos").length;
  const totalWalks = activities.filter(
    (item) => item.type === "walk_safe"
  ).length;
  const totalIncidents = activities.filter(
    (item) => item.type === "incident"
  ).length;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Activity History</Text>
          <Text style={styles.headerSubtitle}>
            SOS alerts, Walk Safe sessions, and reports
          </Text>
        </View>

        <Pressable onPress={fetchActivities} style={styles.refreshButton}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <RefreshCcw size={19} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <BarChart3 size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Safety Timeline</Text>
        <Text style={styles.heroText}>
          Review all major safety actions created by SafeWalk AI.
        </Text>
      </View>

      <View style={styles.syncCard}>
        <View style={styles.syncIcon}>
          {usingBackend ? (
            <Database size={22} color={COLORS.primary} />
          ) : (
            <WifiOff size={22} color={COLORS.warning} />
          )}
        </View>

        <View style={styles.syncContent}>
          <Text style={styles.syncTitle}>
            {usingBackend ? "Connected to MongoDB" : "Using local history"}
          </Text>
          <Text style={styles.syncText}>
            {usingBackend
              ? "Activity history is loaded from the backend database."
              : "Backend unavailable. Showing history saved on this phone."}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalSOS}</Text>
          <Text style={styles.statLabel}>SOS Alerts</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalWalks}</Text>
          <Text style={styles.statLabel}>Walks</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalIncidents}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Recent Activity"
          subtitle="Most recent safety activity appears first."
        />

        {activities.length === 0 ? (
          <View style={styles.emptyCard}>
            <BarChart3 size={30} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyText}>
              Trigger SOS, start Walk Safe, or submit an incident report to
              create history.
            </Text>

            <AppButton
              title="Go Home"
              onPress={() => router.push("/(tabs)/home")}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          activities.map((item) => (
            <ActivityCard key={`${item.type}-${item.id}`} item={item} />
          ))
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
    backgroundColor: COLORS.primaryLight,
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

  syncCard: {
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

  syncIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  syncContent: {
    flex: 1,
  },

  syncTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  syncText: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  statsGrid: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    gap: SPACING.md,
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

  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  activityContent: {
    flex: 1,
  },

  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  activityTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  activitySubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  activityDescription: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "600",
  },

  activityFooter: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  activityDate: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  activityStatus: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  riskPill: {
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },

  riskText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warningDark,
    fontWeight: "900",
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
    marginTop: SPACING.md,
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

  emptyButton: {
    marginTop: SPACING.lg,
    width: "100%",
  },
});