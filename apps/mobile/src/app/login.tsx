import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../constants/theme";

type DemoRole = "student" | "authority";

const DEMO_USERS = {
  student: {
    email: "student@ug.edu.gh",
    password: "student123",
    name: "UG Student",
    role: "student" as DemoRole,
  },
  authority: {
    email: "authority@ug.edu.gh",
    password: "admin123",
    name: "Authority Officer",
    role: "authority" as DemoRole,
  },
};

export default function LoginScreen() {
  const [selectedRole, setSelectedRole] = useState<DemoRole>("student");
  const [email, setEmail] = useState(DEMO_USERS.student.email);
  const [password, setPassword] = useState(DEMO_USERS.student.password);
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (role: DemoRole) => {
    setSelectedRole(role);
    setEmail(DEMO_USERS[role].email);
    setPassword(DEMO_USERS[role].password);
  };

  const handleLogin = async () => {
    const user = DEMO_USERS[selectedRole];

    if (
      email.trim().toLowerCase() !== user.email ||
      password.trim() !== user.password
    ) {
      Alert.alert(
        "Invalid Login",
        "Use the demo credentials shown on the selected role."
      );
      return;
    }

    try {
      setLoading(true);

      await AsyncStorage.setItem(
        "safecampus-demo-user",
        JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          loggedInAt: new Date().toISOString(),
        })
      );

      if (user.role === "authority") {
        router.replace("/admin");
        return;
      }

      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Login Error", "Could not start demo session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.backgroundCircleOne} />
      <View style={styles.backgroundCircleTwo} />

      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <ShieldCheck size={38} color={COLORS.white} />
        </View>

        <Text style={styles.appName}>SafeCampus AI</Text>
        <Text style={styles.appSubtitle}>
          Campus issue reporting, task assignment, and resolution tracking.
        </Text>
      </View>

      <View style={styles.loginCard}>
        <Text style={styles.cardOverline}>DEMO LOGIN</Text>
        <Text style={styles.cardTitle}>Welcome back</Text>
        <Text style={styles.cardSubtitle}>
          Select a role to demonstrate how students and authorities use the
          system.
        </Text>

        <View style={styles.roleRow}>
          <Pressable
            onPress={() => handleSelectRole("student")}
            style={[
              styles.roleCard,
              selectedRole === "student" && styles.roleCardSelected,
            ]}
          >
            <View
              style={[
                styles.roleIcon,
                selectedRole === "student" && styles.roleIconSelected,
              ]}
            >
              <GraduationCap
                size={23}
                color={
                  selectedRole === "student" ? COLORS.white : COLORS.primary
                }
              />
            </View>

            <Text
              style={[
                styles.roleTitle,
                selectedRole === "student" && styles.roleTextSelected,
              ]}
            >
              Student
            </Text>

            <Text
              style={[
                styles.roleText,
                selectedRole === "student" && styles.roleTextSelected,
              ]}
            >
              Report and track issues
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelectRole("authority")}
            style={[
              styles.roleCard,
              selectedRole === "authority" && styles.roleCardSelected,
            ]}
          >
            <View
              style={[
                styles.roleIcon,
                selectedRole === "authority" && styles.roleIconSelected,
              ]}
            >
              <Building2
                size={23}
                color={
                  selectedRole === "authority" ? COLORS.white : COLORS.primary
                }
              />
            </View>

            <Text
              style={[
                styles.roleTitle,
                selectedRole === "authority" && styles.roleTextSelected,
              ]}
            >
              Authority
            </Text>

            <Text
              style={[
                styles.roleText,
                selectedRole === "authority" && styles.roleTextSelected,
              ]}
            >
              Assign and resolve
            </Text>
          </Pressable>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email address</Text>

          <View style={styles.inputBox}>
            <Mail size={19} color={COLORS.mutedText} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={COLORS.softText}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password</Text>

          <View style={styles.inputBox}>
            <LockKeyhole size={19} color={COLORS.mutedText} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={COLORS.softText}
              secureTextEntry
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.demoCredentialBox}>
          <UserRound size={18} color={COLORS.primary} />

          <View style={styles.demoCredentialTextBox}>
            <Text style={styles.demoCredentialTitle}>
              {selectedRole === "student"
                ? "Student demo credentials"
                : "Authority demo credentials"}
            </Text>

            <Text style={styles.demoCredentialText}>
              {DEMO_USERS[selectedRole].email} /{" "}
              {DEMO_USERS[selectedRole].password}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Signing in..." : "Continue to Demo"}
          </Text>
          <ArrowRight size={19} color={COLORS.white} />
        </Pressable>
      </View>

      <Text style={styles.footerText}>
        Prototype login for project defence demonstration only.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: SPACING.lg,
    paddingTop: 70,
    paddingBottom: SPACING.xl,
    justifyContent: "center",
  },

  backgroundCircleOne: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(5, 150, 105, 0.13)",
  },

  backgroundCircleTwo: {
    position: "absolute",
    bottom: -150,
    left: -110,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(5, 150, 105, 0.10)",
  },

  logoWrap: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 7,
  },

  appName: {
    marginTop: SPACING.lg,
    fontSize: 31,
    color: COLORS.text,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  appSubtitle: {
    marginTop: SPACING.sm,
    maxWidth: 330,
    textAlign: "center",
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    lineHeight: 21,
    fontWeight: "700",
  },

  loginCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },

  cardOverline: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "900",
    letterSpacing: 1,
  },

  cardTitle: {
    marginTop: SPACING.xs,
    fontSize: 27,
    color: COLORS.text,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  cardSubtitle: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    lineHeight: 20,
    fontWeight: "700",
  },

  roleRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  roleCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 22,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  roleCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },

  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },

  roleIconSelected: {
    backgroundColor: COLORS.primary,
  },

  roleTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: "900",
  },

  roleText: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 17,
  },

  roleTextSelected: {
    color: COLORS.primaryDark,
  },

  inputGroup: {
    marginTop: SPACING.lg,
  },

  inputLabel: {
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  inputBox: {
    minHeight: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: "800",
  },

  demoCredentialBox: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.16)",
  },

  demoCredentialTextBox: {
    flex: 1,
  },

  demoCredentialTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  demoCredentialText: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 17,
  },

  loginButton: {
    marginTop: SPACING.lg,
    minHeight: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },

  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
  },

  buttonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.93,
  },

  footerText: {
    marginTop: SPACING.lg,
    textAlign: "center",
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },
});