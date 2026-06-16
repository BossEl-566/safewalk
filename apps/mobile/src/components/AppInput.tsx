import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppInput({ label, error, style, ...props }: AppInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        placeholderTextColor={COLORS.softText}
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        {...props}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },

  label: {
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.text,
  },

  input: {
    minHeight: 54,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },

  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },

  error: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    fontWeight: "700",
  },
});