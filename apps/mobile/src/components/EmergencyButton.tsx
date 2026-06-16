import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { COLORS, FONT_SIZE, SHADOWS } from "../constants/theme";

type EmergencyButtonProps = {
  onPress: () => void;
  label?: string;
  sublabel?: string;
  style?: ViewStyle;
};

export function EmergencyButton({
  onPress,
  label = "SOS",
  sublabel = "Tap for emergency alert",
  style,
}: EmergencyButtonProps) {
  const handlePress = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Emergency SOS button"
      style={({ pressed }) => [
        styles.wrapper,
        pressed && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={[COLORS.danger, COLORS.dangerDark]}
        style={styles.button}
      >
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.sublabel}>{sublabel}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "center",
    ...SHADOWS.card,
  },

  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },

  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: FONT_SIZE.huge,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 1,
  },

  sublabel: {
    marginTop: 6,
    fontSize: FONT_SIZE.xs,
    color: COLORS.dangerLight,
    fontWeight: "700",
  },
});