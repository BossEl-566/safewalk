import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowUpCircle,
  Brain,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock,
  Database,
  FileCheck2,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
  Wrench,
  XCircle,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import { Screen } from "../../components/Screen";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import {
  AdminOverview,
  getAdminOverviewApi,
} from "../../lib/adminApi";
import { updateIncidentReportStatusApi } from "../../lib/incidentApi";
import { IncidentReport, IncidentStatus } from "../../types/incident";

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

function getPriorityColor(priority?: string, score?: number) {
  if (priority === "critical" || Number(score ?? 0) >= 85) return COLORS.danger;
  if (priority === "high" || Number(score ?? 0) >= 70) return COLORS.danger;
  if (priority === "medium" || Number(score ?? 0) >= 40) return COLORS.warning;
  return COLORS.primary;
}

function getStatusColor(status: string) {
  if (status === "resolved" || status === "student_confirmed" || status === "closed") {
    return COLORS.primary;
  }

  if (status === "escalated" || status === "rejected") {
    return COLORS.danger;
  }

  if (status === "in_progress" || status === "assigned") {
    return COLORS.warning;
  }

  return COLORS.info;
}

function StatCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
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

function ActionButton({
  title,
  icon,
  onPress,
  tone = "primary",
}: {
  title: string;
  icon: ReactNode;
  onPress: () => void;
  tone?: "primary" | "danger" | "warning" | "ghost";
}) {
  const backgroundColor =
    tone === "danger"
      ? COLORS.dangerLight
      : tone === "warning"
        ? COLORS.warningLight
        : tone === "ghost"
          ? COLORS.surface
          : COLORS.primaryLight;

  const color =
    tone === "danger"
      ? COLORS.danger
      : tone === "warning"
        ? COLORS.warningDark
        : tone === "ghost"
          ? COLORS.mutedText
          : COLORS.primaryDark;

  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor }]}>
      {icon}
      <Text style={[styles.actionButtonText, { color }]}>{title}</Text>
    </Pressable>
  );
}

function EmptyCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function CampusReportCard({
  report,
  onUpdateStatus,
  onAssignTask,
}: {
  report: IncidentReport;
  onUpdateStatus: (report: IncidentReport, status: IncidentStatus) => void;
  onAssignTask: (report: IncidentReport) => void;
}) {
  const priorityColor = getPriorityColor(report.priority, report.priorityScore);
  const statusColor = getStatusColor(report.status);

  const openMap = () => {
    if (!report.location) {
      Alert.alert("No GPS Location", "This report does not have GPS coordinates.");
      return;
    }

    Linking.openURL(
      `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`
    );
  };

  const canAccept =
    report.status === "submitted" ||
    report.status === "pending" ||
    report.status === "ai_reviewed";

  const canStart = report.status === "assigned" || report.status === "escalated";
  const canResolve = report.status === "in_progress";
  const canClose =
    report.status === "resolved" || report.status === "student_confirmed";

  const isClosed = report.status === "closed" || report.status === "rejected";

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportTopRow}>
        <View style={[styles.reportIcon, { backgroundColor: `${priorityColor}1A` }]}>
          <CircleAlert size={23} color={priorityColor} />
        </View>

        <View style={styles.reportHeaderText}>
          <View style={styles.reportTitleRow}>
            <Text style={styles.reportTitle}>
              {report.problemType || report.title}
            </Text>

            <View style={[styles.scorePill, { backgroundColor: `${priorityColor}1A` }]}>
              <Text style={[styles.scoreText, { color: priorityColor }]}>
                {report.priorityScore ?? report.aiRiskScore}/100
              </Text>
            </View>
          </View>

          <Text style={styles.reportMeta}>
            {report.locationName || "Unknown location"} • {formatDateTime(report.createdAt)}
          </Text>
        </View>
      </View>

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

        {report.duplicateCount && report.duplicateCount > 1 ? (
          <View style={styles.duplicatePill}>
            <Text style={styles.duplicateText}>
              {report.duplicateCount} similar reports
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.reportDescription}>{report.description}</Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Building2 size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            Unit: {report.assignedUnit || report.aiSuggestedUnit || "Not assigned"}
          </Text>
        </View>
        <View style={styles.infoRow}>
        <UserCheck size={16} color={COLORS.mutedText} />
        <Text style={styles.infoRowText}>
          Assigned to: {report.assignedToName || "No responder assigned yet"}
        </Text>
      </View>

        <View style={styles.infoRow}>
          <MapPin size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            {report.buildingName || report.locationName || "No building"}{" "}
            {report.roomNumber ? `• Room ${report.roomNumber}` : ""}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Clock size={16} color={COLORS.mutedText} />
          <Text style={styles.infoRowText}>
            Assigned: {formatDateTime(report.assignedAt)}
          </Text>
        </View>
      </View>

      {report.aiSummary ? (
        <View style={styles.aiBox}>
          <Brain size={17} color={COLORS.primary} />
          <Text style={styles.aiText}>{report.aiSummary}</Text>
        </View>
      ) : null}

      {report.aiRecommendedAction ? (
        <View style={styles.actionRecommendationBox}>
          <Wrench size={17} color={COLORS.warningDark} />
          <Text style={styles.actionRecommendationText}>
            {report.aiRecommendedAction}
          </Text>
        </View>
      ) : null}

      {report.resolutionEvidence?.length ? (
  <View style={styles.resolutionEvidenceBox}>
    <Text style={styles.resolutionEvidenceTitle}>
      Finished work evidence
    </Text>

    <View style={styles.resolutionEvidenceGrid}>
      {report.resolutionEvidence.map((item) => (
        <Image
          key={item.uri}
          source={{ uri: item.uri }}
          style={styles.resolutionEvidenceImage}
        />
      ))}
    </View>

    {report.resolutionSummary ? (
      <Text style={styles.resolutionSummaryText}>
        {report.resolutionSummary}
      </Text>
    ) : null}
  </View>
) : null}

      {report.statusHistory?.length ? (
        <View style={styles.historyBox}>
          <Text style={styles.historyTitle}>Latest activity</Text>

          {report.statusHistory
            .slice(-3)
            .reverse()
            .map((item, index) => (
              <View key={`${item.status}-${index}`} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={styles.historyContent}>
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
        {report.location ? (
          <ActionButton
            title="Map"
            tone="ghost"
            icon={<MapPin size={16} color={COLORS.mutedText} />}
            onPress={openMap}
          />
        ) : null}

        {canAccept ? (
  <ActionButton
    title="Assign Task"
    icon={<UserCheck size={16} color={COLORS.primaryDark} />}
    onPress={() => onAssignTask(report)}
  />
) : null}

        {canStart ? (
          <ActionButton
            title="Start Work"
            tone="warning"
            icon={<Wrench size={16} color={COLORS.warningDark} />}
            onPress={() => onUpdateStatus(report, "in_progress")}
          />
        ) : null}

        {canResolve ? (
          <ActionButton
            title="Resolve"
            icon={<CheckCircle2 size={16} color={COLORS.primaryDark} />}
            onPress={() => onUpdateStatus(report, "resolved")}
          />
        ) : null}

        {canClose ? (
          <ActionButton
            title="Close"
            icon={<FileCheck2 size={16} color={COLORS.primaryDark} />}
            onPress={() => onUpdateStatus(report, "closed")}
          />
        ) : null}

        {!isClosed ? (
          <ActionButton
            title="Escalate"
            tone="danger"
            icon={<ArrowUpCircle size={16} color={COLORS.danger} />}
            onPress={() => onUpdateStatus(report, "escalated")}
          />
        ) : null}

        {!isClosed ? (
          <ActionButton
            title="Reject"
            tone="ghost"
            icon={<XCircle size={16} color={COLORS.mutedText} />}
            onPress={() => onUpdateStatus(report, "rejected")}
          />
        ) : null}
      </View>
    </View>
  );
}

async function takeResolutionPhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Camera Permission Needed",
      "Allow camera access so the authority can attach proof that the issue has been resolved."
    );

    return [];
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets[0]) {
    return [];
  }

  return [
    {
      uri: result.assets[0].uri,
      type: "image" as const,
      uploadedAt: new Date().toISOString(),
    },
  ];
}

async function pickResolutionPhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Gallery Permission Needed",
      "Allow photo access so the authority can attach proof that the issue has been resolved."
    );

    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets[0]) {
    return [];
  }

  return [
    {
      uri: result.assets[0].uri,
      type: "image" as const,
      uploadedAt: new Date().toISOString(),
    },
  ];
}

type StaffMember = {
  id: string;
  name: string;
  unit: string;
  role: string;
  phone: string;
};

const STAFF_STORAGE_KEY = "safecampus-admin-staff-members";

const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "staff-maintenance-1",
    name: "Technician Kwame Mensah",
    unit: "Facilities Maintenance",
    role: "Maintenance Technician",
    phone: "0240000001",
  },
  {
    id: "staff-ict-1",
    name: "ICT Support Officer",
    unit: "IT Directorate",
    role: "ICT Support",
    phone: "0240000002",
  },
  {
    id: "staff-security-1",
    name: "Campus Security Team",
    unit: "Campus Security",
    role: "Security Response",
    phone: "0240000003",
  },
  {
    id: "staff-sanitation-1",
    name: "Sanitation Response Team",
    unit: "Sanitation Unit",
    role: "Sanitation Officer",
    phone: "0240000004",
  },
  {
    id: "staff-health-1",
    name: "UG Health Response",
    unit: "UG Health Service",
    role: "Medical Response",
    phone: "0240000005",
  },
];

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
const [assignmentReport, setAssignmentReport] =
  useState<IncidentReport | null>(null);

const [selectedStaffId, setSelectedStaffId] = useState("");
const [assignmentNote, setAssignmentNote] = useState("");

const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
const [staffModalVisible, setStaffModalVisible] = useState(false);
const [staffName, setStaffName] = useState("");
const [staffUnit, setStaffUnit] = useState("");
const [staffRole, setStaffRole] = useState("");
const [staffPhone, setStaffPhone] = useState("");

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getAdminOverviewApi();

      setOverview(data);
    } catch (error) {
      Alert.alert(
        "Admin Sync Failed",
        "Could not load authority dashboard data from the backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStaffMembers = useCallback(async () => {
  try {
    const savedStaff = await AsyncStorage.getItem(STAFF_STORAGE_KEY);

    if (savedStaff) {
      setStaffMembers(JSON.parse(savedStaff));
      return;
    }

    setStaffMembers(DEFAULT_STAFF_MEMBERS);
    await AsyncStorage.setItem(
      STAFF_STORAGE_KEY,
      JSON.stringify(DEFAULT_STAFF_MEMBERS)
    );
  } catch (error) {
    console.log("Load staff failed:", error);
    setStaffMembers(DEFAULT_STAFF_MEMBERS);
  }
}, []);

const saveStaffMembers = useCallback(async (nextStaff: StaffMember[]) => {
  setStaffMembers(nextStaff);
  await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(nextStaff));
}, []);

useEffect(() => {
  loadStaffMembers();
}, [loadStaffMembers]);

const clearStaffForm = () => {
  setStaffName("");
  setStaffUnit("");
  setStaffRole("");
  setStaffPhone("");
};

const handleAddStaff = async () => {
  if (!staffName.trim()) {
    Alert.alert("Staff Name Required", "Please enter the staff name.");
    return;
  }

  if (!staffUnit.trim()) {
    Alert.alert("Staff Unit Required", "Please enter the staff unit.");
    return;
  }

  const newStaff: StaffMember = {
    id: `staff-${Date.now()}`,
    name: staffName.trim(),
    unit: staffUnit.trim(),
    role: staffRole.trim() || "Responder",
    phone: staffPhone.trim(),
  };

  await saveStaffMembers([newStaff, ...staffMembers]);

  clearStaffForm();
  setStaffModalVisible(false);
};

const handleRemoveStaff = (staffId: string) => {
  Alert.alert(
    "Remove Staff?",
    "This staff member will no longer appear in the assignment list.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const nextStaff = staffMembers.filter((staff) => staff.id !== staffId);
          await saveStaffMembers(nextStaff);
        },
      },
    ]
  );
};
  useFocusEffect(
    useCallback(() => {
      fetchOverview();
    }, [fetchOverview])
  );

 const openAssignmentModal = (report: IncidentReport) => {
  const suggestedUnit = report.assignedUnit || report.aiSuggestedUnit || "";

  const suggestedStaff = staffMembers.find((staff) =>
    suggestedUnit
      ? staff.unit.toLowerCase().includes(suggestedUnit.toLowerCase()) ||
        suggestedUnit.toLowerCase().includes(staff.unit.toLowerCase())
      : false
  );

  setAssignmentReport(report);
  setSelectedStaffId(suggestedStaff?.id || "");
  setAssignmentNote(
    report.aiRecommendedAction ||
      `Handle this ${report.problemType || report.title} report.`
  );
};

const closeAssignmentModal = () => {
  setAssignmentReport(null);
  setSelectedStaffId("");
  setAssignmentNote("");
};

const handleAssignTask = async () => {
  if (!assignmentReport) return;

  const selectedStaff = staffMembers.find(
    (staff) => staff.id === selectedStaffId
  );

  if (!selectedStaff) {
    Alert.alert(
      "Staff Required",
      "Please select a staff member or team to handle this task."
    );
    return;
  }

  if (!assignmentNote.trim()) {
    Alert.alert(
      "Task Instruction Required",
      "Please enter the task instruction for the assigned responder."
    );
    return;
  }

  try {
    setUpdatingReportId(assignmentReport.id);

    await updateIncidentReportStatusApi(assignmentReport.id, {
      status: "assigned",
      actorName: "Authority Officer",
      actorRole: "authority",
      assignedToName: selectedStaff.name,
      assignedUnit: selectedStaff.unit,
      note: `Task assigned to ${selectedStaff.name} (${selectedStaff.unit}). Instruction: ${assignmentNote.trim()}`,
    });

    closeAssignmentModal();
    await fetchOverview();
  } catch (error) {
    Alert.alert(
      "Assignment Failed",
      "Could not assign this task. Check that your backend is running."
    );
  } finally {
    setUpdatingReportId(null);
  }
};

  const handleUpdateReportStatus = (
  report: IncidentReport,
  status: IncidentStatus
) => {
  const performStatusUpdate = async (
    resolutionEvidence: {
      uri: string;
      type: "image" | "video" | "document";
      uploadedAt?: string;
    }[] = []
  ) => {
    try {
      setUpdatingReportId(report.id);

      await updateIncidentReportStatusApi(report.id, {
        status,
        actorName: "Authority Officer",
        actorRole: "authority",
        assignedToName:
          status === "assigned"
            ? report.assignedToName || "Assigned responder"
            : report.assignedToName,
        resolutionSummary:
          status === "resolved"
            ? resolutionEvidence.length
              ? "Authority resolved the campus issue and attached finished-work photo evidence."
              : "Authority marked the reported issue as resolved."
            : report.resolutionSummary,
        resolutionEvidence:
          status === "resolved" ? resolutionEvidence : report.resolutionEvidence,
        note:
          status === "assigned"
            ? "Authority accepted the AI-routed report and assigned it for action."
            : status === "in_progress"
              ? "Responder has started working on this campus issue."
              : status === "resolved"
                ? resolutionEvidence.length
                  ? "Issue resolved with finished-work photo evidence."
                  : "Issue resolved without photo evidence."
                : status === "closed"
                  ? "Case has been closed after resolution."
                  : status === "escalated"
                    ? "Case escalated because it needs higher attention."
                    : status === "rejected"
                      ? "Report rejected after authority review."
                      : "Report status updated.",
      });

      await fetchOverview();
    } catch (error) {
      Alert.alert(
        "Update Failed",
        "Could not update the report status. Check that your backend is running."
      );
    } finally {
      setUpdatingReportId(null);
    }
  };

  if (status === "resolved") {
    Alert.alert(
      "Resolve With Evidence",
      "Attach a finished-work photo to prove that the issue has been handled.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Take Photo",
          onPress: async () => {
            const evidence = await takeResolutionPhoto();

            if (!evidence.length) {
              Alert.alert(
                "No Photo Added",
                "Resolution was not submitted because no finished-work photo was captured."
              );
              return;
            }

            await performStatusUpdate(evidence);
          },
        },
        {
          text: "Choose Photo",
          onPress: async () => {
            const evidence = await pickResolutionPhoto();

            if (!evidence.length) {
              Alert.alert(
                "No Photo Added",
                "Resolution was not submitted because no finished-work photo was selected."
              );
              return;
            }

            await performStatusUpdate(evidence);
          },
        },
        {
          text: "Resolve Without Photo",
          style: "destructive",
          onPress: async () => {
            await performStatusUpdate([]);
          },
        },
      ]
    );

    return;
  }

  const actionText =
    status === "assigned"
      ? "accept and assign this report"
      : status === "in_progress"
        ? "start work on this report"
        : status === "closed"
          ? "close this report"
          : status === "escalated"
            ? "escalate this report"
            : status === "rejected"
              ? "reject this report"
              : "update this report";

  Alert.alert("Update Report", `Do you want to ${actionText}?`, [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Continue",
      style: status === "rejected" ? "destructive" : "default",
      onPress: async () => {
        await performStatusUpdate([]);
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
          <Text style={styles.overline}>University of Ghana</Text>
          <Text style={styles.headerTitle}>Authority Dashboard</Text>
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
              <Database size={34} color={COLORS.primary} />
            </View>
          </View>

          <View style={styles.demoPill}>
            <Text style={styles.demoPillText}>SafeCampus AI</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Campus Issue Response</Text>

        <Text style={styles.heroText}>
          Review AI-routed campus reports, accept cases, begin action, resolve
          problems, close completed cases, and escalate unattended issues.
        </Text>
      </View>

      {!overview && loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading authority dashboard...</Text>
        </View>
      ) : null}

      {updatingReportId ? (
        <View style={styles.updatingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.updatingText}>Updating report status...</Text>
        </View>
      ) : null}

      {stats ? (
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Reports"
            value={stats.totalReports}
            tone="primary"
            icon={<Database size={21} color={COLORS.primary} />}
          />

          <StatCard
            label="Open Cases"
            value={stats.openReports}
            tone="info"
            icon={<CircleAlert size={21} color={COLORS.info} />}
          />

          <StatCard
            label="In Progress"
            value={stats.inProgressReports}
            tone="warning"
            icon={<Wrench size={21} color={COLORS.warning} />}
          />

          <StatCard
            label="Resolved"
            value={stats.resolvedReports}
            tone="primary"
            icon={<ShieldCheck size={21} color={COLORS.primary} />}
          />

          <StatCard
            label="Escalated"
            value={stats.escalatedReports}
            tone="danger"
            icon={<ArrowUpCircle size={21} color={COLORS.danger} />}
          />

          <StatCard
            label="Critical"
            value={stats.criticalReports}
            tone="danger"
            icon={<AlertTriangle size={21} color={COLORS.danger} />}
          />
        </View>
      ) : null}

      <View style={styles.section}>
  <SectionTitle
    title="Staff Directory"
    subtitle="Add responders so reports can be assigned by selection instead of typing random names."
  />

  <View style={styles.staffDirectoryCard}>
    <View style={styles.staffDirectoryHeader}>
      <View>
        <Text style={styles.staffDirectoryTitle}>Available Staff</Text>
        <Text style={styles.staffDirectorySubtitle}>
          {staffMembers.length} responder{staffMembers.length === 1 ? "" : "s"} available
        </Text>
      </View>

      <Pressable
        onPress={() => setStaffModalVisible(true)}
        style={styles.addStaffButton}
      >
        <UserCheck size={16} color={COLORS.white} />
        <Text style={styles.addStaffButtonText}>Add Staff</Text>
      </Pressable>
    </View>

    {staffMembers.length ? (
      <View style={styles.staffList}>
        {staffMembers.map((staff) => (
          <View key={staff.id} style={styles.staffRow}>
            <View style={styles.staffAvatar}>
              <UserCheck size={18} color={COLORS.primary} />
            </View>

            <View style={styles.staffTextBox}>
              <Text style={styles.staffName}>{staff.name}</Text>
              <Text style={styles.staffMeta}>
                {staff.unit} • {staff.role}
              </Text>
              {staff.phone ? (
                <Text style={styles.staffPhone}>{staff.phone}</Text>
              ) : null}
            </View>

            <Pressable
              onPress={() => handleRemoveStaff(staff.id)}
              style={styles.removeStaffButton}
            >
              <XCircle size={18} color={COLORS.danger} />
            </Pressable>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.noStaffText}>
        No staff added yet. Add staff before assigning reports.
      </Text>
    )}
  </View>
</View>

      <View style={styles.section}>
        <SectionTitle
          title="Open Campus Reports"
          subtitle="AI-classified reports waiting for authority action."
        />

        {overview?.openCampusReports.length ? (
          <View style={styles.reportList}>
            {overview.openCampusReports.map((report) => (
              <CampusReportCard
  key={report.id}
  report={report}
  onUpdateStatus={handleUpdateReportStatus}
  onAssignTask={openAssignmentModal}
/>
            ))}
          </View>
        ) : (
          <EmptyCard
            icon={<ShieldCheck size={34} color={COLORS.primary} />}
            title="No open campus reports"
            text="When students submit campus issues, they will appear here for authority action."
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle
          title="Urgent / Critical Reports"
          subtitle="High-priority issues that may need faster response."
        />

        {overview?.urgentCampusReports.length ? (
          <View style={styles.reportList}>
            {overview.urgentCampusReports.map((report) => (
              <CampusReportCard
  key={`urgent-${report.id}`}
  report={report}
  onUpdateStatus={handleUpdateReportStatus}
  onAssignTask={openAssignmentModal}
/>
            ))}
          </View>
        ) : (
          <EmptyCard
            icon={<CheckCircle2 size={34} color={COLORS.primary} />}
            title="No urgent reports"
            text="Critical campus issues such as fire, medical emergencies, or electrical hazards will appear here."
          />
        )}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Brain size={22} color={COLORS.primary} />
        </View>

        <View style={styles.infoTextBox}>
          <Text style={styles.infoTitle}>How the system solves the problem</Text>
          <Text style={styles.infoText}>
            The system does not stop after receiving a report. It creates a
            case, assigns it to a responsible unit, tracks progress, stores
            authority actions, and escalates unresolved issues.
          </Text>
        </View>
      </View>
      <Modal
  visible={!!assignmentReport}
  transparent
  animationType="slide"
  onRequestClose={closeAssignmentModal}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.assignmentModal}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentIcon}>
          <UserCheck size={24} color={COLORS.primary} />
        </View>

        <View style={styles.assignmentTitleBox}>
          <Text style={styles.assignmentTitle}>Assign Task</Text>
          <Text style={styles.assignmentSubtitle}>
            {assignmentReport?.problemType || assignmentReport?.title}
          </Text>
        </View>
      </View>

      <View style={styles.assignmentInfoBox}>
        <Text style={styles.assignmentInfoLabel}>AI suggested unit</Text>
        <Text style={styles.assignmentInfoText}>
          {assignmentReport?.assignedUnit ||
            assignmentReport?.aiSuggestedUnit ||
            "Responsible Unit"}
        </Text>
      </View>

      <Text style={styles.modalLabel}>Select responder / team</Text>

<View style={styles.staffPickerBox}>
  {staffMembers.length ? (
    staffMembers.map((staff) => {
      const selected = selectedStaffId === staff.id;

      return (
        <Pressable
          key={staff.id}
          onPress={() => setSelectedStaffId(staff.id)}
          style={[
            styles.staffOption,
            selected && styles.staffOptionSelected,
          ]}
        >
          <View
            style={[
              styles.staffOptionIcon,
              selected && styles.staffOptionIconSelected,
            ]}
          >
            <UserCheck
              size={17}
              color={selected ? COLORS.white : COLORS.primary}
            />
          </View>

          <View style={styles.staffOptionTextBox}>
            <Text
              style={[
                styles.staffOptionName,
                selected && styles.staffOptionNameSelected,
              ]}
            >
              {staff.name}
            </Text>

            <Text
              style={[
                styles.staffOptionMeta,
                selected && styles.staffOptionMetaSelected,
              ]}
            >
              {staff.unit} • {staff.role}
            </Text>
          </View>
        </Pressable>
      );
    })
  ) : (
    <View style={styles.noStaffModalBox}>
      <Text style={styles.noStaffText}>
        No staff available. Add staff first before assigning this report.
      </Text>

      <Pressable
        onPress={() => setStaffModalVisible(true)}
        style={styles.addStaffInlineButton}
      >
        <Text style={styles.addStaffInlineText}>Add Staff</Text>
      </Pressable>
    </View>
  )}
</View>

<Modal
  visible={staffModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setStaffModalVisible(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.assignmentModal}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentIcon}>
          <UserCheck size={24} color={COLORS.primary} />
        </View>

        <View style={styles.assignmentTitleBox}>
          <Text style={styles.assignmentTitle}>Add Staff</Text>
          <Text style={styles.assignmentSubtitle}>
            Add responders who can be assigned campus reports.
          </Text>
        </View>
      </View>

      <Text style={styles.modalLabel}>Staff name</Text>
      <TextInput
        value={staffName}
        onChangeText={setStaffName}
        placeholder="Example: Technician Kwame Mensah"
        placeholderTextColor={COLORS.softText}
        style={styles.modalInput}
      />

      <Text style={styles.modalLabel}>Unit / department</Text>
      <TextInput
        value={staffUnit}
        onChangeText={setStaffUnit}
        placeholder="Example: Facilities Maintenance"
        placeholderTextColor={COLORS.softText}
        style={styles.modalInput}
      />

      <Text style={styles.modalLabel}>Role</Text>
      <TextInput
        value={staffRole}
        onChangeText={setStaffRole}
        placeholder="Example: Maintenance Technician"
        placeholderTextColor={COLORS.softText}
        style={styles.modalInput}
      />

      <Text style={styles.modalLabel}>Phone number</Text>
      <TextInput
        value={staffPhone}
        onChangeText={setStaffPhone}
        placeholder="Example: 0240000000"
        placeholderTextColor={COLORS.softText}
        keyboardType="phone-pad"
        style={styles.modalInput}
      />

      <View style={styles.modalActions}>
        <Pressable
          onPress={() => {
            clearStaffForm();
            setStaffModalVisible(false);
          }}
          style={styles.modalCancelButton}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </Pressable>

        <Pressable onPress={handleAddStaff} style={styles.modalAssignButton}>
          <Text style={styles.modalAssignText}>Save Staff</Text>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>

      <Text style={styles.modalLabel}>Task instruction</Text>
      <TextInput
        value={assignmentNote}
        onChangeText={setAssignmentNote}
        placeholder="Example: Inspect and replace the faulty projector."
        placeholderTextColor={COLORS.softText}
        style={[styles.modalInput, styles.modalTextArea]}
        multiline
      />

      <View style={styles.modalActions}>
        <Pressable
          onPress={closeAssignmentModal}
          style={styles.modalCancelButton}
        >
          <Text style={styles.modalCancelText}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleAssignTask}
          style={styles.modalAssignButton}
        >
          <Text style={styles.modalAssignText}>Assign Task</Text>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>

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
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.12)",
  },

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
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

  reportList: {
    gap: SPACING.md,
  },

  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  reportTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
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

  reportTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  reportTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  reportMeta: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
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

  pillRow: {
    marginTop: SPACING.md,
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

  duplicatePill: {
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },

  duplicateText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.info,
  },

  reportDescription: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 21,
    fontWeight: "700",
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

  infoRowText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    lineHeight: 18,
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

  actionRecommendationBox: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },

  actionRecommendationText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.warningDark,
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

  historyContent: {
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

  actionButton: {
    minHeight: 42,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionButtonText: {
    fontSize: FONT_SIZE.xs,
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

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  emptyTitle: {
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
  resolutionEvidenceBox: {
  marginTop: SPACING.md,
  backgroundColor: COLORS.primaryLight,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  borderWidth: 1,
  borderColor: "rgba(5, 150, 105, 0.18)",
},

resolutionEvidenceTitle: {
  fontSize: FONT_SIZE.xs,
  color: COLORS.primaryDark,
  fontWeight: "900",
  textTransform: "uppercase",
  marginBottom: SPACING.sm,
},

resolutionEvidenceGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: SPACING.sm,
},

resolutionEvidenceImage: {
  width: 82,
  height: 82,
  borderRadius: RADIUS.lg,
  backgroundColor: COLORS.surfaceMuted,
},

resolutionSummaryText: {
  marginTop: SPACING.sm,
  fontSize: FONT_SIZE.xs,
  color: COLORS.primaryDark,
  fontWeight: "800",
  lineHeight: 18,
},
modalBackdrop: {
  flex: 1,
  backgroundColor: "rgba(2, 6, 23, 0.58)",
  justifyContent: "flex-end",
  padding: SPACING.lg,
},

assignmentModal: {
  backgroundColor: COLORS.surface,
  borderRadius: 30,
  padding: SPACING.lg,
  borderWidth: 1,
  borderColor: COLORS.border,
  ...SHADOWS.card,
},

assignmentHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.md,
  marginBottom: SPACING.lg,
},

assignmentIcon: {
  width: 52,
  height: 52,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primaryLight,
  alignItems: "center",
  justifyContent: "center",
},

assignmentTitleBox: {
  flex: 1,
},

assignmentTitle: {
  fontSize: FONT_SIZE.lg,
  color: COLORS.text,
  fontWeight: "900",
},

assignmentSubtitle: {
  marginTop: 3,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
  lineHeight: 18,
},

assignmentInfoBox: {
  backgroundColor: COLORS.primaryLight,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  marginBottom: SPACING.lg,
},

assignmentInfoLabel: {
  fontSize: FONT_SIZE.xs,
  color: COLORS.primaryDark,
  fontWeight: "900",
  textTransform: "uppercase",
},

assignmentInfoText: {
  marginTop: 4,
  fontSize: FONT_SIZE.sm,
  color: COLORS.primaryDark,
  fontWeight: "800",
  lineHeight: 20,
},

modalLabel: {
  fontSize: FONT_SIZE.xs,
  color: COLORS.text,
  fontWeight: "900",
  textTransform: "uppercase",
  marginBottom: SPACING.sm,
},

modalInput: {
  minHeight: 54,
  borderRadius: RADIUS.lg,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.border,
  paddingHorizontal: SPACING.lg,
  paddingVertical: SPACING.md,
  fontSize: FONT_SIZE.sm,
  color: COLORS.text,
  fontWeight: "700",
  marginBottom: SPACING.lg,
},

modalTextArea: {
  minHeight: 110,
  textAlignVertical: "top",
},

modalActions: {
  flexDirection: "row",
  gap: SPACING.md,
},

modalCancelButton: {
  flex: 1,
  minHeight: 52,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.surfaceMuted,
  alignItems: "center",
  justifyContent: "center",
},

modalCancelText: {
  fontSize: FONT_SIZE.sm,
  color: COLORS.mutedText,
  fontWeight: "900",
},

modalAssignButton: {
  flex: 1,
  minHeight: 52,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primary,
  alignItems: "center",
  justifyContent: "center",
},

modalAssignText: {
  fontSize: FONT_SIZE.sm,
  color: COLORS.white,
  fontWeight: "900",
},

staffDirectoryCard: {
  backgroundColor: COLORS.surface,
  borderRadius: RADIUS.xl,
  padding: SPACING.lg,
  borderWidth: 1,
  borderColor: COLORS.border,
  ...SHADOWS.soft,
},

staffDirectoryHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: SPACING.md,
  marginBottom: SPACING.md,
},

staffDirectoryTitle: {
  fontSize: FONT_SIZE.md,
  color: COLORS.text,
  fontWeight: "900",
},

staffDirectorySubtitle: {
  marginTop: 3,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
},

addStaffButton: {
  minHeight: 42,
  borderRadius: RADIUS.full,
  paddingHorizontal: SPACING.md,
  backgroundColor: COLORS.primary,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
},

addStaffButtonText: {
  color: COLORS.white,
  fontSize: FONT_SIZE.xs,
  fontWeight: "900",
},

staffList: {
  gap: SPACING.sm,
},

staffRow: {
  backgroundColor: COLORS.surfaceMuted,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.md,
},

staffAvatar: {
  width: 42,
  height: 42,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primaryLight,
  alignItems: "center",
  justifyContent: "center",
},

staffTextBox: {
  flex: 1,
},

staffName: {
  fontSize: FONT_SIZE.sm,
  color: COLORS.text,
  fontWeight: "900",
},

staffMeta: {
  marginTop: 3,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
  lineHeight: 17,
},

staffPhone: {
  marginTop: 2,
  fontSize: FONT_SIZE.xs,
  color: COLORS.primary,
  fontWeight: "800",
},

removeStaffButton: {
  width: 36,
  height: 36,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.dangerLight,
  alignItems: "center",
  justifyContent: "center",
},

noStaffText: {
  fontSize: FONT_SIZE.sm,
  color: COLORS.mutedText,
  fontWeight: "700",
  lineHeight: 20,
},

staffPickerBox: {
  marginBottom: SPACING.lg,
  gap: SPACING.sm,
},

staffOption: {
  borderRadius: RADIUS.lg,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.surface,
  padding: SPACING.md,
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.md,
},

staffOptionSelected: {
  borderColor: COLORS.primary,
  backgroundColor: COLORS.primaryLight,
},

staffOptionIcon: {
  width: 38,
  height: 38,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primaryLight,
  alignItems: "center",
  justifyContent: "center",
},

staffOptionIconSelected: {
  backgroundColor: COLORS.primary,
},

staffOptionTextBox: {
  flex: 1,
},

staffOptionName: {
  fontSize: FONT_SIZE.sm,
  color: COLORS.text,
  fontWeight: "900",
},

staffOptionNameSelected: {
  color: COLORS.primaryDark,
},

staffOptionMeta: {
  marginTop: 3,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
  lineHeight: 17,
},

staffOptionMetaSelected: {
  color: COLORS.primaryDark,
},

noStaffModalBox: {
  backgroundColor: COLORS.surfaceMuted,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  gap: SPACING.md,
},

addStaffInlineButton: {
  alignSelf: "flex-start",
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primary,
  paddingHorizontal: SPACING.lg,
  paddingVertical: SPACING.sm,
},

addStaffInlineText: {
  color: COLORS.white,
  fontSize: FONT_SIZE.xs,
  fontWeight: "900",
},
});