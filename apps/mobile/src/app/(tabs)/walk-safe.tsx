import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Clock,
  MapPin,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { SectionHeader } from "../../components/SectionHeader";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { useContactStore } from "../../store/contactStore";
import { useWalkSafeStore } from "../../store/walkSafeStore";
import { getCurrentLocation } from "../../lib/location";
import { EmergencyContact } from "../../types/contact";
import { getIncidentReportsApi } from "../../lib/incidentApi";
import { useIncidentStore } from "../../store/incidentStore";
import { getNearbyRiskWarnings } from "../../utils/geoRisk";
import {
  WalkSafeLocation,
  WalkSafeNearbyRisk,
} from "../../types/walkSafe";
import { createWalkSafeSessionApi } from "../../lib/walkSafeApi";
import { useSafetySettingsStore } from "../../store/safetySettingsStore";
import { WalkSafeMode } from "../../types/walkSafe";
import { Navigation } from "lucide-react-native";

const durationOptions = [10, 15, 20, 30, 45];

function ContactOption({
  contact,
  selected,
  onPress,
}: {
  contact: EmergencyContact;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.contactOption, selected && styles.contactOptionSelected]}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactMeta}>
          {contact.relationship} • {contact.phone}
        </Text>
      </View>

      {selected ? (
        <UserRoundCheck size={22} color={COLORS.primary} />
      ) : null}
    </Pressable>
  );
}

export default function WalkSafeScreen() {
  const contacts = useContactStore((state) => state.contacts);
  const startSession = useWalkSafeStore((state) => state.startSession);
  const setSessionBackendId = useWalkSafeStore(
  (state) => state.setSessionBackendId
);
  const localReports = useIncidentStore((state) => state.reports);

  const [destinationName, setDestinationName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    contacts[0]?.id ?? null
  );
  const defaultWalkDurationMinutes = useSafetySettingsStore(
  (state) => state.defaultWalkDurationMinutes
);
const riskWarningRadiusMeters = useSafetySettingsStore(
  (state) => state.riskWarningRadiusMeters
);

const [duration, setDuration] = useState(defaultWalkDurationMinutes);
  const [loading, setLoading] = useState(false);

  const selectedContact = contacts.find(
    (contact) => contact.id === selectedContactId
  );

  const [mode, setMode] = useState<WalkSafeMode>("walk_safe");

  const startWalkSafeSession = (
  location: WalkSafeLocation,
  nearbyRiskWarnings: WalkSafeNearbyRisk[]
) => {
  if (!selectedContact) return;

  const sessionId = startSession({
  mode,
  destinationName,
  trustedContactId: selectedContact.id,
  trustedContactName: selectedContact.name,
  trustedContactPhone: selectedContact.phone,
  expectedDurationMinutes: duration,
  startLocation: location,
  nearbyRiskWarnings,
});

  const session = useWalkSafeStore.getState().getSessionById(sessionId);

  if (session) {
    createWalkSafeSessionApi({
  mode: session.mode,
  startLocation: session.startLocation,
      destinationName: session.destinationName,
      trustedContactId: session.trustedContactId,
      trustedContactName: session.trustedContactName,
      trustedContactPhone: session.trustedContactPhone,
      expectedDurationMinutes: session.expectedDurationMinutes,
      startedAt: session.startedAt,
      expectedArrivalAt: session.expectedArrivalAt,
      riskLevel: session.riskLevel,
      nearbyRiskWarnings: session.nearbyRiskWarnings,
    })
      .then((backendSession) => {
        setSessionBackendId(sessionId, backendSession.backendId ?? backendSession.id);
      })
      .catch((error) => {
        console.log("Walk Safe backend sync failed:", error);
      });
  }

  router.push({
    pathname: "/walk-safe/active",
    params: { sessionId },
  });
};

  const handleStartWalkSafe = async () => {
  if (!destinationName.trim()) {
    Alert.alert("Missing Destination", "Please enter where you are going.");
    return;
  }

  if (!selectedContact) {
    Alert.alert(
      "No Trusted Contact",
      "Please select or add a trusted contact before starting Walk Safe.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Contact",
          onPress: () => router.push("/contacts"),
        },
      ]
    );
    return;
  }

  try {
    setLoading(true);

    const location = await getCurrentLocation();

    let reportsForRiskCheck = localReports;

    try {
      reportsForRiskCheck = await getIncidentReportsApi();
    } catch (error) {
      console.log("Using local reports for Walk Safe risk check:", error);
    }

    const nearbyRiskWarnings = getNearbyRiskWarnings({
      currentLocation: location,
      reports: reportsForRiskCheck,
      radiusMeters: riskWarningRadiusMeters,
    });

    if (nearbyRiskWarnings.length > 0) {
      const highestRisk = nearbyRiskWarnings[0];

      Alert.alert(
        "Nearby Risk Detected",
        `SafeWalk AI found ${nearbyRiskWarnings.length} risk report${
          nearbyRiskWarnings.length > 1 ? "s" : ""
        } near your current area.\n\nHighest risk: ${
          highestRisk.title
        }\nDistance: ${highestRisk.distanceMeters}m\nRisk score: ${
          highestRisk.aiRiskScore
        }`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Start Anyway",
            onPress: () => {
              startWalkSafeSession(location, nearbyRiskWarnings);
            },
          },
        ]
      );

      return;
    }

    startWalkSafeSession(location, nearbyRiskWarnings);
  } catch (error) {
    Alert.alert(
      "Location Error",
      error instanceof Error
        ? error.message
        : "Unable to get your current location."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <ShieldCheck size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Walk Safe Mode</Text>
        <Text style={styles.heroText}>
          Start a monitored walk when moving alone. SafeWalk AI will keep your
          route session active until you arrive safely.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Where are you going?"
          subtitle="Enter your hostel, apartment, lecture hall, library, bus stop, or any destination."
        />

        <AppButton
  title="Test Expo Map"
  onPress={() => router.push("/test")}
  variant="secondary"
/>

        <View style={styles.safeRouteCard}>
  <View style={styles.safeRouteIcon}>
    <Navigation size={26} color={COLORS.primary} />
  </View>

  

  <View style={styles.safeRouteContent}>
    <Text style={styles.safeRouteTitle}>Live Safe Navigation</Text>
    <Text style={styles.safeRouteText}>
      Search a destination, view the route, and let SafeWalk AI monitor your movement.
    </Text>
  </View>

  

  <AppButton
    title="Open"
    onPress={() => router.push("/navigation")}
    variant="secondary"
    style={styles.safeRouteButton}
  />
</View>

        <View style={styles.safeRouteCard}>
  <View style={styles.safeRouteIcon}>
    <Navigation size={26} color={COLORS.primary} />
  </View>

  <View style={styles.safeRouteContent}>
    <Text style={styles.safeRouteTitle}>Plan a Safer Route</Text>
    <Text style={styles.safeRouteText}>
      Compare route options before walking to hostel or off-campus areas.
    </Text>
  </View>

  <AppButton
    title="Plan"
    onPress={() => router.push("/safe-routes")}
    variant="secondary"
    style={styles.safeRouteButton}
  />
</View>

        <View style={styles.modeSection}>
  <Text style={styles.modeSectionTitle}>Choose monitoring mode</Text>

  <View style={styles.modeGrid}>
    <Pressable
      onPress={() => setMode("walk_safe")}
      style={[
        styles.modeCard,
        mode === "walk_safe" && styles.modeCardActive,
      ]}
    >
      <Text
        style={[
          styles.modeTitle,
          mode === "walk_safe" && styles.modeTitleActive,
        ]}
      >
        Walk Safe
      </Text>

      <Text
        style={[
          styles.modeText,
          mode === "walk_safe" && styles.modeTextActive,
        ]}
      >
        General monitored walking.
      </Text>
    </Pressable>

    <Pressable
      onPress={() => setMode("walk_home")}
      style={[
        styles.modeCard,
        mode === "walk_home" && styles.modeCardActive,
      ]}
    >
      <Text
        style={[
          styles.modeTitle,
          mode === "walk_home" && styles.modeTitleActive,
        ]}
      >
        Walk Home
      </Text>

      <Text
        style={[
          styles.modeText,
          mode === "walk_home" && styles.modeTextActive,
        ]}
      >
        Hostel or off-campus route.
      </Text>
    </Pressable>
  </View>
</View>

        <AppInput
  label={mode === "walk_home" ? "Hostel / Home Destination" : "Destination"}
  value={destinationName}
  onChangeText={setDestinationName}
  placeholder={
    mode === "walk_home"
      ? "e.g. Ayeduase Hostel, Kotei, Bomso"
      : "e.g. Library, lecture hall, hostel"
  }
/>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Expected walking time"
          subtitle="Choose how long the walk should take."
        />

        <View style={styles.durationRow}>
          {durationOptions.map((option) => {
            const selected = option === duration;

            return (
              <Pressable
                key={option}
                onPress={() => setDuration(option)}
                style={[
                  styles.durationChip,
                  selected && styles.durationChipSelected,
                ]}
              >
                <Clock
                  size={15}
                  color={selected ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.durationText,
                    selected && styles.durationTextSelected,
                  ]}
                >
                  {option} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Trusted contact"
          subtitle="This person should be alerted if something goes wrong."
        />

        {contacts.length === 0 ? (
          <View style={styles.noContactsCard}>
            <Text style={styles.noContactsTitle}>No emergency contacts</Text>
            <Text style={styles.noContactsText}>
              Add a trusted contact before using Walk Safe mode.
            </Text>

            <AppButton
              title="Add Emergency Contact"
              onPress={() => router.push("/contacts")}
              style={styles.noContactsButton}
            />
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <ContactOption
                key={contact.id}
                contact={contact}
                selected={contact.id === selectedContactId}
                onPress={() => setSelectedContactId(contact.id)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <MapPin size={22} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Your current location will be captured when Walk Safe starts.
        </Text>
      </View>

      <AppButton
        title={mode === "walk_home" ? "Start Walk Home" : "Start Walk Safe"}
        onPress={handleStartWalkSafe}
        loading={loading}
        disabled={loading}
        style={styles.startButton}
      />
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

  heroIcon: {
    width: 74,
    height: 74,
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
  },

  heroText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  section: {
    marginTop: SPACING.xl,
  },

  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  durationChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  durationText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.primary,
  },

  durationTextSelected: {
    color: COLORS.white,
  },

  contactsList: {
    gap: SPACING.md,
  },

  contactOption: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.soft,
  },

  contactOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  contactAvatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  contactInfo: {
    flex: 1,
  },

  contactName: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  contactMeta: {
    marginTop: 3,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
  },

  noContactsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  noContactsTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  noContactsText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    lineHeight: 20,
  },

  noContactsButton: {
    marginTop: SPACING.lg,
  },

  infoCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },

  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    fontWeight: "700",
    lineHeight: 20,
  },

  startButton: {
    marginTop: SPACING.xl,
  },
  modeSection: {
  marginBottom: SPACING.xl,
},

modeSectionTitle: {
  fontSize: FONT_SIZE.sm,
  fontWeight: "900",
  color: COLORS.text,
  marginBottom: SPACING.sm,
},

modeGrid: {
  flexDirection: "row",
  gap: SPACING.md,
},

modeCard: {
  flex: 1,
  backgroundColor: COLORS.surface,
  borderRadius: RADIUS.xl,
  padding: SPACING.lg,
  borderWidth: 1,
  borderColor: COLORS.border,
  ...SHADOWS.soft,
},

modeCardActive: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
},

modeTitle: {
  fontSize: FONT_SIZE.md,
  fontWeight: "900",
  color: COLORS.text,
},

modeTitleActive: {
  color: COLORS.white,
},

modeText: {
  marginTop: SPACING.xs,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
  lineHeight: 18,
},

modeTextActive: {
  color: COLORS.primaryLight,
},
safeRouteCard: {
  backgroundColor: COLORS.surface,
  borderRadius: RADIUS.xl,
  padding: SPACING.lg,
  borderWidth: 1,
  borderColor: COLORS.border,
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.md,
  marginBottom: SPACING.xl,
  ...SHADOWS.soft,
},

safeRouteIcon: {
  width: 52,
  height: 52,
  borderRadius: RADIUS.full,
  backgroundColor: COLORS.primaryLight,
  alignItems: "center",
  justifyContent: "center",
},

safeRouteContent: {
  flex: 1,
},

safeRouteTitle: {
  fontSize: FONT_SIZE.md,
  fontWeight: "900",
  color: COLORS.text,
},

safeRouteText: {
  marginTop: 2,
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "700",
  lineHeight: 18,
},

safeRouteButton: {
  minHeight: 42,
  paddingHorizontal: SPACING.md,
},
});