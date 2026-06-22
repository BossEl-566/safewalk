import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  BellRing,
  ChevronLeft,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Timer,
  UserX,
  Vibrate,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { SectionHeader } from "../../components/SectionHeader";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { useSafetySettingsStore } from "../../store/safetySettingsStore";

const durationOptions = [10, 15, 20, 30, 45, 60];
const radiusOptions = [300, 500, 800, 1000, 1500];

function ToggleRow({
  title,
  description,
  value,
  onPress,
  icon,
}: {
  title: string;
  description: string;
  value: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={styles.toggleCard}>
      <View style={styles.toggleIcon}>{icon}</View>

      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>

      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const defaultWalkDurationMinutes = useSafetySettingsStore(
    (state) => state.defaultWalkDurationMinutes
  );
  const riskWarningRadiusMeters = useSafetySettingsStore(
    (state) => state.riskWarningRadiusMeters
  );
  const anonymousReportingDefault = useSafetySettingsStore(
    (state) => state.anonymousReportingDefault
  );
  const autoShareSOSMessage = useSafetySettingsStore(
    (state) => state.autoShareSOSMessage
  );
  const vibrationEnabled = useSafetySettingsStore(
    (state) => state.vibrationEnabled
  );
  const ambulanceNumber = useSafetySettingsStore(
    (state) => state.ambulanceNumber
  );
  const policeNumber = useSafetySettingsStore((state) => state.policeNumber);

  const setDefaultWalkDurationMinutes = useSafetySettingsStore(
    (state) => state.setDefaultWalkDurationMinutes
  );
  const setRiskWarningRadiusMeters = useSafetySettingsStore(
    (state) => state.setRiskWarningRadiusMeters
  );
  const setAnonymousReportingDefault = useSafetySettingsStore(
    (state) => state.setAnonymousReportingDefault
  );
  const setAutoShareSOSMessage = useSafetySettingsStore(
    (state) => state.setAutoShareSOSMessage
  );
  const setVibrationEnabled = useSafetySettingsStore(
    (state) => state.setVibrationEnabled
  );
  const setAmbulanceNumber = useSafetySettingsStore(
    (state) => state.setAmbulanceNumber
  );
  const setPoliceNumber = useSafetySettingsStore(
    (state) => state.setPoliceNumber
  );
  const resetSettings = useSafetySettingsStore((state) => state.resetSettings);

  const handleReset = () => {
    Alert.alert(
      "Reset Settings",
      "Restore all safety preferences to their default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: resetSettings,
        },
      ]
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Safety Settings</Text>
          <Text style={styles.headerSubtitle}>
            Control your SafeWalk AI preferences
          </Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <ShieldCheck size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Personal Safety Preferences</Text>
        <Text style={styles.heroText}>
          Configure how SafeWalk AI handles Walk Safe, SOS, risk warnings, and
          anonymous reports.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Walk Safe Defaults"
          subtitle="Choose the default duration and nearby risk detection range."
        />

        <Text style={styles.optionLabel}>Default walking duration</Text>

        <View style={styles.chipRow}>
          {durationOptions.map((minutes) => {
            const selected = minutes === defaultWalkDurationMinutes;

            return (
              <Pressable
                key={minutes}
                onPress={() => setDefaultWalkDurationMinutes(minutes)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Timer
                  size={15}
                  color={selected ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {minutes} min
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.optionLabel, styles.optionLabelSpacing]}>
          Risk warning radius
        </Text>

        <View style={styles.chipRow}>
          {radiusOptions.map((meters) => {
            const selected = meters === riskWarningRadiusMeters;

            return (
              <Pressable
                key={meters}
                onPress={() => setRiskWarningRadiusMeters(meters)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <MapPin
                  size={15}
                  color={selected ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {meters}m
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Privacy and Alerts"
          subtitle="Set how the app behaves during reporting and emergencies."
        />

        <ToggleRow
          title="Anonymous reports by default"
          description="New incident reports will be anonymous unless changed."
          value={anonymousReportingDefault}
          onPress={() =>
            setAnonymousReportingDefault(!anonymousReportingDefault)
          }
          icon={<UserX size={23} color={COLORS.primary} />}
        />

        <ToggleRow
          title="Auto-share SOS message"
          description="Prepare emergency message for quick sharing."
          value={autoShareSOSMessage}
          onPress={() => setAutoShareSOSMessage(!autoShareSOSMessage)}
          icon={<BellRing size={23} color={COLORS.primary} />}
        />

        <ToggleRow
          title="Vibration feedback"
          description="Use haptic feedback for important emergency actions."
          value={vibrationEnabled}
          onPress={() => setVibrationEnabled(!vibrationEnabled)}
          icon={<Vibrate size={23} color={COLORS.primary} />}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Emergency Numbers"
          subtitle="These numbers are used by SOS quick-call buttons."
        />

        <AppInput
          label="Ambulance / Emergency Number"
          value={ambulanceNumber}
          onChangeText={setAmbulanceNumber}
          keyboardType="phone-pad"
          placeholder="112"
        />

        <AppInput
          label="Police Number"
          value={policeNumber}
          onChangeText={setPoliceNumber}
          keyboardType="phone-pad"
          placeholder="191"
        />
      </View>

      <View style={styles.infoCard}>
        <Smartphone size={22} color={COLORS.info} />
        <Text style={styles.infoText}>
          These settings are saved locally on this phone. Later, we can sync
          them to the user profile in MongoDB.
        </Text>
      </View>

      <AppButton
        title="Reset Settings"
        onPress={handleReset}
        variant="ghost"
        icon={<RotateCcw size={20} color={COLORS.primaryDark} />}
        style={styles.resetButton}
      />
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

  heroTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  heroText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  section: {
    marginTop: SPACING.xl,
  },

  optionLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  optionLabelSpacing: {
    marginTop: SPACING.lg,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.primary,
  },

  chipTextSelected: {
    color: COLORS.white,
  },

  toggleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  toggleIcon: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  toggleContent: {
    flex: 1,
  },

  toggleTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  toggleDescription: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  toggle: {
    width: 54,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    padding: 3,
  },

  toggleActive: {
    backgroundColor: COLORS.primary,
  },

  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
  },

  toggleKnobActive: {
    alignSelf: "flex-end",
  },

  infoCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    fontWeight: "700",
    lineHeight: 20,
  },

  resetButton: {
    marginTop: SPACING.xl,
  },
});