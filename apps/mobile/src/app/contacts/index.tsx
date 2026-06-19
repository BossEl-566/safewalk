import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { SectionHeader } from "../../components/SectionHeader";
import { COLORS, FONT_SIZE, RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import { useContactStore } from "../../store/contactStore";
import { EmergencyContact } from "../../types/contact";

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const deleteContact = useContactStore((state) => state.deleteContact);

  const handleDelete = () => {
    Alert.alert(
      "Delete Contact",
      `Remove ${contact.name} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteContact(contact.id),
        },
      ]
    );
  };

  return (
    <View style={styles.contactCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactMeta}>{contact.relationship}</Text>
        <Text style={styles.contactPhone}>{contact.phone}</Text>
      </View>

      <Pressable
        onPress={handleDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${contact.name}`}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={21} color={COLORS.danger} />
      </Pressable>
    </View>
  );
}

export default function ContactsScreen() {
  const contacts = useContactStore((state) => state.contacts);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Emergency Contacts</Text>

        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader
        title="Trusted Contacts"
        subtitle="These are the people SafeWalk AI will alert during SOS or Walk Safe emergencies."
      />

      {contacts.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={44} color={COLORS.primary} />
          </View>

          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyText}>
            Add at least one trusted person before using SOS or Walk Safe mode.
          </Text>

          <AppButton
            title="Add Emergency Contact"
            onPress={() => router.push("/contacts/add")}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ContactCard contact={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />

          <AppButton
            title="Add Another Contact"
            onPress={() => router.push("/contacts/add")}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  headerSpacer: {
    width: 44,
  },

  emptyCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },

  emptyButton: {
    marginTop: SPACING.xl,
    width: "100%",
  },

  listContent: {
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },

  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.soft,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },

  avatarText: {
    fontSize: FONT_SIZE.lg,
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
    marginTop: 2,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
  },

  contactPhone: {
    marginTop: 3,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
});