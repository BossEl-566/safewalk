import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ShieldCheck } from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";

export default function LiveShareTokenScreen() {
  const [token, setToken] = useState("");

  const handleOpenMonitor = () => {
    if (!token.trim()) {
      Alert.alert("Missing Token", "Paste the live share token first.");
      return;
    }

    router.push(`/live-share/${token.trim()}`);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Monitor Friend</Text>
          <Text style={styles.headerSubtitle}>
            Paste a SafeWalk live share token
          </Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <ShieldCheck size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Live Safety Monitoring</Text>
        <Text style={styles.heroText}>
          Use the token shared by your friend to view their latest location,
          route status, and safety check-ins in real-time.
        </Text>
      </View>

      <View style={styles.formSection}>
        <AppInput
          label="Live Share Token"
          value={token}
          onChangeText={setToken}
          placeholder="Paste token here"
          autoCapitalize="none"
        />

        <AppButton title="Open Monitor" onPress={handleOpenMonitor} />
      </View>
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
    width: 76,
    height: 76,
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

  formSection: {
    marginTop: SPACING.xl,
    gap: SPACING.lg,
  },
});