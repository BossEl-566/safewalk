import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Bike,
  CarFront,
  CircleDollarSign,
  Eye,
  LightbulbOff,
  MapPin,
  ShieldAlert,
  UserRound,
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
import {
  IncidentAreaType,
  IncidentCategory,
  IncidentSeverity,
} from "../../types/incident";
import { useIncidentStore } from "../../store/incidentStore";
import { getCurrentLocation } from "../../lib/location";
import { createIncidentReportApi } from "../../lib/incidentApi";
import { useSafetySettingsStore } from "../../store/safetySettingsStore";
import {
  autocompletePlacesApi,
  getPlaceDetailsApi,
} from "../../lib/placeApi";
import { PlaceSuggestion } from "../../types/place";

type CategoryOption = {
  label: string;
  value: IncidentCategory;
  icon: React.ReactNode;
};

const categories: CategoryOption[] = [
  {
    label: "Phone Snatch",
    value: "phone_snatch",
    icon: <Bike size={20} color={COLORS.primary} />,
  },
  {
    label: "Robbery",
    value: "robbery",
    icon: <ShieldAlert size={20} color={COLORS.primary} />,
  },
  {
    label: "Attack",
    value: "attack",
    icon: <AlertTriangle size={20} color={COLORS.primary} />,
  },
  {
    label: "Suspicious Motorbike",
    value: "suspicious_motorbike",
    icon: <Bike size={20} color={COLORS.primary} />,
  },
  {
    label: "Forced MoMo",
    value: "forced_momo_withdrawal",
    icon: <CircleDollarSign size={20} color={COLORS.primary} />,
  },
  {
    label: "Poor Lighting",
    value: "poor_lighting",
    icon: <LightbulbOff size={20} color={COLORS.primary} />,
  },
  {
    label: "Harassment",
    value: "harassment",
    icon: <UserRound size={20} color={COLORS.primary} />,
  },
  {
    label: "Unsafe Shortcut",
    value: "unsafe_shortcut",
    icon: <MapPin size={20} color={COLORS.primary} />,
  },
  {
    label: "Accident",
    value: "accident",
    icon: <CarFront size={20} color={COLORS.primary} />,
  },
  {
    label: "Other",
    value: "other",
    icon: <Eye size={20} color={COLORS.primary} />,
  },
];

const severityOptions: IncidentSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

const areaOptions: { label: string; value: IncidentAreaType }[] = [
  { label: "On campus", value: "on_campus" },
  { label: "Off campus", value: "off_campus" },
  { label: "Not sure", value: "unknown" },
];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();

  const anonymousReportingDefault = useSafetySettingsStore(
    (state) => state.anonymousReportingDefault
  );

  const createReport = useIncidentStore((state) => state.createReport);

  const [category, setCategory] = useState<IncidentCategory>("phone_snatch");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [areaType, setAreaType] = useState<IncidentAreaType>("off_campus");

  const [locationName, setLocationName] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    PlaceSuggestion[]
  >([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedPlaceLocation, setSelectedPlaceLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  } | null>(null);

  const [description, setDescription] = useState("");
  const [attackerMode, setAttackerMode] = useState("");
  const [lightingCondition, setLightingCondition] = useState("");

  const [victimWasAlone, setVictimWasAlone] = useState(true);
  const [weaponInvolved, setWeaponInvolved] = useState(false);
  const [anonymous, setAnonymous] = useState(anonymousReportingDefault);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = locationName.trim();

    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    if (selectedPlaceLocation) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingLocation(true);

        const suggestions = await autocompletePlacesApi(query);
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.log("Location autocomplete failed:", error);
        setLocationSuggestions([]);
      } finally {
        setSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationName, selectedPlaceLocation]);

  const handleLocationNameChange = (value: string) => {
    setLocationName(value);
    setSelectedPlaceLocation(null);
  };

  const handleSelectLocationSuggestion = async (
    suggestion: PlaceSuggestion
  ) => {
    try {
      setSearchingLocation(true);
      setLocationSuggestions([]);
      setLocationName(suggestion.description);

      const details = await getPlaceDetailsApi(suggestion.placeId);

      if (details.location) {
        setSelectedPlaceLocation({
          latitude: details.location.latitude,
          longitude: details.location.longitude,
          accuracy: null,
        });
      }
    } catch (error) {
      console.log("Place details failed:", error);

      Alert.alert(
        "Location Error",
        "SafeWalk AI could not get coordinates for this location."
      );
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleUseCurrentLocationForReport = async () => {
    try {
      const location = await getCurrentLocation();

      setSelectedPlaceLocation(location);
      setLocationName("Current GPS location");
      setLocationSuggestions([]);

      Alert.alert(
        "Location Captured",
        "Your current GPS location will be attached to this report."
      );
    } catch (error) {
      Alert.alert(
        "Location Error",
        error instanceof Error
          ? error.message
          : "Unable to get your current location."
      );
    }
  };

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert(
        "Missing Description",
        "Please briefly describe what happened."
      );
      return;
    }

    try {
      setLoading(true);

      let location = selectedPlaceLocation;

      if (!location) {
        try {
          location = await getCurrentLocation();
        } catch {
          location = null;
        }
      }

      const reportPayload = {
        category,
        description,
        severity,
        areaType,
        location,
        locationName,
        victimWasAlone,
        weaponInvolved,
        attackerMode,
        lightingCondition,
        anonymous,
      };

      const localReportId = createReport(reportPayload);

      try {
        await createIncidentReportApi(reportPayload);

        Alert.alert(
          "Report Saved",
          "Your incident report has been saved locally and synced to the SafeWalk AI database.",
          [
            {
              text: "View Risk Map",
              onPress: () => router.push("/(tabs)/risk-map"),
            },
            {
              text: "Done",
              style: "cancel",
            },
          ]
        );
      } catch (syncError) {
        console.log("Backend sync failed:", syncError);

        Alert.alert(
          "Saved Locally",
          "Your report was saved on this phone, but it could not sync to the backend. Check that your API server is running and your phone is on the same network.",
          [
            {
              text: "View Risk Map",
              onPress: () => router.push("/(tabs)/risk-map"),
            },
            {
              text: "Done",
              style: "cancel",
            },
          ]
        );
      }

      console.log("Local incident report created:", localReportId);

      setDescription("");
      setLocationName("");
      setSelectedPlaceLocation(null);
      setLocationSuggestions([]);
      setAttackerMode("");
      setLightingCondition("");
      setSeverity("medium");
      setCategory("phone_snatch");
      setAreaType("off_campus");
      setVictimWasAlone(true);
      setWeaponInvolved(false);
      setAnonymous(anonymousReportingDefault);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <ShieldAlert size={34} color={COLORS.danger} />
        </View>

        <Text style={styles.heroTitle}>Report an Incident</Text>

        <Text style={styles.heroText}>
          Report safety issues around campus or off-campus areas. Your report
          helps SafeWalk AI warn other students.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="What happened?"
          subtitle="Choose the closest incident type."
        />

        <View style={styles.categoryGrid}>
          {categories.map((item) => {
            const selected = item.value === category;

            return (
              <Pressable
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[styles.categoryCard, selected && styles.selectedCard]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    selected && styles.selectedIcon,
                  ]}
                >
                  {item.icon}
                </View>

                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.selectedText,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Where did it happen?"
          subtitle="Search the place or use your current GPS location."
        />

        <View style={styles.locationCard}>
          <AppInput
            label="Location name"
            placeholder="Search area, hostel, junction, or road"
            value={locationName}
            onChangeText={handleLocationNameChange}
            autoCapitalize="words"
          />

          {searchingLocation ? (
            <Text style={styles.searchingText}>
              Searching location suggestions...
            </Text>
          ) : null}

          {locationSuggestions.length > 0 ? (
            <View style={styles.locationSuggestionsCard}>
              {locationSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.placeId}
                  onPress={() => handleSelectLocationSuggestion(suggestion)}
                  style={styles.locationSuggestionItem}
                >
                  <View style={styles.locationSuggestionIcon}>
                    <MapPin size={18} color={COLORS.primary} />
                  </View>

                  <View style={styles.locationSuggestionTextBox}>
                    <Text style={styles.locationSuggestionMain}>
                      {suggestion.mainText || suggestion.description}
                    </Text>

                    <Text style={styles.locationSuggestionSecondary}>
                      {suggestion.secondaryText || suggestion.description}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {selectedPlaceLocation ? (
            <View style={styles.selectedLocationBox}>
              <MapPin size={18} color={COLORS.primary} />

              <Text style={styles.selectedLocationText}>
                Location selected with GPS coordinates.
              </Text>
            </View>
          ) : null}

          <AppButton
            title="Use My Current Location"
            onPress={handleUseCurrentLocationForReport}
            variant="secondary"
            style={styles.currentLocationButton}
          />

          <View style={styles.areaSection}>
            <Text style={styles.areaLabel}>Area type</Text>

            <View style={styles.areaRow}>
              {areaOptions.map((option) => {
                const selected = option.value === areaType;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setAreaType(option.value)}
                    style={[
                      styles.areaChip,
                      selected && styles.areaChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.areaText,
                        selected && styles.areaTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Severity"
          subtitle="How serious was the incident?"
        />

        <View style={styles.severityRow}>
          {severityOptions.map((option) => {
            const selected = option === severity;

            return (
              <Pressable
                key={option}
                onPress={() => setSeverity(option)}
                style={[
                  styles.severityChip,
                  selected && styles.severityChipSelected,
                  option === "critical" && styles.criticalBorder,
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    selected && styles.severityTextSelected,
                  ]}
                >
                  {option.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Description"
          subtitle="Keep it short. Do not include private details of victims."
        />

        <AppInput
          label="Brief description"
          placeholder="Example: Two people on a motorbike snatched a phone near the junction."
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.descriptionInput}
        />

        <AppInput
          label="Attacker movement/mode, optional"
          placeholder="Example: Motorbike, walking, car"
          value={attackerMode}
          onChangeText={setAttackerMode}
        />

        <AppInput
          label="Lighting condition, optional"
          placeholder="Example: Poor lighting, dark road"
          value={lightingCondition}
          onChangeText={setLightingCondition}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Context"
          subtitle="These details help estimate risk."
        />

        <ToggleRow
          title="Victim was alone"
          value={victimWasAlone}
          onPress={() => setVictimWasAlone((value) => !value)}
        />

        <ToggleRow
          title="Weapon involved"
          value={weaponInvolved}
          onPress={() => setWeaponInvolved((value) => !value)}
        />

        <ToggleRow
          title="Report anonymously"
          value={anonymous}
          onPress={() => setAnonymous((value) => !value)}
        />
      </View>

      <View style={styles.infoCard}>
        <MapPin size={22} color={COLORS.primary} />

        <Text style={styles.infoText}>
          SafeWalk AI will use this report to build future risk alerts and
          identify unsafe areas. Reports are saved as pending until reviewed.
        </Text>
      </View>

      <AppButton
        title="Submit Report"
        onPress={handleSubmitReport}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      />

      <View style={{ height: insets.bottom + 130 }} />
    </Screen>
  );
}

function ToggleRow({
  title,
  value,
  onPress,
}: {
  title: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.toggleRow}>
      <Text style={styles.toggleTitle}>{title}</Text>

      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </Pressable>
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
    backgroundColor: COLORS.dangerLight,
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

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  categoryCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 104,
    ...SHADOWS.soft,
  },

  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },

  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },

  selectedIcon: {
    backgroundColor: COLORS.white,
  },

  categoryText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  selectedText: {
    color: COLORS.primaryDark,
  },

  locationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  searchingText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  locationSuggestionsCard: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  locationSuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  locationSuggestionIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  locationSuggestionTextBox: {
    flex: 1,
  },

  locationSuggestionMain: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  locationSuggestionSecondary: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.mutedText,
  },

  selectedLocationBox: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  selectedLocationText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  currentLocationButton: {
    marginTop: SPACING.md,
  },

  areaSection: {
    marginTop: SPACING.lg,
  },

  areaLabel: {
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  areaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  areaChip: {
    minWidth: 100,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  areaChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  areaText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.primary,
  },

  areaTextSelected: {
    color: COLORS.white,
  },

  severityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  severityChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  severityChipSelected: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },

  criticalBorder: {
    borderColor: COLORS.danger,
  },

  severityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.text,
  },

  severityTextSelected: {
    color: COLORS.white,
  },

  descriptionInput: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: SPACING.md,
  },

  toggleRow: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  toggleTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: "800",
  },

  toggle: {
    width: 54,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    padding: 3,
  },

  toggleActive: {
    backgroundColor: COLORS.primary,
  },

  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
  },

  toggleKnobActive: {
    alignSelf: "flex-end",
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

  submitButton: {
    marginTop: SPACING.xl,
  },
});