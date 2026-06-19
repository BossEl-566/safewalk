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

  const [destinationName, setDestinationName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    contacts[0]?.id ?? null
  );
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);

  const selectedContact = contacts.find(
    (contact) => contact.id === selectedContactId
  );

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

      const sessionId = startSession({
        destinationName,
        trustedContactId: selectedContact.id,
        trustedContactName: selectedContact.name,
        trustedContactPhone: selectedContact.phone,
        expectedDurationMinutes: duration,
        startLocation: location,
      });

      router.push({
        pathname: "/walk-safe/active",
        params: { sessionId },
      });
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

        <AppInput
          label="Destination"
          placeholder="Example: Ayeduase Hostel"
          value={destinationName}
          onChangeText={setDestinationName}
          autoCapitalize="words"
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
        title="Start Walk Safe"
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
});