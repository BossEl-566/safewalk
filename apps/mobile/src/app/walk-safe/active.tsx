import { Alert, Linking, Share, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Share2,
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
import { useWalkSafeStore } from "../../store/walkSafeStore";
import { useSOSStore } from "../../store/sosStore";
import { createSOSAlertApi } from "../../lib/sosApi";
import {
  cancelWalkSafeSessionApi,
  checkInWalkSafeSessionApi,
  completeWalkSafeSessionApi,
} from "../../lib/walkSafeApi";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActiveWalkSafeScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const session = useWalkSafeStore((state) =>
    sessionId ? state.getSessionById(sessionId) : undefined
  );

  const checkInSafe = useWalkSafeStore((state) => state.checkInSafe);
  const completeSession = useWalkSafeStore((state) => state.completeSession);
  const cancelSession = useWalkSafeStore((state) => state.cancelSession);
  const createSOSAlert = useSOSStore((state) => state.createSOSAlert);

  if (!session) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>No active walk found</Text>
          <Text style={styles.subtitle}>
            This Walk Safe session may have already ended.
          </Text>

          <AppButton
            title="Go Home"
            onPress={() => router.replace("/(tabs)/home")}
            style={styles.fullButton}
          />
        </View>
      </Screen>
    );
  }

  const nearbyRiskWarnings = session.nearbyRiskWarnings ?? [];

  const handleCheckIn = async () => {
  checkInSafe(session.id);

  if (session.backendId) {
    checkInWalkSafeSessionApi(session.backendId).catch((error) => {
      console.log("Backend check-in sync failed:", error);
    });
  }

  Alert.alert("Check-in Saved", "Your Walk Safe session has been updated.");
};

  const handleShareWalk = async () => {
    const mapLink = session.startLocation
      ? `https://www.google.com/maps?q=${session.startLocation.latitude},${session.startLocation.longitude}`
      : "Location unavailable";

    await Share.share({
      message: `SafeWalk AI Walk Safe session started.

Destination: ${session.destinationName}
Trusted contact: ${session.trustedContactName}
Expected arrival: ${formatTime(session.expectedArrivalAt)}
Current/starting location: ${mapLink}

Please check on me if I do not arrive on time.`,
    });
  };

  const handleCallContact = () => {
    Linking.openURL(`tel:${session.trustedContactPhone}`);
  };

  const handleTriggerSOS = () => {
    Alert.alert(
      "Trigger SOS",
      "This will create an emergency SOS alert using this Walk Safe location.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trigger SOS",
          style: "destructive",
          onPress: () => {
            const alertId = createSOSAlert({
  userName: "SafeWalk User",
  location: session.startLocation,
});

const alert = useSOSStore.getState().getAlertById(alertId);

if (alert) {
  createSOSAlertApi({
    userName: alert.userName,
    location: alert.location,
    message: alert.message,
    source: "walk_safe",
    trustedContactName: session.trustedContactName,
    trustedContactPhone: session.trustedContactPhone,
  }).catch((error) => {
    console.log("Walk Safe SOS backend sync failed:", error);
  });
}

router.push({
  pathname: "/sos/active",
  params: { alertId },
});
          },
        },
      ]
    );
  };

  const handleArrivedSafely = () => {
    Alert.alert(
      "Arrived Safely",
      "Mark this Walk Safe session as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, I arrived",
          onPress: () => {
            completeSession(session.id);

if (session.backendId) {
  completeWalkSafeSessionApi(session.backendId).catch((error) => {
    console.log("Backend complete sync failed:", error);
  });
}

router.replace("/(tabs)/home");
          },
        },
      ]
    );
  };

  const handleCancelWalk = () => {
    Alert.alert(
      "Cancel Walk Safe",
      "Only cancel this if you no longer need monitoring.",
      [
        { text: "Keep Active", style: "cancel" },
        {
          text: "Cancel Session",
          style: "destructive",
          onPress: () => {
            cancelSession(session.id);

if (session.backendId) {
  cancelWalkSafeSessionApi(session.backendId).catch((error) => {
    console.log("Backend cancel sync failed:", error);
  });
}

router.replace("/(tabs)/home");
          },
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <ShieldCheck size={38} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Walk Safe Active</Text>
        <Text style={styles.subtitle}>
          Your walk to {session.destinationName} is being monitored.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>
            <MapPin size={22} color={COLORS.primary} />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Destination</Text>
            <Text style={styles.statusValue}>{session.destinationName}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>
            <Clock size={22} color={COLORS.primary} />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Expected arrival</Text>
            <Text style={styles.statusValue}>
              {formatTime(session.expectedArrivalAt)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>
            <Phone size={22} color={COLORS.primary} />
          </View>

          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Trusted contact</Text>
            <Text style={styles.statusValue}>
              {session.trustedContactName}
            </Text>
            <Text style={styles.statusSubValue}>
              {session.trustedContactPhone}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.riskCard}>
        <View style={styles.riskHeader}>
          <AlertTriangle
            size={22}
            color={
  session.riskLevel === "critical" || session.riskLevel === "high"
    ? COLORS.danger
    : session.riskLevel === "medium"
      ? COLORS.warning
      : COLORS.primary
}
          />
          <Text style={styles.riskTitle}>
            Current risk level: {session.riskLevel.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.riskText}>
          This MVP estimates risk based on walk duration. Later, this will use
          incident reports, route history, time of day, and AI risk scoring.
        </Text>
      </View>

      {nearbyRiskWarnings.length > 0 ? (
  <View style={styles.nearbyRiskSection}>
    <Text style={styles.nearbyRiskSectionTitle}>
      Nearby Risk Warnings
    </Text>

    <Text style={styles.nearbyRiskSectionText}>
      SafeWalk AI found recent incident reports close to your starting area.
    </Text>

    {nearbyRiskWarnings.slice(0, 3).map((warning) => (
      <View key={warning.reportId} style={styles.nearbyRiskCard}>
        <View style={styles.nearbyRiskHeader}>
          <AlertTriangle
            size={20}
            color={
              warning.riskLevel === "critical" ||
              warning.riskLevel === "high"
                ? COLORS.danger
                : warning.riskLevel === "medium"
                  ? COLORS.warning
                  : COLORS.primary
            }
          />

          <Text style={styles.nearbyRiskTitle}>{warning.title}</Text>
        </View>

        <Text style={styles.nearbyRiskMeta}>
          {warning.locationName} • {warning.distanceMeters}m away • Score{" "}
          {warning.aiRiskScore}
        </Text>

        <Text style={styles.nearbyRiskDescription}>
          {warning.description}
        </Text>
      </View>
    ))}
  </View>
) : null}

      <View style={styles.actions}>
        <AppButton
          title="I'm Safe - Check In"
          onPress={handleCheckIn}
          variant="primary"
          icon={<CheckCircle2 size={20} color={COLORS.white} />}
        />

        <AppButton
          title="Share Walk Details"
          onPress={handleShareWalk}
          variant="secondary"
          icon={<Share2 size={20} color={COLORS.primaryDark} />}
        />

        <AppButton
          title="Call Trusted Contact"
          onPress={handleCallContact}
          variant="secondary"
          icon={<Phone size={20} color={COLORS.primaryDark} />}
        />

        <AppButton
          title="Trigger SOS"
          onPress={handleTriggerSOS}
          variant="danger"
          icon={<AlertTriangle size={20} color={COLORS.white} />}
        />
      </View>

      <View style={styles.safeActions}>
        <AppButton
          title="I Arrived Safely"
          onPress={handleArrivedSafely}
          variant="primary"
          icon={<CheckCircle2 size={20} color={COLORS.white} />}
        />

        <AppButton
          title="Cancel Walk Safe"
          onPress={handleCancelWalk}
          variant="ghost"
          icon={<XCircle size={20} color={COLORS.primaryDark} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
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
    width: 82,
    height: 82,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  fullButton: {
    marginTop: SPACING.xl,
    width: "100%",
  },

  statusCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  statusContent: {
    flex: 1,
  },

  statusLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  statusValue: {
    marginTop: 2,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "900",
  },

  statusSubValue: {
    marginTop: 2,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },

  riskCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  riskTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.warningDark,
  },

  riskText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.warningDark,
    lineHeight: 20,
    fontWeight: "600",
  },

  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },

  safeActions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  nearbyRiskSection: {
  marginTop: SPACING.lg,
  backgroundColor: COLORS.dangerLight,
  borderRadius: RADIUS.xl,
  padding: SPACING.lg,
  borderWidth: 1,
  borderColor: "#FECACA",
},

nearbyRiskSectionTitle: {
  fontSize: FONT_SIZE.md,
  fontWeight: "900",
  color: COLORS.dangerDark,
},

nearbyRiskSectionText: {
  marginTop: SPACING.xs,
  fontSize: FONT_SIZE.sm,
  color: COLORS.dangerDark,
  lineHeight: 20,
  fontWeight: "600",
},

nearbyRiskCard: {
  marginTop: SPACING.md,
  backgroundColor: COLORS.surface,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  borderWidth: 1,
  borderColor: "#FECACA",
},

nearbyRiskHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.sm,
},

nearbyRiskTitle: {
  flex: 1,
  fontSize: FONT_SIZE.sm,
  fontWeight: "900",
  color: COLORS.text,
},

nearbyRiskMeta: {
  marginTop: SPACING.xs,
  fontSize: FONT_SIZE.xs,
  color: COLORS.danger,
  fontWeight: "900",
},

nearbyRiskDescription: {
  marginTop: SPACING.xs,
  fontSize: FONT_SIZE.xs,
  color: COLORS.text,
  fontWeight: "600",
  lineHeight: 18,
},
});