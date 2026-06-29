import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, Map } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import { Screen } from "../components/Screen";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../constants/theme";

export default function MapTestPlaceholderScreen() {
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View>
          <Text style={styles.title}>Expo Map Test</Text>
          <Text style={styles.subtitle}>Development build required</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Map size={42} color={COLORS.primary} />
        </View>

        <Text style={styles.cardTitle}>Expo Maps is not active yet</Text>

        <Text style={styles.cardText}>
          This screen is ready, but the real Expo Maps screen needs a development
          build. Expo Go cannot load the native ExpoMaps module.
        </Text>

        <Text style={styles.command}>
          eas build --profile development --platform android
        </Text>

        <AppButton
          title="Go Back"
          onPress={() => router.back()}
          style={styles.button}
        />
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

  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.mutedText,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  iconBox: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  cardTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  cardText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
  },

  command: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    textAlign: "center",
  },

  button: {
    marginTop: SPACING.xl,
    width: "100%",
  },
});