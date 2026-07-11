import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, Clock, Footprints, ShieldCheck, X } from "lucide-react-native";

import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../constants/theme";

type SafetyCheckInModalProps = {
  visible: boolean;
  distanceCoveredText: string;
  etaText: string;
  countdownSeconds: number;
  riskLevel?: string;
  onCheckIn: () => void;
  onSendSOS: () => void;
  onClose?: () => void;
};

function getRiskColor(riskLevel?: string) {
  if (riskLevel === "critical" || riskLevel === "high") return COLORS.danger;
  if (riskLevel === "medium") return COLORS.warning;
  return COLORS.primary;
}

export function SafetyCheckInModal({
  visible,
  distanceCoveredText,
  etaText,
  countdownSeconds,
  riskLevel = "low",
  onCheckIn,
  onSendSOS,
  onClose,
}: SafetyCheckInModalProps) {
  const riskColor = getRiskColor(riskLevel);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Safety Check-In</Text>
              <Text style={styles.subtitle}>
                Confirm you are safe to continue your trip
              </Text>
            </View>

            {onClose ? (
              <Pressable onPress={onClose} style={styles.closeButton}>
                <X size={20} color={COLORS.mutedText} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: riskColor }]} />
              <Text style={styles.statusText}>
                {riskLevel.toUpperCase()} RISK
              </Text>
            </View>

            <View style={styles.mainTimeRow}>
              <View style={styles.timeIconBox}>
                <Clock size={26} color={COLORS.primary} />
              </View>

              <View>
                <Text style={styles.mainTime}>{etaText}</Text>
                <Text style={styles.mainTimeLabel}>Expected time remaining</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Footprints size={18} color={COLORS.primary} />
                <Text style={styles.metricValue}>{distanceCoveredText}</Text>
                <Text style={styles.metricLabel}>Distance covered</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <AlertTriangle size={18} color={riskColor} />
                <Text style={[styles.metricValue, { color: riskColor }]}>
                  {countdownSeconds}s
                </Text>
                <Text style={styles.metricLabel}>Before SOS</Text>
              </View>
            </View>
          </View>

          <View style={styles.circleOuter}>
            <View style={styles.circleMiddle}>
              <Pressable onPress={onCheckIn} style={styles.checkButton}>
                <ShieldCheck size={26} color={COLORS.white} />
                <Text style={styles.checkButtonText}>Check In</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.warningText}>
            If you do not check in before the countdown ends, SafeWalk AI will
            automatically escalate this trip to SOS.
          </Text>

          <Pressable onPress={onSendSOS} style={styles.sosButton}>
            <Text style={styles.sosButtonText}>Send SOS Now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    justifyContent: "center",
    padding: SPACING.lg,
  },

  card: {
    backgroundColor: COLORS.background,
    borderRadius: 32,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },

  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.mutedText,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  statsCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 24,
    padding: SPACING.lg,
    overflow: "hidden",
  },

  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
  },

  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.mutedText,
  },

  mainTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  timeIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  mainTime: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.white,
  },

  mainTimeLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.72)",
  },

  metricsRow: {
    marginTop: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
  },

  metricBox: {
    flex: 1,
  },

  metricDivider: {
    width: 1,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: SPACING.md,
  },

  metricValue: {
    marginTop: 4,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.white,
  },

  metricLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
  },

  circleOuter: {
    marginTop: SPACING.xxl,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.10)",
  },

  circleMiddle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(5, 150, 105, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  checkButton: {
    width: 135,
    height: 135,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },

  checkButtonText: {
    marginTop: SPACING.xs,
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
  },

  warningText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  sosButton: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },

  sosButtonText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
});