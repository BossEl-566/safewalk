import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CircleAlert,
  Clock,
  Database,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Trash2,
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
import { useIncidentStore } from "../../store/incidentStore";
import { IncidentReport } from "../../types/incident";
import { RiskMapView } from "../../components/RiskMapView";
import {
  getHighRiskReports,
  getLocationInsights,
  getRecentReports,
  getRiskLevelLabel,
  getRiskStats,
  getTopIncidentPattern,
  RiskLevel,
} from "../../utils/riskIntelligence";
import {
  createIncidentReportApi,
  deleteIncidentReportApi,
  getIncidentReportsApi,
} from "../../lib/incidentApi";

function getRiskColor(level: RiskLevel) {
  if (level === "critical") return COLORS.danger;
  if (level === "high") return COLORS.danger;
  if (level === "medium") return COLORS.warning;
  return COLORS.primary;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SyncStatusCard({
  usingBackend,
  loading,
  lastSyncAt,
  onRefresh,
}: {
  usingBackend: boolean;
  loading: boolean;
  lastSyncAt: string | null;
  onRefresh: () => void;
}) {
  return (
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
          {usingBackend ? "Connected to MongoDB" : "Using local fallback"}
        </Text>

        <Text style={styles.syncText}>
          {usingBackend
            ? `Backend reports loaded${lastSyncAt ? ` at ${formatTime(lastSyncAt)}` : ""}.`
            : "Could not fetch backend reports. Showing reports saved on this phone."}
        </Text>
      </View>

      <Pressable onPress={onRefresh} style={styles.refreshButton}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <RefreshCcw size={19} color={COLORS.primary} />
        )}
      </Pressable>
    </View>
  );
}

function RiskInsightCard({
  title,
  description,
  score,
  level,
}: {
  title: string;
  description: string;
  score: number;
  level: RiskLevel;
}) {
  const color = getRiskColor(level);

  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <View style={[styles.riskDot, { backgroundColor: color }]} />
        <Text style={styles.insightTitle}>{title}</Text>

        <View style={[styles.scorePill, { backgroundColor: `${color}1A` }]}>
          <Text style={[styles.scoreText, { color }]}>{score}</Text>
        </View>
      </View>

      <Text style={styles.insightDescription}>{description}</Text>

      <Text style={[styles.riskLabel, { color }]}>
        Risk level: {level.toUpperCase()}
      </Text>
    </View>
  );
}

function IncidentCard({
  report,
  onDelete,
}: {
  report: IncidentReport;
  onDelete: () => void;
}) {
  const riskLabel = getRiskLevelLabel(report.aiRiskScore);

  const riskLevel: RiskLevel =
    report.aiRiskScore >= 85
      ? "critical"
      : report.aiRiskScore >= 70
        ? "high"
        : report.aiRiskScore >= 40
          ? "medium"
          : "low";

  const riskColor = getRiskColor(riskLevel);

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
          <CircleAlert size={22} color={riskColor} />
        </View>

        <View style={styles.reportHeaderText}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportMeta}>
            {formatDate(report.createdAt)} • {formatTime(report.createdAt)}
          </Text>
        </View>

        <Pressable onPress={onDelete} style={styles.deleteButton}>
          <Trash2 size={18} color={COLORS.danger} />
        </Pressable>
      </View>

      <View style={styles.locationRow}>
        <MapPin size={16} color={COLORS.mutedText} />
        <Text style={styles.locationText}>
          {report.locationName || "Location name not provided"}
        </Text>
      </View>

      <Text style={styles.reportDescription}>{report.description}</Text>

      <View style={styles.reportFooter}>
        <View style={[styles.riskBadge, { backgroundColor: `${riskColor}1A` }]}>
          <Text style={[styles.riskBadgeText, { color: riskColor }]}>
            {riskLabel} • {report.aiRiskScore}
          </Text>
        </View>

        <Text style={styles.areaText}>
          {report.areaType.replace("_", " ")}
        </Text>
      </View>

      <View style={styles.aiBox}>
        <Brain size={16} color={COLORS.primary} />
        <Text style={styles.aiText}>{report.aiSummary}</Text>
      </View>
    </View>
  );
}

export default function RiskMapScreen() {
  const localReports = useIncidentStore((state) => state.reports);
  const deleteLocalReport = useIncidentStore((state) => state.deleteReport);
  const createLocalReport = useIncidentStore((state) => state.createReport);
  const clearLocalReports = useIncidentStore((state) => state.clearReports);

  const [backendReports, setBackendReports] = useState<IncidentReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [usingBackend, setUsingBackend] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const fetchBackendReports = useCallback(async () => {
    try {
      setLoadingReports(true);

      const reports = await getIncidentReportsApi();

      setBackendReports(reports);
      setUsingBackend(true);
      setLastSyncAt(new Date().toISOString());
    } catch (error) {
      console.log("Fetch backend reports failed:", error);
      setUsingBackend(false);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBackendReports();
    }, [fetchBackendReports])
  );

  const reports = usingBackend ? backendReports : localReports;

  const stats = getRiskStats(reports);
  const topPattern = getTopIncidentPattern(reports);
  const highRiskReports = getHighRiskReports(reports);
  const recentReports = getRecentReports(reports);
  const locationInsights = getLocationInsights(reports);

  const handleDeleteReport = (reportId: string) => {
    Alert.alert("Delete Report", "Remove this incident report?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (usingBackend) {
            try {
              await deleteIncidentReportApi(reportId);
              await fetchBackendReports();
            } catch (error) {
              Alert.alert(
                "Delete Failed",
                "Could not delete this report from the backend."
              );
            }
          } else {
            deleteLocalReport(reportId);
          }
        },
      },
    ]);
  };

  const handleClearReports = () => {
    if (usingBackend) {
      Alert.alert(
        "Backend Mode",
        "Clear all backend reports is disabled for safety. Delete reports one by one."
      );
      return;
    }

    Alert.alert(
      "Clear All Local Reports",
      "This will delete all local incident reports saved on this phone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: clearLocalReports,
        },
      ]
    );
  };

  const handleAddDemoReports = async () => {
    const demoReports = [
      {
        category: "phone_snatch" as const,
        severity: "high" as const,
        areaType: "off_campus" as const,
        locationName: "Ayeduase Hostel Road",
        description:
          "Two people on a motorbike snatched a student's phone near the junction.",
        location: {
          latitude: 6.6743,
          longitude: -1.5712,
          accuracy: 20,
        },
        victimWasAlone: true,
        weaponInvolved: false,
        attackerMode: "Motorbike",
        lightingCondition: "Poor lighting",
        anonymous: true,
      },
      {
        category: "forced_momo_withdrawal" as const,
        severity: "critical" as const,
        areaType: "off_campus" as const,
        locationName: "Quiet Road Near Hostel",
        description:
          "Student was threatened and forced to transfer mobile money while walking alone.",
        location: {
          latitude: 6.6751,
          longitude: -1.5721,
          accuracy: 25,
        },
        victimWasAlone: true,
        weaponInvolved: true,
        attackerMode: "Walking gang",
        lightingCondition: "Dark road",
        anonymous: true,
      },
      {
        category: "poor_lighting" as const,
        severity: "medium" as const,
        areaType: "off_campus" as const,
        locationName: "Hostel Junction",
        description:
          "Streetlights are not working, and the area becomes very dark at night.",
        location: {
          latitude: 6.6738,
          longitude: -1.5709,
          accuracy: 30,
        },
        victimWasAlone: false,
        weaponInvolved: false,
        attackerMode: "",
        lightingCondition: "Very poor lighting",
        anonymous: true,
      },
    ];

    try {
      for (const report of demoReports) {
        createLocalReport(report);
      }

      for (const report of demoReports) {
        await createIncidentReportApi(report);
      }

      await fetchBackendReports();

      Alert.alert(
        "Demo Reports Added",
        "Sample reports were added locally and synced to MongoDB."
      );
    } catch (error) {
      Alert.alert(
        "Demo Reports Added Locally",
        "The sample reports were saved locally, but backend sync failed."
      );
    }
  };

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <BarChart3 size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Risk Intelligence</Text>
        <Text style={styles.heroText}>
          SafeWalk AI turns student reports into safety insights, risk scores,
          and hotspot warnings.
        </Text>
      </View>

      <SyncStatusCard
        usingBackend={usingBackend}
        loading={loadingReports}
        lastSyncAt={lastSyncAt}
        onRefresh={fetchBackendReports}
      />

      <View style={styles.section}>
  <SectionHeader
    title="Visual Risk Map"
    subtitle="Incident reports with GPS coordinates are displayed as danger-zone markers."
  />

  <RiskMapView reports={reports} />
</View>

      <View style={styles.statsGrid}>
        <StatCard
          label="Total Reports"
          value={stats.totalReports}
          icon={<MapPin size={22} color={COLORS.primary} />}
        />

        <StatCard
          label="High Risk"
          value={stats.highRiskReports}
          icon={<AlertTriangle size={22} color={COLORS.danger} />}
        />

        <StatCard
          label="Critical"
          value={stats.criticalReports}
          icon={<CircleAlert size={22} color={COLORS.danger} />}
        />

        <StatCard
          label="Avg. Score"
          value={stats.averageRiskScore}
          icon={<Brain size={22} color={COLORS.primary} />}
        />
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <ShieldCheck size={44} color={COLORS.primary} />
          </View>

          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptyText}>
            Once students report incidents, SafeWalk AI will identify high-risk
            areas and warn future users.
          </Text>

          <AppButton
            title="Add Demo Reports"
            onPress={handleAddDemoReports}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="AI Safety Summary"
              subtitle="A quick interpretation of the current incident data."
            />

            <View style={styles.summaryCard}>
              <Brain size={24} color={COLORS.primary} />

              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>
                  {topPattern
                    ? `${topPattern.title} is the most reported pattern`
                    : "No dominant pattern yet"}
                </Text>

                <Text style={styles.summaryText}>
                  {topPattern
                    ? `${topPattern.count} report${
                        topPattern.count > 1 ? "s" : ""
                      } match this pattern. The current average risk score is ${
                        stats.averageRiskScore
                      }.`
                    : "More reports are needed before a reliable pattern can be identified."}
                </Text>
              </View>
            </View>
          </View>

          {highRiskReports.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="High-risk warnings"
                subtitle="These reports indicate areas or incidents that need attention."
              />

              {highRiskReports.slice(0, 3).map((report) => (
                <RiskInsightCard
                  key={report.id}
                  title={report.locationName || report.title}
                  description={report.aiSummary}
                  score={report.aiRiskScore}
                  level={
                    report.aiRiskScore >= 85
                      ? "critical"
                      : report.aiRiskScore >= 70
                        ? "high"
                        : "medium"
                  }
                />
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              title="Location insights"
              subtitle="Areas are grouped using saved report locations."
            />

            {locationInsights.slice(0, 5).map((insight) => (
              <RiskInsightCard
                key={insight.title}
                title={insight.title}
                description={insight.description}
                score={insight.riskScore}
                level={insight.riskLevel}
              />
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Recent reports"
              subtitle={
                usingBackend
                  ? "Latest reports fetched from MongoDB."
                  : "Latest reports saved on this phone."
              }
            />

            {recentReports.map((report) => (
              <IncidentCard
                key={report.id}
                report={report}
                onDelete={() => handleDeleteReport(report.id)}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <AppButton
              title="Refresh from Database"
              onPress={fetchBackendReports}
              variant="primary"
              loading={loadingReports}
            />

            <AppButton
              title="Add Demo Reports"
              onPress={handleAddDemoReports}
              variant="secondary"
            />

            <AppButton
              title={usingBackend ? "Clear Disabled in Backend Mode" : "Clear Local Reports"}
              onPress={handleClearReports}
              variant="ghost"
            />
          </View>
        </>
      )}

      <View style={styles.futureMapCard}>
        <Clock size={20} color={COLORS.info} />

        <Text style={styles.futureMapText}>
          Next improvement: add a real visual map with risk markers and route
          warnings.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    width: 74,
    height: 74,
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

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: COLORS.surfaceMuted,
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

  emptyCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  emptyButton: {
    marginTop: SPACING.xl,
    width: "100%",
  },

  section: {
    marginTop: SPACING.xl,
  },

  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  summaryText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    lineHeight: 20,
    fontWeight: "600",
  },

  insightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  riskDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
  },

  insightTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  scorePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },

  scoreText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  insightDescription: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    lineHeight: 20,
  },

  riskLabel: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    textTransform: "uppercase",
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
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
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

  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.md,
  },

  locationText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  reportDescription: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 21,
    fontWeight: "600",
  },

  reportFooter: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  riskBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },

  riskBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  areaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  aiBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },

  aiText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 18,
  },

  actions: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },

  futureMapCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },

  futureMapText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    fontWeight: "700",
    lineHeight: 20,
  },
});