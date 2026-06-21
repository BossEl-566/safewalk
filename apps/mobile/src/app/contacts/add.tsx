import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { SectionHeader } from "../../components/SectionHeader";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";
import { useContactStore } from "../../store/contactStore";
import { createEmergencyContactApi } from "../../lib/contactApi";

export default function AddContactScreen() {
  const addContact = useContactStore((state) => state.addContact);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter the contact's name.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Missing Phone Number", "Please enter the contact's phone number.");
      return;
    }

    if (!relationship.trim()) {
      Alert.alert("Missing Relationship", "Please enter your relationship with this contact.");
      return;
    }

    const localContactId = addContact({
  name,
  phone,
  relationship,
});

try {
  await createEmergencyContactApi({
    name,
    phone,
    relationship,
  });

  console.log("Emergency contact synced to backend:", localContactId);
} catch (error) {
  console.log("Contact backend sync failed:", error);

  Alert.alert(
    "Saved Locally",
    "The contact was saved on this phone, but it could not sync to the backend. Check that your API server is running."
  );
}

router.back();
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Add Contact</Text>

        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader
        title="Trusted Person"
        subtitle="Choose someone who should be alerted when you trigger SOS or fail a Walk Safe check-in."
      />

      <View style={styles.form}>
        <AppInput
          label="Full Name"
          placeholder="Example: Ama Mensah"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <AppInput
          label="Phone Number"
          placeholder="Example: 0241234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <AppInput
          label="Relationship"
          placeholder="Example: Roommate, Father, Sister"
          value={relationship}
          onChangeText={setRelationship}
          autoCapitalize="words"
        />

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            In emergencies, SafeWalk AI will use this contact for alert messages and location sharing.
          </Text>
        </View>

        <AppButton title="Save Contact" onPress={handleSave} style={styles.saveButton} />
      </View>
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

  form: {
    marginTop: SPACING.lg,
  },

  infoCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "700",
    lineHeight: 20,
  },

  saveButton: {
    marginTop: SPACING.sm,
  },
});