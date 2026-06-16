import { StyleSheet, Text, View } from "react-native";
import { Screen } from "./Screen";
import { AppButton } from "./AppButton";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";

type FeaturePlaceholderProps = {
  title: string;
  subtitle: string;
  emoji: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
};

export function FeaturePlaceholder({
  title,
  subtitle,
  emoji,
  primaryActionLabel,
  onPrimaryAction,
}: FeaturePlaceholderProps) {
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {primaryActionLabel && onPrimaryAction ? (
          <AppButton
            title={primaryActionLabel}
            onPress={onPrimaryAction}
            style={styles.button}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  iconCircle: {
    width: 108,
    height: 108,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },

  emoji: {
    fontSize: 48,
  },

  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 24,
  },

  button: {
    marginTop: SPACING.xl,
    width: "100%",
  },
});