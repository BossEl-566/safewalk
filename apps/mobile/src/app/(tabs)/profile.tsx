import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BellRing,
  ChevronRight,
  ContactRound,
  History,
  RadioTower,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";

type ProfileMenuCardProps = {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "danger" | "warning" | "info";
};

function getVariantColors(variant: ProfileMenuCardProps["variant"]) {
  if (variant === "danger") {
    return {
      color: COLORS.danger,
      lightColor: COLORS.dangerLight,
    };
  }

  if (variant === "warning") {
    return {
      color: COLORS.warning,
      lightColor: COLORS.warningLight,
    };
  }

  if (variant === "info") {
    return {
      color: COLORS.info,
      lightColor: COLORS.infoLight,
    };
  }

  return {
    color: COLORS.primary,
    lightColor: COLORS.primaryLight,
  };
}

function ProfileMenuCard({
  title,
  description,
  badge,
  icon,
  onPress,
  variant = "primary",
}: ProfileMenuCardProps) {
  const { color, lightColor } = getVariantColors(variant);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuCard,
        pressed && styles.menuCardPressed,
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: lightColor }]}>
        {icon}
      </View>

      <View style={styles.menuContent}>
        <View style={styles.menuTitleRow}>
          <Text style={styles.menuTitle}>{title}</Text>

          {badge ? (
            <View style={[styles.badge, { backgroundColor: lightColor }]}>
              <Text style={[styles.badgeText, { color }]}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.menuText}>{description}</Text>
      </View>

      <View style={styles.arrowBox}>
        <ChevronRight size={18} color={COLORS.mutedText} />
      </View>
    </Pressable>
  );
}

function StatusCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statusCard}>
      <View style={styles.statusIcon}>{icon}</View>
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusLabel}>{title}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.profileAvatarOuter}>
            <View style={styles.profileAvatar}>
              <UserRound size={42} color={COLORS.primary} />
            </View>
          </View>

          <View style={styles.protectedPill}>
            <ShieldCheck size={15} color={COLORS.primaryDark} />
            <Text style={styles.protectedText}>Protected</Text>
          </View>
        </View>

        <Text style={styles.title}>Safety Profile</Text>

        <Text style={styles.subtitle}>
          Manage your trusted contacts, live monitoring tools, safety
          preferences, and demo admin controls.
        </Text>

        <View style={styles.heroDivider} />

        <View style={styles.heroInfoRow}>
          <View style={styles.heroInfoItem}>
            <ContactRound size={18} color={COLORS.primary} />
            <Text style={styles.heroInfoText}>Contacts</Text>
          </View>

          <View style={styles.heroInfoItem}>
            <BellRing size={18} color={COLORS.warning} />
            <Text style={styles.heroInfoText}>Alerts</Text>
          </View>

          <View style={styles.heroInfoItem}>
            <RadioTower size={18} color={COLORS.info} />
            <Text style={styles.heroInfoText}>Monitoring</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusRow}>
        <StatusCard
          title="Demo access"
          value="Open"
          icon={<ShieldCheck size={20} color={COLORS.primary} />}
        />

        <StatusCard
          title="Monitoring"
          value="Live"
          icon={<RadioTower size={20} color={COLORS.info} />}
        />
      </View>

      <View style={styles.sectionHeaderBox}>
        <Text style={styles.sectionTitle}>Profile tools</Text>
        <Text style={styles.sectionSubtitle}>
          Open and manage your SafeWalk AI safety controls.
        </Text>
      </View>

      <View style={styles.menuSection}>
        <ProfileMenuCard
          title="Emergency Contacts"
          description="Manage people who receive SOS and Walk Safe alerts."
          badge="Safety"
          variant="primary"
          icon={<ContactRound size={25} color={COLORS.primary} />}
          onPress={() => router.push("/contacts")}
        />

        <ProfileMenuCard
          title="Monitor Friend"
          description="Use a live share token to monitor a friend’s Walk Home movement."
          badge="Live"
          variant="info"
          icon={<Share2 size={25} color={COLORS.info} />}
          onPress={() => router.push("/live-share")}
        />

        <ProfileMenuCard
          title="Activity History"
          description="View past SOS alerts, Walk Safe sessions, and incident reports."
          variant="warning"
          icon={<History size={25} color={COLORS.warning} />}
          onPress={() => router.push("/activity")}
        />

        <ProfileMenuCard
          title="Safety Settings"
          description="Configure emergency numbers, Walk Safe defaults, and privacy options."
          variant="primary"
          icon={<Settings size={25} color={COLORS.primary} />}
          onPress={() => router.push("/settings")}
        />

        <ProfileMenuCard
          title="Admin Dashboard"
          description="View active SOS alerts, high-risk reports, and monitoring activity."
          badge="Demo"
          variant="danger"
          icon={<ShieldAlert size={25} color={COLORS.danger} />}
          onPress={() => router.push("/admin")}
        />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          <ShieldCheck size={22} color={COLORS.primary} />
        </View>

        <View style={styles.infoTextBox}>
          <Text style={styles.infoTitle}>Demo security note</Text>
          <Text style={styles.infoText}>
            Admin access is open for the project demo. Later, protect this area
            with secure login and role-based permissions.
          </Text>
        </View>
      </View>

      <View style={{ height: insets.bottom + 130 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 34,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },

  profileAvatarOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.12)",
  },

  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  protectedPill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  protectedText: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
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
    lineHeight: 21,
    fontWeight: "700",
  },

  heroDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },

  heroInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  heroInfoItem: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  heroInfoText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: "900",
  },

  statusRow: {
    marginTop: SPACING.lg,
    flexDirection: "row",
    gap: SPACING.md,
  },

  statusCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },

  statusValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  statusLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  sectionHeaderBox: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 20,
  },

  menuSection: {
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

  menuCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  menuContent: {
    flex: 1,
  },

  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  menuTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  menuText: {
    marginTop: 4,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    lineHeight: 18,
    fontWeight: "700",
  },

  arrowBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  infoTextBox: {
    flex: 1,
  },

  infoTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  infoText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 20,
  },
});