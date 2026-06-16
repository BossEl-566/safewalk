import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";

type ButtonVariant = "primary" | "danger" | "secondary" | "ghost";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" || variant === "ghost" ? COLORS.primary : COLORS.white}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              (variant === "secondary" || variant === "ghost") && styles.secondaryText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },

  primary: {
    backgroundColor: COLORS.primary,
  },

  danger: {
    backgroundColor: COLORS.danger,
  },

  secondary: {
    backgroundColor: COLORS.primaryLight,
  },

  ghost: {
    backgroundColor: "transparent",
  },

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  text: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "800",
  },

  secondaryText: {
    color: COLORS.primaryDark,
  },
});