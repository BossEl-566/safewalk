import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  ContactRound,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  History,
  Settings,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";

export default function ProfileScreen() {
  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <UserRound size={38} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Safety Profile</Text>
        <Text style={styles.subtitle}>
          Manage emergency contacts, safety preferences, and admin monitoring
          tools for the SafeWalk AI demo.
        </Text>
      </View>

      <View style={styles.menuSection}>
        <View style={styles.menuCard}>
          <View style={styles.menuIcon}>
            <ContactRound size={26} color={COLORS.primary} />
          </View>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Emergency Contacts</Text>
            <Text style={styles.menuText}>
              Manage people who receive SOS and Walk Safe alerts.
            </Text>
          </View>

          <AppButton
            title="Open"
            onPress={() => router.push("/contacts")}
            variant="secondary"
            style={styles.menuButton}
          />
        </View>

       <View style={styles.menuCard}>
  <View style={styles.menuIcon}>
    <History size={26} color={COLORS.primary} />
  </View>

  <View style={styles.menuContent}>
    <Text style={styles.menuTitle}>Activity History</Text>
    <Text style={styles.menuText}>
      View past SOS alerts, Walk Safe sessions, and incident reports.
    </Text>
  </View>

  <AppButton
    title="Open"
    onPress={() => router.push("/activity")}
    variant="secondary"
    style={styles.menuButton}
  />
</View> 

<View style={styles.menuCard}>
  <View style={styles.menuIcon}>
    <Settings size={26} color={COLORS.primary} />
  </View>

  <View style={styles.menuContent}>
    <Text style={styles.menuTitle}>Safety Settings</Text>
    <Text style={styles.menuText}>
      Configure emergency numbers, Walk Safe defaults, and privacy options.
    </Text>
  </View>

  <AppButton
    title="Open"
    onPress={() => router.push("/settings")}
    variant="secondary"
    style={styles.menuButton}
  />
</View>

        <View style={styles.menuCard}>
          <View style={[styles.menuIcon, styles.adminIcon]}>
            <ShieldAlert size={26} color={COLORS.danger} />
          </View>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Admin Dashboard</Text>
            <Text style={styles.menuText}>
              View active SOS alerts and high-risk incident reports.
            </Text>
          </View>

          <AppButton
            title="Open"
            onPress={() => router.push("/admin")}
            variant="danger"
            style={styles.menuButton}
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <ShieldCheck size={22} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Admin access is open for demo now. Later, protect this screen with
          secure login and role-based permissions.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  menuSection: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },

  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    ...SHADOWS.soft,
  },

  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  adminIcon: {
    backgroundColor: COLORS.dangerLight,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  menuText: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    lineHeight: 18,
    fontWeight: "700",
  },

  menuButton: {
    minHeight: 42,
    paddingHorizontal: SPACING.md,
  },

  infoCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },

  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 20,
  },
});