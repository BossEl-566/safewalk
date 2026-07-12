import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Database,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  WifiOff,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { LeafletMapView } from "../../components/LeafletMapView";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { useIncidentStore } from "../../store/incidentStore";
import { IncidentReport } from "../../types/incident";
import {
  createIncidentReportApi,
  deleteIncidentReportApi,
  getIncidentReportsApi,
} from "../../lib/incidentApi";
import {
  getRiskLevelLabel,
  getRiskStats,
  getTopIncidentPattern,
  RiskLevel,
} from "../../utils/riskIntelligence";

type FeedMode = "mapped" | "all";

const DEFAULT_MAP_CENTER = {
  latitude: 6.6743,
  longitude: -1.5712,
};

function getRiskColor(level: RiskLevel) {
  if (level === "critical") return COLORS.danger;
  if (level === "high") return COLORS.danger;
  if (level === "medium") return COLORS.warning;
  return COLORS.primary;
}

function getReportRiskLevel(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatArea(value: string) {
  return value.replace("_", " ");
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
      <View
        style={[
          styles.syncIcon,
          {
            backgroundColor: usingBackend
              ? COLORS.primaryLight
              : COLORS.warningLight,
          },
        ]}
      >
        {usingBackend ? (
          <Database size={21} color={COLORS.primary} />
        ) : (
          <WifiOff size={21} color={COLORS.warning} />
        )}
      </View>

      <View style={styles.syncContent}>
        <Text style={styles.syncTitle}>
          {usingBackend ? "Database connected" : "Local fallback active"}
        </Text>

        <Text style={styles.syncText}>
          {usingBackend
            ? `Reports loaded${
                lastSyncAt
                  ? ` at ${new Date(lastSyncAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""
              }.`
            : "Could not fetch backend reports. Showing local reports."}
        </Text>
      </View>

      <Pressable onPress={onRefresh} style={styles.refreshButton}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <RefreshCcw size={18} color={COLORS.primary} />
        )}
      </Pressable>
    </View>
  );
}

function SegmentButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentButton, active && styles.segmentButtonActive]}
    >
      <Text
        style={[styles.segmentText, active && styles.segmentTextActive]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function ReportFeedCard({
  report,
  expanded,
  onToggle,
  onDelete,
}: {
  report: IncidentReport;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const riskLevel = getReportRiskLevel(report.aiRiskScore);
  const riskColor = getRiskColor(riskLevel);
  const riskLabel = getRiskLevelLabel(report.aiRiskScore);

  return (
    <View style={styles.feedCard}>
      <Pressable onPress={onToggle} style={styles.feedHeader}>
        <View style={[styles.feedIconBox, { backgroundColor: `${riskColor}1A` }]}>
          <CircleAlert size={21} color={riskColor} />
        </View>

        <View style={styles.feedHeaderText}>
          <Text numberOfLines={1} style={styles.feedTitle}>
            {report.locationName || report.title}
          </Text>

          <View style={styles.feedMetaRow}>
            <Text style={styles.feedMeta}>{formatDateTime(report.createdAt)}</Text>
            <Text style={styles.feedDot}>|</Text>
            <Text style={[styles.feedSeverity, { color: riskColor }]}>
              Severity: {report.severity}
            </Text>
          </View>
        </View>

        <View style={styles.expandButton}>
          {expanded ? (
            <ChevronUp size={20} color={COLORS.mutedText} />
          ) : (
            <ChevronDown size={20} color={COLORS.mutedText} />
          )}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.feedExpanded}>
          <Text style={styles.feedDescription}>{report.description}</Text>

          <View style={styles.feedLocationRow}>
            <MapPin size={16} color={COLORS.mutedText} />
            <Text style={styles.feedLocationText}>
              {report.locationName || "Location name not provided"}
            </Text>
          </View>

          <View style={styles.feedFooter}>
            <View style={[styles.riskBadge, { backgroundColor: `${riskColor}1A` }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                {riskLabel} • {report.aiRiskScore}
              </Text>
            </View>

            <Text style={styles.areaText}>{formatArea(report.areaType)}</Text>
          </View>

          {report.aiSummary ? (
            <View style={styles.aiBox}>
              <Brain size={16} color={COLORS.primary} />
              <Text style={styles.aiText}>{report.aiSummary}</Text>
            </View>
          ) : null}

          <View style={styles.feedActions}>
            <Pressable onPress={onDelete} style={styles.deleteAction}>
              <Trash2 size={16} color={COLORS.danger} />
              <Text style={styles.deleteActionText}>Delete report</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function RiskMapScreen() {
  const insets = useSafeAreaInsets();

  const localReports = useIncidentStore((state) => state.reports);
  const deleteLocalReport = useIncidentStore((state) => state.deleteReport);
  const createLocalReport = useIncidentStore((state) => state.createReport);
  const clearLocalReports = useIncidentStore((state) => state.clearReports);

  const [backendReports, setBackendReports] = useState<IncidentReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [usingBackend, setUsingBackend] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>("mapped");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

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

  const mappedReports = useMemo(() => {
    return reports.filter(
      (report) =>
        report.location &&
        typeof report.location.latitude === "number" &&
        typeof report.location.longitude === "number"
    );
  }, [reports]);

  const visibleReports = feedMode === "mapped" ? mappedReports : reports;

  const stats = getRiskStats(reports);
  const topPattern = getTopIncidentPattern(reports);

  const mapCenter = mappedReports[0]?.location
    ? {
        latitude: mappedReports[0].location.latitude,
        longitude: mappedReports[0].location.longitude,
      }
    : DEFAULT_MAP_CENTER;

  const dangerMarkers = mappedReports.map((report) => {
    const riskLevel = getReportRiskLevel(report.aiRiskScore);

    return {
      latitude: report.location?.latitude ?? DEFAULT_MAP_CENTER.latitude,
      longitude: report.location?.longitude ?? DEFAULT_MAP_CENTER.longitude,
      title: report.locationName || report.title,
      description: report.description,
      riskLevel,
      riskScore: report.aiRiskScore,
    };
  });

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
        attackerMode: "Walking group",
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
      <View style={styles.header}>
        <View style={styles.headerTextBox}>
          <Text style={styles.overline}>Live risk intelligence</Text>
          <Text style={styles.title}>Risk Map</Text>
          <Text style={styles.subtitle}>
            View danger zones, mapped reports, and recent safety incidents.
          </Text>
        </View>

        <Pressable onPress={fetchBackendReports} style={styles.headerRefresh}>
          {loadingReports ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <RefreshCcw size={20} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      <SyncStatusCard
        usingBackend={usingBackend}
        loading={loadingReports}
        lastSyncAt={lastSyncAt}
        onRefresh={fetchBackendReports}
      />

      <View style={styles.mapCard}>
        <View style={styles.mapTopRow}>
          <View>
            <Text style={styles.mapTitle}>Visual Risk Map</Text>
            <Text style={styles.mapSubtitle}>
              {mappedReports.length} mapped report
              {mappedReports.length === 1 ? "" : "s"} found
            </Text>
          </View>

          <View style={styles.mapPill}>
            <LocateFixed size={14} color={COLORS.primary} />
            <Text style={styles.mapPillText}>Around me</Text>
          </View>
        </View>

        <View style={styles.mapBox}>
          <LeafletMapView
            style={styles.map}
            center={mapCenter}
            zoom={15}
            dangerMarkers={dangerMarkers as any}
          />

          {mappedReports.length === 0 ? (
            <View style={styles.mapEmptyOverlay}>
              <MapPin size={28} color={COLORS.primary} />
              <Text style={styles.mapEmptyTitle}>No mapped reports yet</Text>
              <Text style={styles.mapEmptyText}>
                Add reports with GPS coordinates to display danger markers here.
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.overviewRow}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{stats.totalReports}</Text>
          <Text style={styles.overviewLabel}>Total Reports</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: COLORS.danger }]}>
            {stats.criticalReports}
          </Text>
          <Text style={styles.overviewLabel}>Critical</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: COLORS.warning }]}>
            {stats.averageRiskScore}
          </Text>
          <Text style={styles.overviewLabel}>Avg. Score</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Brain size={22} color={COLORS.primary} />
        </View>

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
                } match this pattern. SafeWalk AI will use this to improve route warnings.`
              : "More reports are needed before SafeWalk AI can detect strong safety patterns."}
          </Text>
        </View>
      </View>

      <View style={styles.feedHeaderSection}>
        <View>
          <Text style={styles.feedSectionTitle}>Emergency Reports</Text>
          <Text style={styles.feedSectionSubtitle}>
            Review recent safety reports submitted by students.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/report")}
          style={styles.addReportButton}
        >
          <Plus size={18} color={COLORS.white} />
        </Pressable>
      </View>

      <View style={styles.segmentContainer}>
        <SegmentButton
          title="Mapped Reports"
          active={feedMode === "mapped"}
          onPress={() => setFeedMode("mapped")}
        />

        <SegmentButton
          title="All Reports"
          active={feedMode === "all"}
          onPress={() => setFeedMode("all")}
        />
      </View>

      {visibleReports.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <ShieldCheck size={40} color={COLORS.primary} />
          </View>

          <Text style={styles.emptyTitle}>
            {feedMode === "mapped" ? "No mapped reports" : "No reports yet"}
          </Text>

          <Text style={styles.emptyText}>
            {feedMode === "mapped"
              ? "Reports without GPS coordinates will not appear on the map. Add demo reports to test the map."
              : "Once students report incidents, they will appear here."}
          </Text>

          <AppButton
            title="Add Demo Reports"
            onPress={handleAddDemoReports}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <View style={styles.feedList}>
          {visibleReports.map((report) => (
            <ReportFeedCard
              key={report.id}
              report={report}
              expanded={expandedReportId === report.id}
              onToggle={() =>
                setExpandedReportId((current) =>
                  current === report.id ? null : report.id
                )
              }
              onDelete={() => handleDeleteReport(report.id)}
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <AppButton
          title="Refresh Reports"
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
  },

  headerTextBox: {
    flex: 1,
  },

  overline: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  title: {
    marginTop: 4,
    fontSize: FONT_SIZE.xxl,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    lineHeight: 20,
    fontWeight: "700",
  },

  headerRefresh: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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

  mapCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  mapTopRow: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  mapTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  mapSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  mapPill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  mapPillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  mapBox: {
    height: 360,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  map: {
    flex: 1,
  },

  mapEmptyOverlay: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    top: SPACING.xl,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.soft,
  },

  mapEmptyTitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  mapEmptyText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "700",
  },

  overviewRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  overviewCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  overviewValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  overviewLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  summaryCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "700",
    lineHeight: 20,
  },

  feedHeaderSection: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  feedSectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  feedSectionSubtitle: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 20,
  },

  addReportButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  segmentContainer: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.full,
    padding: 5,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  segmentButton: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  segmentButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.soft,
  },

  segmentText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "900",
  },

  segmentTextActive: {
    color: COLORS.white,
  },

  feedList: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },

  feedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.soft,
  },

  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
  },

  feedIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  feedHeaderText: {
    flex: 1,
  },

  feedTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  feedMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  feedMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  feedDot: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
  },

  feedSeverity: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  expandButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  feedExpanded: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  },

  feedDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 21,
    fontWeight: "700",
  },

  feedLocationRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  feedLocationText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  feedFooter: {
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
    fontWeight: "900",
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

  feedActions: {
    marginTop: SPACING.md,
    alignItems: "flex-start",
  },

  deleteAction: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  deleteActionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    fontWeight: "900",
  },

  emptyCard: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  emptyIcon: {
    width: 82,
    height: 82,
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
    fontWeight: "700",
  },

  emptyButton: {
    marginTop: SPACING.xl,
    width: "100%",
  },

  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
});