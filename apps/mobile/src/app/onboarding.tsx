import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  AlertTriangle,
  BellRing,
  ChevronRight,
  Footprints,
  Map,
  ShieldCheck,
} from "lucide-react-native";

import { Screen } from "../components/Screen";
import { AppButton } from "../components/AppButton";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../constants/theme";
import { useOnboardingStore } from "../store/onboardingStore";

const onboardingSlides = [
  {
    title: "Welcome to SafeWalk AI",
    subtitle:
      "An AI-powered campus and off-campus safety assistant for university students.",
    icon: ShieldCheck,
    color: COLORS.primary,
    background: COLORS.primaryLight,
  },
  {
    title: "Get Help Faster",
    subtitle:
      "Trigger SOS alerts, call emergency numbers, and share your location with trusted contacts.",
    icon: BellRing,
    color: COLORS.danger,
    background: COLORS.dangerLight,
  },
  {
    title: "Walk with Monitoring",
    subtitle:
      "Use Walk Safe mode to let the app monitor your journey and warn you about nearby risks.",
    icon: Footprints,
    color: COLORS.primary,
    background: COLORS.primaryLight,
  },
  {
    title: "Report and Avoid Risk",
    subtitle:
      "Submit incident reports, view risk maps, and help other students avoid dangerous areas.",
    icon: Map,
    color: COLORS.warning,
    background: COLORS.warningLight,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding
  );

  const slide = onboardingSlides[currentIndex];
  const Icon = slide.icon;
  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  const handleNext = () => {
    if (!isLastSlide) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    completeOnboarding();
    router.replace("/(tabs)/home");
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace("/(tabs)/home");
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.brandText}>SafeWalk AI</Text>

          {!isLastSlide ? (
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.heroSection}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: slide.background,
              },
            ]}
          >
            <Icon size={64} color={slide.color} strokeWidth={2.2} />
          </View>

          <View style={styles.warningPill}>
            <AlertTriangle size={16} color={COLORS.warningDark} />
            <Text style={styles.warningPillText}>
              Safety support, not a replacement for emergency services
            </Text>
          </View>

          <Text style={styles.title}>{slide.title}</Text>

          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </View>

        <View style={styles.dotsRow}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.bottomSection}>
          <AppButton
            title={isLastSlide ? "Get Started" : "Continue"}
            onPress={handleNext}
            icon={<ChevronRight size={21} color={COLORS.white} />}
          />

          <Text style={styles.footerText}>
            Designed for student safety, incident awareness, and campus security
            monitoring.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.primary,
  },

  skipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.mutedText,
  },

  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },

  iconCircle: {
    width: 154,
    height: 154,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
    ...SHADOWS.soft,
  },

  warningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  warningPillText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warningDark,
    fontWeight: "800",
  },

  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 42,
  },

  subtitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "600",
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },

  activeDot: {
    width: 28,
    backgroundColor: COLORS.primary,
  },

  bottomSection: {
    gap: SPACING.lg,
  },

  footerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.softText,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "700",
  },
});