import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowUpCircle,
  Brain,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock,
  Database,
  FileCheck2,
  MapPin,
  Plus,
  RefreshCcw,
  ShieldCheck,
  WifiOff,
  Wrench,
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
import { useIncidentStore } from "../../store/incidentStore";
import {
  getIncidentReportsApi,
  updateIncidentReportStatusApi,
} from "../../lib/incidentApi";
import { IncidentReport, IncidentStatus } from "../../types/incident";

type FilterMode = "open" | "in_progress" | "resolved" | "all";

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

function isOpenReport(report: IncidentReport) {
  return [
    "pending",
    "submitted",
    "ai_reviewed",
    "assigned",
    "escalated",
  ].includes(report.status);
}

function isInProgressReport(report: IncidentReport) {
  return report.status === "in_progress";
}

function isResolvedReport(report: IncidentReport) {
  return ["resolved", "student_confirmed", "closed"].includes(report.status);
}

function getPriorityColor(report: IncidentReport) {
  const score = Number(report.priorityScore ?? report.aiRiskScore ?? 0);

  if (report.priority === "critical" || score >= 85) return COLORS.danger;
  if (report.priority === "high" || score >= 70) return COLORS.danger;
  if (report.priority === "medium" || score >= 40) return COLORS.warning;

  return COLORS.primary;
}

function getStatusColor(status: string) {
  if (["resolved", "student_confirmed", "closed"].includes(status)) {
    return COLORS.primary;
  }

  if (status === "in_progress" || status === "assigned") {
    return COLORS.warning;
  }

  if (status === "escalated" || status === "rejected") {
    return COLORS.danger;
  }

  return COLORS.info;
}

function StepItem({
  active,
  done,
  title,
  subtitle,
}: {
  active: boolean;
  done: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.stepItem}>
      <View
        style={[
          styles.stepDot,
          done && styles.stepDotDone,
          active && styles.stepDotActive,
        ]}
      >
        {done ? <CheckCircle2 size={13} color={COLORS.white} /> : null}
      </View>

      <View style={styles.stepTextBox}>
        <Text
          style={[
            styles.stepTitle,
            active && styles.stepTitleActive,
            done && styles.stepTitleDone,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.stepSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function FilterButton({
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
      style={[styles.filterButton, active && styles.filterButtonActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {title}
      </Text>
    </Pressable>
  );
}

function SyncCard({
  usingBackend,
  loading,
  onRefresh,
}: {
  usingBackend: boolean;
  loading: boolean;
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

      <View style={styles.syncTextBox}>
        <Text style={styles.syncTitle}>
          {usingBackend ? "Backend reports connected" : "Local reports active"}
        </Text>

        <Text style={styles.syncText}>
          {usingBackend
            ? "Tracking reports from the campus issue database."
            : "Backend could not be reached, so local phone reports are shown."}
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

function ReportTrackingCard({
  report,
  expanded,
  onToggle,
  onConfirmFixed,
  onReportNotFixed,
}: {
  report: IncidentReport;
  expanded: boolean;
  onToggle: () => void;
  onConfirmFixed: () => void;
  onReportNotFixed: () => void;
}) {
  const priorityColor = getPriorityColor(report);
  const statusColor = getStatusColor(report.status);

  const submittedDone = true;
  const aiDone = [
    "ai_reviewed",
    "assigned",
    "in_progress",
    "resolved",
    "student_confirmed",
    "closed",
    "escalated",
  ].includes(report.status);
  const assignedDone = [
    "assigned",
    "in_progress",
    "resolved",
    "student_confirmed",
    "closed",
    "escalated",
  ].includes(report.status);
  const inProgressDone = [
    "in_progress",
    "resolved",
    "student_confirmed",
    "closed",
  ].includes(report.status);
  const resolvedDone = ["resolved", "student_confirmed", "closed"].includes(
    report.status
  );

  const canConfirmFixed = report.status === "resolved";
  const canReportNotFixed =
    report.status === "resolved" || report.status === "student_confirmed";

  return (
    <View style={styles.reportCard}>
      <Pressable onPress={onToggle} style={styles.reportHeader}>
        <View style={[styles.reportIcon, { backgroundColor: `${priorityColor}1A` }]}>
          <CircleAlert size={22} color={priorityColor} />
        </View>

        <View style={styles.reportHeaderText}>
          <Text numberOfLines={1} style={styles.reportTitle}>
            {report.problemType || report.title}
          </Text>

          <Text style={styles.reportMeta}>
            {report.locationName || "Unknown location"} •{" "}
            {formatDateTime(report.createdAt)}
          </Text>
        </View>

        <View style={styles.expandButton}>
          {expanded ? (
            <ChevronUp size={20} color={COLORS.mutedText} />
          ) : (
            <ChevronDown size={20} color={COLORS.mutedText} />
          )}
        </View>
      </Pressable>

      <View style={styles.pillRow}>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {formatStatus(report.status)}
          </Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: `${priorityColor}1A` }]}>
          <Text style={[styles.statusPillText, { color: priorityColor }]}>
            {(report.priority || report.severity || "medium").toUpperCase()}
          </Text>
        </View>

        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>
            {report.priorityScore ?? report.aiRiskScore}/100
          </Text>
        </View>
      </View>

      {expanded ? (
        <View style={styles.expandedBox}>
          <Text style={styles.description}>{report.description}</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Building2 size={16} color={COLORS.mutedText} />
              <Text style={styles.infoText}>
                Assigned unit:{" "}
                {report.assignedUnit || report.aiSuggestedUnit || "Not assigned"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={16} color={COLORS.mutedText} />
              <Text style={styles.infoText}>
                {report.buildingName || report.locationName || "No building"}{" "}
                {report.roomNumber ? `• Room ${report.roomNumber}` : ""}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Clock size={16} color={COLORS.mutedText} />
              <Text style={styles.infoText}>
                Submitted: {formatDateTime(report.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Case progress</Text>

            <StepItem
              done={submittedDone}
              active={report.status === "submitted" || report.status === "pending"}
              title="Submitted"
              subtitle="Student submitted the issue."
            />

            <StepItem
              done={aiDone}
              active={report.status === "ai_reviewed"}
              title="AI reviewed"
              subtitle="SafeCampus AI classified and routed the report."
            />

            <StepItem
              done={assignedDone}
              active={report.status === "assigned"}
              title="Assigned"
              subtitle="Responsible unit has received the case."
            />

            <StepItem
              done={inProgressDone}
              active={report.status === "in_progress"}
              title="Work started"
              subtitle="Authority is working on the issue."
            />

            <StepItem
              done={resolvedDone}
              active={report.status === "resolved"}
              title="Resolved"
              subtitle="Authority marked it resolved with proof where available."
            />
          </View>

          {report.aiSummary ? (
            <View style={styles.aiBox}>
              <Brain size={17} color={COLORS.primary} />
              <Text style={styles.aiText}>{report.aiSummary}</Text>
            </View>
          ) : null}

          {report.aiRecommendedAction ? (
            <View style={styles.actionBox}>
              <Wrench size={17} color={COLORS.warningDark} />
              <Text style={styles.actionText}>{report.aiRecommendedAction}</Text>
            </View>
          ) : null}

          {report.evidence?.length ? (
            <View style={styles.evidenceBox}>
              <View style={styles.evidenceTitleRow}>
                <Camera size={16} color={COLORS.mutedText} />
                <Text style={styles.evidenceTitle}>Your submitted evidence</Text>
              </View>

              <View style={styles.evidenceGrid}>
                {report.evidence.map((item) => (
                  <Image
                    key={item.uri}
                    source={{ uri: item.uri }}
                    style={styles.evidenceImage}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {report.resolutionEvidence?.length ? (
            <View style={styles.resolutionBox}>
              <View style={styles.evidenceTitleRow}>
                <FileCheck2 size={16} color={COLORS.primaryDark} />
                <Text style={styles.resolutionTitle}>
                  Finished-work evidence
                </Text>
              </View>

              <View style={styles.evidenceGrid}>
                {report.resolutionEvidence.map((item) => (
                  <Image
                    key={item.uri}
                    source={{ uri: item.uri }}
                    style={styles.evidenceImage}
                  />
                ))}
              </View>

              {report.resolutionSummary ? (
                <Text style={styles.resolutionSummary}>
                  {report.resolutionSummary}
                </Text>
              ) : null}
            </View>
          ) : null}

          {report.statusHistory?.length ? (
            <View style={styles.historyBox}>
              <Text style={styles.historyTitle}>Status history</Text>

              {report.statusHistory
                .slice()
                .reverse()
                .slice(0, 4)
                .map((item, index) => (
                  <View key={`${item.status}-${index}`} style={styles.historyRow}>
                    <View style={styles.historyDot} />

                    <View style={styles.historyTextBox}>
                      <Text style={styles.historyStatus}>
                        {formatStatus(item.status)}
                      </Text>

                      <Text style={styles.historyNote}>
                        {item.note || "Status updated"} • {item.actorName}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          ) : null}

          <View style={styles.reportActions}>
            {canConfirmFixed ? (
              <Pressable onPress={onConfirmFixed} style={styles.confirmButton}>
                <CheckCircle2 size={17} color={COLORS.white} />
                <Text style={styles.confirmButtonText}>Confirm Fixed</Text>
              </Pressable>
            ) : null}

            {canReportNotFixed ? (
              <Pressable onPress={onReportNotFixed} style={styles.notFixedButton}>
                <ArrowUpCircle size={17} color={COLORS.danger} />
                <Text style={styles.notFixedText}>Not Fixed / Escalate</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function TrackReportsScreen() {
  const insets = useSafeAreaInsets();

  const localReports = useIncidentStore((state) => state.reports);

  const [backendReports, setBackendReports] = useState<IncidentReport[]>([]);
  const [usingBackend, setUsingBackend] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("open");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);

      const reports = await getIncidentReportsApi({ limit: 100 });

      setBackendReports(reports);
      setUsingBackend(true);
    } catch (error) {
      console.log("Track reports backend sync failed:", error);
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

  const reports = usingBackend ? backendReports : localReports;

  const stats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter(isOpenReport).length;
    const inProgress = reports.filter(isInProgressReport).length;
    const resolved = reports.filter(isResolvedReport).length;
    const escalated = reports.filter((report) => report.status === "escalated").length;

    return {
      total,
      open,
      inProgress,
      resolved,
      escalated,
    };
  }, [reports]);

  const visibleReports = useMemo(() => {
    if (filterMode === "open") {
      return reports.filter(isOpenReport);
    }

    if (filterMode === "in_progress") {
      return reports.filter(isInProgressReport);
    }

    if (filterMode === "resolved") {
      return reports.filter(isResolvedReport);
    }

    return reports;
  }, [filterMode, reports]);

  const updateStudentStatus = async (
    report: IncidentReport,
    status: IncidentStatus,
    note: string
  ) => {
    if (!usingBackend) {
      Alert.alert(
        "Backend Needed",
        "Student confirmation needs the backend so the authority can see the updated case status."
      );
      return;
    }

    try {
      setUpdatingReportId(report.id);

      await updateIncidentReportStatusApi(report.id, {
        status,
        actorName: report.anonymous
          ? "Anonymous Student"
          : report.reporterName || "Student",
        actorRole: "student",
        note,
      });

      await fetchReports();
    } catch (error) {
      Alert.alert(
        "Update Failed",
        "Could not update the case. Check that your backend is running."
      );
    } finally {
      setUpdatingReportId(null);
    }
  };

  const handleConfirmFixed = (report: IncidentReport) => {
    Alert.alert(
      "Confirm Resolution",
      "Confirm that the issue has truly been fixed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Fixed",
          onPress: () =>
            updateStudentStatus(
              report,
              "student_confirmed",
              "Student confirmed that the reported issue has been fixed."
            ),
        },
      ]
    );
  };

  const handleReportNotFixed = (report: IncidentReport) => {
    Alert.alert(
      "Escalate Case",
      "Use this if the issue was marked resolved but it has not actually been fixed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Escalate",
          style: "destructive",
          onPress: () =>
            updateStudentStatus(
              report,
              "escalated",
              "Student reported that the issue is not fixed and requested escalation."
            ),
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIconOuter}>
            <View style={styles.heroIcon}>
              <ShieldCheck size={34} color={COLORS.primary} />
            </View>
          </View>

          <Pressable onPress={fetchReports} style={styles.heroRefresh}>
            {loadingReports ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <RefreshCcw size={19} color={COLORS.white} />
            )}
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>Track My Reports</Text>

        <Text style={styles.heroText}>
          Follow campus issue reports from submission to AI review, authority
          assignment, work progress, resolution, and student confirmation.
        </Text>
      </View>

      <SyncCard
        usingBackend={usingBackend}
        loading={loadingReports}
        onRefresh={fetchReports}
      />

      {updatingReportId ? (
        <View style={styles.updatingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.updatingText}>Updating case status...</Text>
        </View>
      ) : null}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.info }]}>
            {stats.open}
          </Text>
          <Text style={styles.statLabel}>Open</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>
            {stats.inProgress}
          </Text>
          <Text style={styles.statLabel}>In Work</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>
            {stats.resolved}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Brain size={22} color={COLORS.primary} />

        <Text style={styles.infoText}>
          This screen proves accountability. A student can see whether the
          authority accepted the case, started work, resolved it with evidence,
          and whether the fix should be confirmed or escalated.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Report Status</Text>
        <Text style={styles.sectionSubtitle}>
          Filter your submitted campus issue reports by response stage.
        </Text>
      </View>

      <View style={styles.filterBar}>
        <FilterButton
          title="Open"
          active={filterMode === "open"}
          onPress={() => setFilterMode("open")}
        />

        <FilterButton
          title="In Work"
          active={filterMode === "in_progress"}
          onPress={() => setFilterMode("in_progress")}
        />

        <FilterButton
          title="Resolved"
          active={filterMode === "resolved"}
          onPress={() => setFilterMode("resolved")}
        />

        <FilterButton
          title="All"
          active={filterMode === "all"}
          onPress={() => setFilterMode("all")}
        />
      </View>

      {visibleReports.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <AlertTriangle size={38} color={COLORS.primary} />
          </View>

          <Text style={styles.emptyTitle}>No reports here yet</Text>

          <Text style={styles.emptyText}>
            Submit a campus issue report, then return here to track the case
            status and authority response.
          </Text>

          <AppButton
            title="Submit Campus Issue"
            onPress={() => router.push("/(tabs)/report")}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <View style={styles.reportList}>
          {visibleReports.map((report) => (
            <ReportTrackingCard
              key={report.id}
              report={report}
              expanded={expandedReportId === report.id}
              onToggle={() =>
                setExpandedReportId((current) =>
                  current === report.id ? null : report.id
                )
              }
              onConfirmFixed={() => handleConfirmFixed(report)}
              onReportNotFixed={() => handleReportNotFixed(report)}
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <AppButton
          title="Submit New Report"
          onPress={() => router.push("/(tabs)/report")}
        />

        <AppButton
          title="Open Campus Issue Map"
          onPress={() => router.push("/(tabs)/risk-map")}
          variant="secondary"
        />
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
    ...SHADOWS.soft,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },

  heroIconOuter: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  heroRefresh: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.white,
    fontWeight: "900",
  },

  heroText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: "rgba(255,255,255,0.86)",
    fontWeight: "700",
    lineHeight: 22,
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
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  syncTextBox: {
    flex: 1,
  },

  syncTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "900",
  },

  syncText: {
    marginTop: 3,
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

  updatingCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  updatingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  statsGrid: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  statValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  infoCard: {
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

  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 20,
  },

  sectionHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 20,
  },

  filterBar: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.full,
    padding: 5,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterButton: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.soft,
  },

  filterText: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: "900",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  reportList: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },

  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.soft,
  },

  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
  },

  reportIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  reportHeaderText: {
    flex: 1,
  },

  reportTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "900",
  },

  reportMeta: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  expandButton: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  pillRow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  statusPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },

  statusPillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  scorePill: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },

  scoreText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.text,
  },

  expandedBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  },

  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: "700",
    lineHeight: 21,
  },

  infoBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  timelineCard: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  timelineTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: SPACING.md,
  },

  stepItem: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },

  stepDot: {
    marginTop: 3,
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  stepDotDone: {
    backgroundColor: COLORS.primary,
  },

  stepDotActive: {
    backgroundColor: COLORS.warning,
  },

  stepTextBox: {
    flex: 1,
  },

  stepTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "900",
  },

  stepTitleActive: {
    color: COLORS.warningDark,
  },

  stepTitleDone: {
    color: COLORS.primaryDark,
  },

  stepSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 17,
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

  actionBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },

  actionText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.warningDark,
    fontWeight: "800",
    lineHeight: 18,
  },

  evidenceBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  resolutionBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  evidenceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  evidenceTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  resolutionTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  evidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  evidenceImage: {
    width: 82,
    height: 82,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
  },

  resolutionSummary: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "800",
    lineHeight: 18,
  },

  historyBox: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },

  historyTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  historyRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },

  historyDot: {
    marginTop: 5,
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },

  historyTextBox: {
    flex: 1,
  },

  historyStatus: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: "900",
  },

  historyNote: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 17,
  },

  reportActions: {
    marginTop: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  confirmButton: {
    minHeight: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  notFixedButton: {
    minHeight: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  notFixedText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
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
    color: COLORS.text,
    fontWeight: "900",
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