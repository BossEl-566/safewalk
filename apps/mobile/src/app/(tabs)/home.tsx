import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BellRing,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  CirclePlus,
  ContactRound,
  Footprints,
  Map,
  MapPin,
  Menu,
  RadioTower,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
} from "lucide-react-native";

import SafeWalkLogo from "../../assets/safewalk-ai-logo.png";

import { useContactStore } from "../../store/contactStore";
import { useSOSStore } from "../../store/sosStore";
import { getCurrentLocation } from "../../lib/location";
import { Screen } from "../../components/Screen";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { createSOSAlertApi } from "../../lib/sosApi";

type SOSCircleButtonProps = {
  onPress: () => void;
};

type SafetyToolCardProps = {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "danger" | "warning" | "info";
};

type QuickActionProps = {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "danger" | "warning" | "info";
};

function SOSCircleButton({ onPress }: SOSCircleButtonProps) {
  return (
    <View style={styles.sosCircleOuter}>
      <View style={styles.sosCircleMiddle}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.sosCircleButton,
            pressed && styles.sosCircleButtonPressed,
          ]}
        >
          <ShieldAlert size={34} color={COLORS.white} />
          <Text style={styles.sosCircleText}>SOS</Text>
          <Text style={styles.sosCircleSubText}>Tap for help</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getVariantColor(variant: SafetyToolCardProps["variant"]) {
  if (variant === "danger") {
    return {
      color: COLORS.danger,
      lightColor: COLORS.dangerLight,
    };
  }

  if (variant === "warning") {
    return {
      color: COLORS.warning,
      lightColor: COLORS.warningLight,
    };
  }

  if (variant === "info") {
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

function QuickAction({
  title,
  icon,
  onPress,
  variant = "primary",
}: QuickActionProps) {
  const { color, lightColor } = getVariantColor(variant);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: lightColor }]}>
        {icon}
      </View>

      <Text style={[styles.quickActionText, { color }]}>{title}</Text>
    </Pressable>
  );
}

function SafetyToolCard({
  title,
  description,
  badge,
  icon,
  onPress,
  variant = "primary",
}: SafetyToolCardProps) {
  const { color, lightColor } = getVariantColor(variant);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.toolIconBox, { backgroundColor: lightColor }]}>
        {icon}
      </View>

      <View style={styles.toolContent}>
        <View style={styles.toolTitleRow}>
          <Text style={styles.toolTitle}>{title}</Text>

          {badge ? (
            <View style={[styles.toolBadge, { backgroundColor: lightColor }]}>
              <Text style={[styles.toolBadgeText, { color }]}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.toolDescription}>{description}</Text>
      </View>

      <View style={styles.toolArrow}>
        <ChevronRight size={18} color={COLORS.mutedText} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const contacts = useContactStore((state) => state.contacts);
  const createSOSAlert = useSOSStore((state) => state.createSOSAlert);

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
      const location = await getCurrentLocation();

      const alertId = createSOSAlert({
        userName: "SafeWalk User",
        location,
      });

      const alert = useSOSStore.getState().getAlertById(alertId);

      if (alert) {
        createSOSAlertApi({
          userName: alert.userName,
          location: alert.location,
          message: alert.message,
          source: "sos_button",
          trustedContactName: contacts[0]?.name ?? "",
          trustedContactPhone: contacts[0]?.phone ?? "",
        }).catch((error) => {
          console.log("SOS backend sync failed:", error);
        });
      }

      router.push({
        pathname: "/sos/active",
        params: { alertId },
      });
    } catch (error) {
      Alert.alert(
        "Location Error",
        error instanceof Error
          ? error.message
          : "Unable to get your current location."
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

            <Image
              source={SafeWalkLogo}
              resizeMode="contain"
              style={styles.logo}
            />

            <Pressable style={styles.bellButton}>
              <BellRing size={22} color={COLORS.white} />

              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              <ShieldCheck size={14} color={COLORS.primaryDark} />
              <Text style={styles.statusText}>Protected</Text>
            </View>

            <View style={styles.statusPillWhite}>
              <RadioTower size={14} color={COLORS.primary} />
              <Text style={styles.statusTextGreen}>Emergency Ready</Text>
            </View>
          </View>

          <View style={styles.searchCard}>
            <View style={styles.avatar}>
              <ShieldCheck size={20} color={COLORS.primary} />
            </View>

            <Text style={styles.searchText}>What is your walk today?</Text>

            <MapPin size={22} color={COLORS.mutedText} />

            <Pressable
              onPress={() => router.push("/(tabs)/report")}
              style={styles.plusButton}
            >
              <CirclePlus size={24} color={COLORS.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.quickActionsCard}>
          <QuickAction
            title="Check In"
            variant="primary"
            icon={<ShieldCheck size={19} color={COLORS.primary} />}
            onPress={() => router.push("/navigation")}
          />

          <View style={styles.quickDivider} />

          <QuickAction
            title="My Circle"
            variant="primary"
            icon={<UsersRound size={19} color={COLORS.primary} />}
            onPress={() => router.push("/contacts")}
          />

          <View style={styles.quickDivider} />

          <QuickAction
            title="Report"
            variant="danger"
            icon={<TriangleAlert size={19} color={COLORS.danger} />}
            onPress={() => router.push("/(tabs)/report")}
          />

          <View style={styles.quickDivider} />

          <QuickAction
            title="Insights"
            variant="info"
            icon={<ChartNoAxesColumnIncreasing size={19} color={COLORS.info} />}
            onPress={() => router.push("/(tabs)/risk-map")}
          />
        </View>

        <View style={styles.emergencyPostCard}>
          <View style={styles.postHeader}>
            <View style={styles.postAvatar}>
              <ShieldAlert size={24} color={COLORS.danger} />
            </View>

            <View style={styles.postHeaderText}>
              <Text style={styles.postName}>Emergency Assistance</Text>
              <Text style={styles.postMeta}>Live location alert • Ready now</Text>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <Text style={styles.postText}>
            If you feel unsafe, press SOS. SafeWalk AI will capture your current
            GPS location and notify your trusted contact immediately.
          </Text>

          <View style={styles.sosDisplayCard}>
            <View style={styles.sosTopLabel}>
              <ShieldAlert size={17} color={COLORS.danger} />
              <Text style={styles.sosTopLabelText}>Emergency SOS</Text>
            </View>

            <SOSCircleButton onPress={handleSOSPress} />

            <View style={styles.sosInfoStrip}>
              <MapPin size={17} color={COLORS.danger} />
              <Text style={styles.sosHint}>
                Your current location will be sent to your trusted contact.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatusRow}>
          <View style={styles.quickStatusCard}>
            <View style={styles.quickStatusIcon}>
              <ContactRound size={20} color={COLORS.primary} />
            </View>

            <Text style={styles.quickStatusValue}>{contacts.length}</Text>
            <Text style={styles.quickStatusLabel}>Trusted contacts</Text>
          </View>

          <View style={styles.quickStatusCard}>
            <View style={styles.quickStatusIconWarning}>
              <BellRing size={20} color={COLORS.warning} />
            </View>

            <Text style={styles.quickStatusValue}>Live</Text>
            <Text style={styles.quickStatusLabel}>Safety alerts</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety tools</Text>
          <Text style={styles.sectionSubtitle}>
            Use these tools before, during, or after a safety incident.
          </Text>
        </View>

        <View style={styles.toolsList}>
          <SafetyToolCard
            title="Walk Safe"
            description="Start a monitored walk to your hostel, lecture hall, or destination."
            badge="Live"
            variant="primary"
            icon={<Footprints size={23} color={COLORS.primary} />}
            onPress={() => router.push("/(tabs)/walk-safe")}
          />

          <SafetyToolCard
            title="Risk Map"
            description="View unsafe areas based on student reports and danger patterns."
            badge="AI"
            variant="info"
            icon={<Map size={23} color={COLORS.info} />}
            onPress={() => router.push("/(tabs)/risk-map")}
          />

          <SafetyToolCard
            title="Report Incident"
            description="Report robbery, phone snatching, harassment, or suspicious activity."
            variant="danger"
            icon={<TriangleAlert size={23} color={COLORS.danger} />}
            onPress={() => router.push("/(tabs)/report")}
          />

          <SafetyToolCard
            title="Emergency Contacts"
            description="Manage the people who receive your emergency and live-share alerts."
            variant="warning"
            icon={<ContactRound size={23} color={COLORS.warning} />}
            onPress={() => router.push("/contacts")}
          />
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningIconBox}>
            <TriangleAlert size={22} color={COLORS.warningDark} />
          </View>

          <View style={styles.warningTextBox}>
            <Text style={styles.warningTitle}>Tonight’s safety reminder</Text>
            <Text style={styles.warningText}>
              Avoid quiet routes when walking alone. Start Walk Safe mode before
              leaving campus or your hostel.
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
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.lg,
  },

  greenHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 72,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
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

  logo: {
    width: 190,
    height: 54,
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

  statusRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  statusPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusText: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  statusPillWhite: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusTextGreen: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  searchCard: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: -34,
    minHeight: 74,
    backgroundColor: COLORS.surface,
    borderRadius: 34,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  searchText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.mutedText,
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

  quickActionsCard: {
    marginTop: 52,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  quickAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionText: {
    fontSize: 11,
    fontWeight: "900",
  },

  quickDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  emergencyPostCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  postAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },

  postHeaderText: {
    flex: 1,
  },

  postName: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  postMeta: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.mutedText,
  },

  liveBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
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
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
  },

  postText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 22,
    fontWeight: "700",
  },

  sosDisplayCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: 30,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sosTopLabel: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sosTopLabelText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  sosCircleOuter: {
    marginTop: SPACING.xl,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "rgba(220, 38, 38, 0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.10)",
  },

  sosCircleMiddle: {
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: "rgba(220, 38, 38, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.18)",
  },

  sosCircleButton: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },

  sosCircleButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },

  sosCircleText: {
    marginTop: SPACING.xs,
    color: COLORS.white,
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sosCircleSubText: {
    marginTop: 2,
    color: "rgba(255,255,255,0.82)",
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
  },

  sosInfoStrip: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },

  sosHint: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.dangerDark,
    fontWeight: "800",
    lineHeight: 18,
  },

  quickStatusRow: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  quickStatusCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  quickStatusIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },

  quickStatusIconWarning: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.warningLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },

  quickStatusValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  quickStatusLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
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

  toolsList: {
    marginHorizontal: SPACING.lg,
    gap: SPACING.md,
  },

  toolCard: {
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

  toolIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  toolContent: {
    flex: 1,
  },

  toolTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  toolTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  toolBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  toolBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  toolDescription: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  toolArrow: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  warningCard: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "#FDE68A",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },

  warningIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  warningTextBox: {
    flex: 1,
  },

  warningTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.warningDark,
  },

  warningText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.warningDark,
    fontWeight: "700",
    lineHeight: 20,
  },
});