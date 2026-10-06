import { ReactNode, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SMS from "expo-sms";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  ChevronRight,
  ClipboardList,
  ContactRound,
  MapPinned,
  Megaphone,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Route,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  FileText,
  CirclePlus,
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

type ToolCardProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone?: "green" | "red" | "blue" | "purple";
  onPress: () => void;
};

type ReportPreviewCardProps = {
  title: string;
  subtitle: string;
  status: string;
  statusTone?: "warning" | "success";
  icon: ReactNode;
};

const HERO_IMAGE = require("../../../assets/images/home-hero-campus.png");

function getTone(tone: ToolCardProps["tone"] = "green") {
  if (tone === "red") {
    return {
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
    };
  }

  if (tone === "blue") {
    return {
      iconBg: "#DBEAFE",
      iconColor: "#2563EB",
    };
  }

  if (tone === "purple") {
    return {
      iconBg: "#F3E8FF",
      iconColor: "#7C3AED",
    };
  }

  return {
    iconBg: "#DCFCE7",
    iconColor: "#059669",
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

function ToolCard({
  title,
  subtitle,
  icon,
  tone = "green",
  onPress,
}: ToolCardProps) {
  const toneStyles = getTone(tone);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.toolIconWrap,
          { backgroundColor: toneStyles.iconBg },
        ]}
      >
        {icon}
      </View>

      <View style={styles.toolTextWrap}>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.toolSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.toolArrow}>
        <ChevronRight size={18} color={COLORS.softText} />
      </View>
    </Pressable>
  );
}

function ReportPreviewCard({
  title,
  subtitle,
  status,
  statusTone = "warning",
  icon,
}: ReportPreviewCardProps) {
  const isSuccess = statusTone === "success";

  return (
    <View style={styles.reportPreviewCard}>
      <View style={styles.reportPreviewTop}>
        <View style={styles.reportPreviewThumb}>{icon}</View>

        <View style={styles.reportPreviewTextWrap}>
          <View
            style={[
              styles.statusBadge,
              isSuccess ? styles.statusSuccess : styles.statusWarning,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isSuccess
                  ? styles.statusSuccessText
                  : styles.statusWarningText,
              ]}
            >
              {status}
            </Text>
          </View>

          <Text style={styles.reportPreviewTitle}>{title}</Text>
          <Text style={styles.reportPreviewSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
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

  const recentReports = useMemo(() => {
    return [...reports].slice(0, 2);
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
    <Screen scroll contentStyle={{ paddingBottom: insets.bottom + 120 }}>
      <View style={styles.page}>
        {/* Top Green Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable style={styles.headerIconBtn}>
              <Menu size={24} color={COLORS.white} />
            </Pressable>

            <View style={styles.headerBrandWrap}>
              <ShieldCheck size={24} color={COLORS.white} />
              <Text style={styles.headerBrandText}>SafeCampus AI</Text>
            </View>

            <Pressable onPress={fetchReports} style={styles.headerIconBtn}>
              {loadingReports ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Bell size={22} color={COLORS.white} />
              )}
              <View style={styles.headerNotificationDot} />
            </Pressable>
          </View>

          <View style={styles.headerStatusRow}>
            <View style={styles.headerPill}>
              <ShieldCheck size={15} color={COLORS.primary} />
              <Text style={styles.headerPillText}>Protected</Text>
            </View>

            <View style={styles.headerPill}>
              <CircleAlert size={15} color={COLORS.primary} />
              <Text style={styles.headerPillText}>Emergency Ready</Text>
            </View>
          </View>
        </View>

        {/* Floating Ask Card */}
        <View style={styles.askCard}>
          <View style={styles.askLeftIcon}>
            <ShieldCheck size={22} color={COLORS.primary} />
          </View>

          <View style={styles.askTextWrap}>
            <Text style={styles.askText}>What would you like to do today?</Text>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/report")}
            style={styles.askActionBtn}
          >
            <CirclePlus size={24} color={COLORS.white} />
          </Pressable>
        </View>

        {/* Small Action Strip */}
        <View style={styles.actionStrip}>
          <Pressable
            style={styles.actionStripItem}
            onPress={() => router.push("/(tabs)/walk-safe")}
          >
            <View style={[styles.actionStripIcon, { backgroundColor: "#DCFCE7" }]}>
              <Route size={20} color="#059669" />
            </View>
            <Text style={[styles.actionStripLabel, { color: "#059669" }]}>
              Check In
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionStripItem}
            onPress={() => router.push("/contacts")}
          >
            <View style={[styles.actionStripIcon, { backgroundColor: "#DCFCE7" }]}>
              <ContactRound size={20} color="#16A34A" />
            </View>
            <Text style={[styles.actionStripLabel, { color: "#16A34A" }]}>
              My Circle
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionStripItem}
            onPress={() => router.push("/(tabs)/report")}
          >
            <View style={[styles.actionStripIcon, { backgroundColor: "#FEE2E2" }]}>
              <ShieldAlert size={20} color="#DC2626" />
            </View>
            <Text style={[styles.actionStripLabel, { color: "#DC2626" }]}>
              Report
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionStripItem}
            onPress={() => router.push("/admin")}
          >
            <View style={[styles.actionStripIcon, { backgroundColor: "#DBEAFE" }]}>
              <BarChart3 size={20} color="#2563EB" />
            </View>
            <Text style={[styles.actionStripLabel, { color: "#2563EB" }]}>
              Insights
            </Text>
          </Pressable>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
  <Image
    source={HERO_IMAGE}
    style={styles.heroBannerImage}
    resizeMode="cover"
  />

  <View style={styles.heroTextBlock}>
    <Text style={styles.heroEyebrow}>A SAFER, BRIGHTER TOMORROW</Text>

    <Text style={styles.heroTitle}>Make Campus Better</Text>

    <Text style={styles.heroDescription}>
      Report classroom faults, sanitation issues, lighting problems, ICT
      problems, hazards, and student safety concerns.
    </Text>

    <Pressable
      onPress={() => router.push("/(tabs)/report")}
      style={({ pressed }) => [
        styles.heroButton,
        pressed && styles.cardPressed,
      ]}
    >
      <Megaphone size={18} color={COLORS.white} />
      <Text style={styles.heroButtonText}>Report an Issue</Text>
      <ChevronRight size={18} color={COLORS.white} />
    </Pressable>
  </View>
</View>

        {/* Tools */}
        <View style={styles.toolsGrid}>
          <ToolCard
            title="Track Reports"
            subtitle="Check status and view updates"
            icon={<FileText size={22} color="#059669" />}
            tone="green"
            onPress={() => router.push("/activity")}
          />

          <ToolCard
            title="Campus Map"
            subtitle="Find facilities and report hotspots"
            icon={<MapPinned size={22} color="#DC2626" />}
            tone="red"
            onPress={() => router.push("/(tabs)/risk-map")}
          />

          <ToolCard
            title="Live Safe Navigation"
            subtitle="Get safe walking routes across campus"
            icon={<Route size={22} color="#2563EB" />}
            tone="blue"
            onPress={() => router.push("/(tabs)/walk-safe")}
          />

          <ToolCard
            title="My Activity"
            subtitle="View your reports and contributions"
            icon={<BarChart3 size={22} color="#7C3AED" />}
            tone="purple"
            onPress={() => router.push("/activity")}
          />
        </View>

        {/* Alert Card */}
        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <Bell size={20} color="#D97706" />
          </View>

          <View style={styles.alertTextWrap}>
            <View style={styles.alertTopRow}>
              <Text style={styles.alertTitle}>Today's Campus Alert</Text>
              <Text style={styles.alertTime}>8:23 AM</Text>
            </View>

            <Text style={styles.alertMessage}>
              Faulty light reported near Science Block (East Wing). Use
              alternative routes at night for safer access.
            </Text>
          </View>

          <ChevronRight size={18} color={COLORS.softText} />
        </View>

        {/* Recent Reports */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Recent Reports</Text>

          <Pressable onPress={() => router.push("/activity")}>
            <Text style={styles.sectionLink}>View All</Text>
          </Pressable>
        </View>

        <View style={styles.recentReportsRow}>
          {recentReports.length > 0 ? (
            recentReports.slice(0, 2).map((report, index) => (
              <ReportPreviewCard
                key={report.id ?? `${report.title}-${index}`}
                title={report.title}
                subtitle={report.locationName || "University of Ghana campus"}
                status={report.status}
                statusTone={isResolvedReport(report) ? "success" : "warning"}
                icon={
                  isResolvedReport(report) ? (
                    <CheckCircle2 size={26} color={COLORS.primary} />
                  ) : (
                    <ClipboardList size={26} color={COLORS.warning} />
                  )
                }
              />
            ))
          ) : (
            <>
              <ReportPreviewCard
                title="Faulty Light in LT1 Classroom"
                subtitle="Reported 2 days ago"
                status="Assigned"
                statusTone="warning"
                icon={<ClipboardList size={26} color={COLORS.warning} />}
              />
              <ReportPreviewCard
                title="Blocked Walkway near Library"
                subtitle="Reported 5 days ago"
                status="Resolved"
                statusTone="success"
                icon={<CheckCircle2 size={26} color={COLORS.primary} />}
              />
            </>
          )}
        </View>

        {/* Live Safe Navigation Banner */}
        <View style={styles.navigationBanner}>
          <View style={styles.navigationBannerLeft}>
            <View style={styles.navigationBannerIcon}>
              <MapPinned size={22} color={COLORS.primary} />
            </View>

            <Text style={styles.navigationBannerTitle}>Live Safe Navigation</Text>
            <Text style={styles.navigationBannerText}>
              Find the safest routes, avoid high-risk areas, and walk
              confidently across campus.
            </Text>

            <Pressable
              onPress={() => router.push("/(tabs)/walk-safe")}
              style={styles.navigationBannerButton}
            >
              <Text style={styles.navigationBannerButtonText}>
                Start Navigation
              </Text>
              <ChevronRight size={18} color={COLORS.white} />
            </Pressable>
          </View>

          <View style={styles.navigationBannerMap}>
            <View style={styles.fakeMapCard}>
              <View style={styles.fakeMapPath} />
              <View style={styles.fakeMapDotStart} />
              <View style={styles.fakeMapDotEnd} />
              <View style={styles.fakeMapBubble}>
                <Text style={styles.fakeMapBubbleText}>
                  Safer routes for a brighter campus
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SOS Section */}
        <View style={styles.sosSectionCard}>
          <View style={styles.sosTopBadge}>
            <ShieldAlert size={16} color={COLORS.danger} />
            <Text style={styles.sosTopBadgeText}>EMERGENCY SOS</Text>
          </View>

          <View style={styles.sosCircleOuter}>
            <View style={styles.sosCircleMiddle}>
              <Pressable
                onPress={handleSOSPress}
                style={({ pressed }) => [
                  styles.sosCircleButton,
                  pressed && styles.sosPressed,
                ]}
              >
                <ShieldAlert size={34} color={COLORS.white} />
                <Text style={styles.sosCircleText}>SOS</Text>
                <Text style={styles.sosCircleSubText}>Tap for help</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.sosHintText}>
            If you feel unsafe, press SOS. SafeCampus AI will capture your
            current GPS location and notify your trusted contact immediately.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    marginHorizontal: -SPACING.xxl,
    marginTop: -SPACING.lg,
    backgroundColor: "#F7F9FC",
  },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 88,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerBrandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerBrandText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.white,
    fontWeight: "900",
  },

  headerNotificationDot: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  headerStatusRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  headerPill: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  headerPillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  askCard: {
    marginHorizontal: SPACING.lg,
    marginTop: -40,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    ...SHADOWS.card,
  },

  askLeftIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  askTextWrap: {
    flex: 1,
  },

  askText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  askActionBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  actionStrip: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    ...SHADOWS.soft,
  },

  actionStripItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: "#EEF2F7",
  },

  actionStripIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  actionStripLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },
  heroCard: {
  marginTop: SPACING.xl,
  marginHorizontal: SPACING.lg,
  backgroundColor: COLORS.surface,
  borderRadius: 30,
  borderWidth: 1,
  borderColor: "#DDEFE5",
  overflow: "hidden",
  ...SHADOWS.soft,
},

heroBannerImage: {
  width: "100%",
  height: 210,
  backgroundColor: COLORS.primaryLight,
},

heroTextBlock: {
  padding: SPACING.lg,
  backgroundColor: "#F6FFFA",
},

heroEyebrow: {
  fontSize: FONT_SIZE.xs,
  fontWeight: "900",
  color: COLORS.primary,
  letterSpacing: 1,
  textTransform: "uppercase",
},

heroTitle: {
  marginTop: SPACING.sm,
  fontSize: 30,
  lineHeight: 35,
  color: COLORS.primaryDark,
  fontWeight: "900",
  letterSpacing: -0.7,
},

heroDescription: {
  marginTop: SPACING.sm,
  fontSize: FONT_SIZE.sm,
  lineHeight: 21,
  color: COLORS.text,
  fontWeight: "600",
},

heroButton: {
  marginTop: SPACING.lg,
  minHeight: 54,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primary,
  paddingHorizontal: SPACING.lg,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: SPACING.sm,
  ...SHADOWS.soft,
},

heroButtonText: {
  color: COLORS.white,
  fontSize: FONT_SIZE.md,
  fontWeight: "900",
},

  toolsGrid: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  toolCard: {
    width: "47.8%",
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  toolIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  toolTextWrap: {},

  toolTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "900",
  },

  toolSubtitle: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  toolArrow: {
    marginTop: SPACING.md,
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  alertCard: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: "#FFF7E6",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FDE3A7",
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  alertIconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  alertTextWrap: {
    flex: 1,
  },

  alertTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  alertTitle: {
    fontSize: FONT_SIZE.md,
    color: "#92400E",
    fontWeight: "900",
  },

  alertTime: {
    fontSize: FONT_SIZE.xs,
    color: "#92400E",
    fontWeight: "800",
  },

  alertMessage: {
    marginTop: 5,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    color: "#92400E",
    fontWeight: "700",
  },

  sectionHeader: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.text,
    fontWeight: "900",
  },

  sectionLink: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: "900",
  },

  recentReportsRow: {
    marginTop: SPACING.md,
    marginHorizontal: SPACING.lg,
    gap: SPACING.md,
  },

  reportPreviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOWS.soft,
  },

  reportPreviewTop: {
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "flex-start",
  },

  reportPreviewThumb: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  reportPreviewTextWrap: {
    flex: 1,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },

  statusWarning: {
    backgroundColor: "#FEF3C7",
  },

  statusSuccess: {
    backgroundColor: "#DCFCE7",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  statusWarningText: {
    color: "#B45309",
  },

  statusSuccessText: {
    color: "#15803D",
  },

  reportPreviewTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "900",
  },

  reportPreviewSubtitle: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  navigationBanner: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: "#ECFDF5",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    padding: SPACING.lg,
    overflow: "hidden",
    ...SHADOWS.soft,
  },

  navigationBannerLeft: {},

  navigationBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  navigationBannerTitle: {
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  navigationBannerText: {
    marginTop: 6,
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },

  navigationBannerButton: {
    marginTop: SPACING.lg,
    alignSelf: "flex-start",
    minHeight: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },

  navigationBannerButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
  },

  navigationBannerMap: {
    marginTop: SPACING.lg,
  },

  fakeMapCard: {
    height: 170,
    borderRadius: 22,
    backgroundColor: "#DFF7EA",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#C8EFD9",
  },

  fakeMapPath: {
    position: "absolute",
    left: 70,
    top: 95,
    width: 180,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: "-15deg" }],
  },

  fakeMapDotStart: {
    position: "absolute",
    left: 54,
    bottom: 34,
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  fakeMapDotEnd: {
    position: "absolute",
    right: 26,
    top: 34,
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    backgroundColor: "#10B981",
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  fakeMapBubble: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: 150,
  },

  fakeMapBubbleText: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  sosSectionCard: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#F8D7DA",
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.soft,
  },

  sosTopBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sosTopBadgeText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  sosCircleOuter: {
    marginTop: SPACING.xl,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(220, 38, 38, 0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.10)",
  },

  sosCircleMiddle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(220, 38, 38, 0.13)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.16)",
  },

  sosCircleButton: {
    width: 134,
    height: 134,
    borderRadius: 67,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },

  sosCircleText: {
    marginTop: 6,
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sosCircleSubText: {
    marginTop: 2,
    color: "rgba(255,255,255,0.85)",
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
  },

  sosHintText: {
    marginTop: SPACING.lg,
    textAlign: "center",
    fontSize: FONT_SIZE.sm,
    lineHeight: 21,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },

  sosPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
});