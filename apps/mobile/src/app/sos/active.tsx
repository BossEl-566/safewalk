import { Alert, Linking, Share, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Phone,
  Share2,
  XCircle,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { COLORS, FONT_SIZE, RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import { useSOSStore } from "../../store/sosStore";

export default function ActiveSOSScreen() {
  const { alertId } = useLocalSearchParams<{ alertId?: string }>();

  const alert = useSOSStore((state) =>
    alertId ? state.getAlertById(alertId) : undefined
  );

  const resolveSOSAlert = useSOSStore((state) => state.resolveSOSAlert);
  const cancelSOSAlert = useSOSStore((state) => state.cancelSOSAlert);

  if (!alert) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>No active SOS found</Text>
          <Text style={styles.subtitle}>
            The SOS alert may have already been closed.
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

  const handleCallAmbulance = () => {
    Linking.openURL("tel:112");
  };

  const handleCallPolice = () => {
    Linking.openURL("tel:191");
  };

  const handleShare = async () => {
    await Share.share({
      message: alert.message,
    });
  };

  const handleOpenMap = () => {
    if (!alert.location) {
      Alert.alert("No Location", "Location was not captured for this alert.");
      return;
    }

    const url = `https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`;
    Linking.openURL(url);
  };

  const handleResolve = () => {
    Alert.alert(
      "Mark as Safe",
      "Are you sure you want to mark this emergency as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, I am safe",
          onPress: () => {
            resolveSOSAlert(alert.id);
            router.replace("/(tabs)/home");
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel SOS",
      "Only cancel this if it was a mistake.",
      [
        { text: "Keep Active", style: "cancel" },
        {
          text: "Cancel SOS",
          style: "destructive",
          onPress: () => {
            cancelSOSAlert(alert.id);
            router.replace("/(tabs)/home");
          },
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <AlertTriangle size={42} color={COLORS.danger} strokeWidth={2.6} />
        </View>

        <Text style={styles.title}>SOS Alert Active</Text>
        <Text style={styles.subtitle}>
          Your emergency alert has been created. Share it or call emergency services now.
        </Text>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.cardLabel}>Emergency Message</Text>
        <Text style={styles.messageText}>{alert.message}</Text>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <MapPin size={24} color={COLORS.primary} />
        </View>

        <View style={styles.locationContent}>
          <Text style={styles.locationTitle}>
            {alert.location ? "Location captured" : "Location unavailable"}
          </Text>

          <Text style={styles.locationText}>
            {alert.location
              ? `${alert.location.latitude.toFixed(5)}, ${alert.location.longitude.toFixed(5)}`
              : "The app could not capture GPS coordinates."}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Call Ambulance 112"
          onPress={handleCallAmbulance}
          variant="danger"
          icon={<Phone size={20} color={COLORS.white} />}
        />

        <AppButton
          title="Call Police 191"
          onPress={handleCallPolice}
          variant="secondary"
          icon={<Phone size={20} color={COLORS.primaryDark} />}
        />

        <AppButton
          title="Share Alert Message"
          onPress={handleShare}
          variant="primary"
          icon={<Share2 size={20} color={COLORS.white} />}
        />

        <AppButton
          title="Open Location on Map"
          onPress={handleOpenMap}
          variant="secondary"
          icon={<MapPin size={20} color={COLORS.primaryDark} />}
        />
      </View>

      <View style={styles.safeActions}>
        <AppButton
          title="I Am Safe"
          onPress={handleResolve}
          variant="primary"
          icon={<CheckCircle2 size={20} color={COLORS.white} />}
        />

        <AppButton
          title="Cancel SOS"
          onPress={handleCancel}
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

  alertHeader: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  alertIcon: {
    width: 92,
    height: 92,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
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

  messageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  cardLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.mutedText,
    textTransform: "uppercase",
    marginBottom: SPACING.sm,
  },

  messageText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 21,
    fontWeight: "600",
  },

  locationCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  locationContent: {
    flex: 1,
  },

  locationTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  locationText: {
    marginTop: 2,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },

  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },

  safeActions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
});