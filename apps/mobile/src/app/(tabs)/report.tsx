import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Accessibility,
  AlertTriangle,
  Brain,
  Building2,
  Camera,
  CircleAlert,
  Droplets,
  Flame,
  HeartPulse,
  Home,
  ImagePlus,
  Laptop,
  LightbulbOff,
  MapPin,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wrench,
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
  IncidentPriority,
  ReportEvidence,
} from "../../types/incident";
import { useIncidentStore } from "../../store/incidentStore";
import { getCurrentLocation } from "../../lib/location";
import { createIncidentReportApi } from "../../lib/incidentApi";
import {
  autocompletePlacesApi,
  getPlaceDetailsApi,
} from "../../lib/placeApi";
import { PlaceSuggestion } from "../../types/place";
import { generateIncidentAI } from "../../utils/incidentAI";

type CategoryOption = {
  label: string;
  value: IncidentCategory;
  icon: React.ReactNode;
};

const categories: CategoryOption[] = [
  {
    label: "Security",
    value: "security_emergency",
    icon: <ShieldAlert size={20} color={COLORS.primary} />,
  },
  {
    label: "Medical",
    value: "medical_emergency",
    icon: <HeartPulse size={20} color={COLORS.primary} />,
  },
  {
    label: "Fire",
    value: "fire_emergency",
    icon: <Flame size={20} color={COLORS.primary} />,
  },
  {
    label: "Flooding",
    value: "flooding",
    icon: <Droplets size={20} color={COLORS.primary} />,
  },
  {
    label: "Electrical",
    value: "electrical_fault",
    icon: <LightbulbOff size={20} color={COLORS.primary} />,
  },
  {
    label: "Lecture Room",
    value: "lecture_room_fault",
    icon: <Building2 size={20} color={COLORS.primary} />,
  },
  {
    label: "Furniture",
    value: "furniture_damage",
    icon: <Wrench size={20} color={COLORS.primary} />,
  },
  {
    label: "Sanitation",
    value: "sanitation_issue",
    icon: <Droplets size={20} color={COLORS.primary} />,
  },
  {
    label: "Water Leakage",
    value: "water_leakage",
    icon: <Droplets size={20} color={COLORS.primary} />,
  },
  {
    label: "ICT Problem",
    value: "ict_problem",
    icon: <Laptop size={20} color={COLORS.primary} />,
  },
  {
    label: "Walkway Hazard",
    value: "road_walkway_hazard",
    icon: <MapPin size={20} color={COLORS.primary} />,
  },
  {
    label: "Hostel / Hall",
    value: "hostel_hall_issue",
    icon: <Home size={20} color={COLORS.primary} />,
  },
  {
    label: "Disaster",
    value: "disaster_hazard",
    icon: <AlertTriangle size={20} color={COLORS.primary} />,
  },
  {
    label: "Accessibility",
    value: "accessibility_issue",
    icon: <Accessibility size={20} color={COLORS.primary} />,
  },
  {
    label: "Lost & Found",
    value: "lost_found",
    icon: <CircleAlert size={20} color={COLORS.primary} />,
  },
];

const priorityOptions: IncidentPriority[] = [
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

  const createReport = useIncidentStore((state) => state.createReport);

  const [category, setCategory] =
    useState<IncidentCategory>("lecture_room_fault");
  const [priority, setPriority] = useState<IncidentPriority>("medium");
  const [areaType, setAreaType] = useState<IncidentAreaType>("on_campus");

  const [locationName, setLocationName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [landmark, setLandmark] = useState("");

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

  const [reporterName, setReporterName] = useState("");
  const [reporterStudentId, setReporterStudentId] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  const [evidence, setEvidence] = useState<ReportEvidence[]>([]);

  const [loading, setLoading] = useState(false);

  const aiPreview = useMemo(() => {
    return generateIncidentAI({
      category,
      priority,
      severity: priority,
      areaType,
      description,
      locationName,
      buildingName,
      roomNumber,
    });
  }, [category, priority, areaType, description, locationName, buildingName, roomNumber]);

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
      Alert.alert(
        "Location Error",
        "SafeCampus AI could not get coordinates for this location."
      );
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleUseCurrentLocationForReport = async () => {
    try {
      const location = await getCurrentLocation();

      setSelectedPlaceLocation(location);

      if (!locationName.trim()) {
        setLocationName("Current GPS location");
      }

      setLocationSuggestions([]);

      Alert.alert(
        "Location Captured",
        "Your current GPS location will be attached to this campus issue report."
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

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera Permission Needed",
        "Allow camera access so you can attach evidence to the report."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setEvidence((current) => [
        ...current,
        {
          uri: result.assets[0].uri,
          type: "image",
          uploadedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Gallery Permission Needed",
        "Allow photo access so you can attach evidence to the report."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => ({
        uri: asset.uri,
        type: "image" as const,
        uploadedAt: new Date().toISOString(),
      }));

      setEvidence((current) => [...current, ...selectedImages]);
    }
  };

  const handleRemoveEvidence = (uri: string) => {
    setEvidence((current) => current.filter((item) => item.uri !== uri));
  };

  const resetForm = () => {
    setCategory("lecture_room_fault");
    setPriority("medium");
    setAreaType("on_campus");
    setLocationName("");
    setBuildingName("");
    setRoomNumber("");
    setLandmark("");
    setSelectedPlaceLocation(null);
    setLocationSuggestions([]);
    setDescription("");
    setReporterName("");
    setReporterStudentId("");
    setReporterPhone("");
    setAnonymous(true);
    setEvidence([]);
  };

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert(
        "Missing Description",
        "Please describe the campus problem before submitting."
      );
      return;
    }

    if (!locationName.trim() && !buildingName.trim()) {
      Alert.alert(
        "Missing Location",
        "Please provide a location name, building, room, or use your current GPS location."
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
        severity: priority,
        priority,
        areaType,
        location,
        locationName,
        buildingName,
        roomNumber,
        landmark,
        evidence,
        reporterName,
        reporterPhone,
        reporterStudentId,
        anonymous,
      };

      createReport(reportPayload);

      const response = await createIncidentReportApi(reportPayload);
      const savedReport = response.data;

      Alert.alert(
        "Report Submitted",
        `SafeCampus AI classified this as ${savedReport.problemType || savedReport.title}.\n\nAssigned to:\n${savedReport.assignedUnit || savedReport.aiSuggestedUnit || "Responsible authority"}`,
        [
          {
            text: "View Issue Map",
            onPress: () => router.push("/(tabs)/risk-map"),
          },
          {
            text: "Done",
            style: "cancel",
          },
        ]
      );

      resetForm();
    } catch (error) {
      console.log("Submit campus report failed:", error);

      Alert.alert(
        "Saved Locally",
        "Your report was saved on this phone, but it could not sync to the backend. Check that your API server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Sparkles size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Report Campus Issue</Text>

        <Text style={styles.heroText}>
          Report lecture room faults, disasters, sanitation issues, ICT
          problems, safety concerns, and other University of Ghana campus issues.
          SafeCampus AI will classify and route it to the responsible unit.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="What problem happened?"
          subtitle="Choose the closest issue type. AI can still correct the category based on your description."
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
          subtitle="Provide the exact place, building, room, or landmark."
        />

        <View style={styles.locationCard}>
          <AppInput
            label="Location name"
            placeholder="Example: JQB Room 12, Balme Library, Night Market"
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

          <View style={styles.twoColumnRow}>
            <AppInput
              label="Building"
              placeholder="JQB"
              value={buildingName}
              onChangeText={setBuildingName}
              style={styles.compactInput}
            />

            <AppInput
              label="Room"
              placeholder="12"
              value={roomNumber}
              onChangeText={setRoomNumber}
              style={styles.compactInput}
            />
          </View>

          <AppInput
            label="Nearby landmark"
            placeholder="Example: Near main entrance, behind the library"
            value={landmark}
            onChangeText={setLandmark}
          />

          {selectedPlaceLocation ? (
            <View style={styles.selectedLocationBox}>
              <MapPin size={18} color={COLORS.primary} />

              <Text style={styles.selectedLocationText}>
                GPS coordinates attached to this report.
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
          title="Priority"
          subtitle="How urgent is this problem?"
        />

        <View style={styles.priorityRow}>
          {priorityOptions.map((option) => {
            const selected = option === priority;

            return (
              <Pressable
                key={option}
                onPress={() => setPriority(option)}
                style={[
                  styles.priorityChip,
                  selected && styles.priorityChipSelected,
                  option === "critical" && styles.criticalBorder,
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    selected && styles.priorityTextSelected,
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
          subtitle="Explain the problem clearly. Avoid private details."
        />

        <AppInput
          label="Problem description"
          placeholder="Example: The projector in JQB Room 12 is not working and students cannot see lecture slides."
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.descriptionInput}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Photo evidence"
          subtitle="Attach a picture so authorities can verify the issue."
        />

        <View style={styles.evidenceActions}>
          <Pressable onPress={handleTakePhoto} style={styles.evidenceButton}>
            <Camera size={19} color={COLORS.primary} />
            <Text style={styles.evidenceButtonText}>Take Photo</Text>
          </Pressable>

          <Pressable onPress={handlePickImage} style={styles.evidenceButton}>
            <ImagePlus size={19} color={COLORS.primary} />
            <Text style={styles.evidenceButtonText}>Choose Image</Text>
          </Pressable>
        </View>

        {evidence.length ? (
          <View style={styles.evidenceGrid}>
            {evidence.map((item) => (
              <View key={item.uri} style={styles.evidencePreview}>
                <Image source={{ uri: item.uri }} style={styles.evidenceImage} />

                <Pressable
                  onPress={() => handleRemoveEvidence(item.uri)}
                  style={styles.removeEvidenceButton}
                >
                  <Trash2 size={15} color={COLORS.white} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyEvidenceBox}>
            <ImagePlus size={24} color={COLORS.mutedText} />
            <Text style={styles.emptyEvidenceText}>
              No photo attached yet. You can still submit, but evidence helps
              authorities understand the problem faster.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Reporter details"
          subtitle="You can report anonymously, but contact details help authorities follow up."
        />

        <ToggleRow
          title="Report anonymously"
          value={anonymous}
          onPress={() => setAnonymous((value) => !value)}
        />

        {!anonymous ? (
          <View style={styles.reporterBox}>
            <AppInput
              label="Your name"
              placeholder="Optional"
              value={reporterName}
              onChangeText={setReporterName}
            />

            <AppInput
              label="Student ID"
              placeholder="Optional"
              value={reporterStudentId}
              onChangeText={setReporterStudentId}
            />

            <AppInput
              label="Phone number"
              placeholder="Optional"
              value={reporterPhone}
              onChangeText={setReporterPhone}
              keyboardType="phone-pad"
            />
          </View>
        ) : null}
      </View>

      <View style={styles.aiPreviewCard}>
        <View style={styles.aiPreviewTop}>
          <View style={styles.aiIcon}>
            <Brain size={22} color={COLORS.primary} />
          </View>

          <View style={styles.aiTextBox}>
            <Text style={styles.aiTitle}>AI routing preview</Text>
            <Text style={styles.aiSubtitle}>
              SafeCampus AI will refine this after submission.
            </Text>
          </View>
        </View>

        <View style={styles.aiInfoRow}>
          <Text style={styles.aiInfoLabel}>Detected issue</Text>
          <Text style={styles.aiInfoValue}>{aiPreview.problemType}</Text>
        </View>

        <View style={styles.aiInfoRow}>
          <Text style={styles.aiInfoLabel}>Priority score</Text>
          <Text style={styles.aiInfoValue}>{aiPreview.priorityScore}/100</Text>
        </View>

        <View style={styles.aiInfoRow}>
          <Text style={styles.aiInfoLabel}>Responsible unit</Text>
          <Text style={styles.aiInfoValue}>{aiPreview.responsibleUnit}</Text>
        </View>

        <Text style={styles.aiAction}>{aiPreview.recommendedAction}</Text>
      </View>

      <View style={styles.infoCard}>
        <MapPin size={22} color={COLORS.primary} />

        <Text style={styles.infoText}>
          After submission, SafeCampus AI creates a case, classifies the issue,
          assigns priority, routes it to the responsible unit, and allows
          authorities to update the status until it is resolved.
        </Text>
      </View>

      <AppButton
        title={loading ? "Submitting..." : "Submit Campus Issue"}
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
    fontWeight: "700",
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

  twoColumnRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },

  compactInput: {
    flex: 1,
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

  priorityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  priorityChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },

  priorityChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  criticalBorder: {
    borderColor: COLORS.danger,
  },

  priorityText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.text,
  },

  priorityTextSelected: {
    color: COLORS.white,
  },

  descriptionInput: {
    minHeight: 130,
    textAlignVertical: "top",
    paddingTop: SPACING.md,
  },

  evidenceActions: {
    flexDirection: "row",
    gap: SPACING.md,
  },

  evidenceButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  evidenceButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  evidenceGrid: {
    marginTop: SPACING.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  evidencePreview: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceMuted,
    position: "relative",
  },

  evidenceImage: {
    width: "100%",
    height: "100%",
  },

  removeEvidenceButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyEvidenceBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  emptyEvidenceText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 20,
  },

  reporterBox: {
    marginTop: SPACING.md,
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

  aiPreviewCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  aiPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  aiTextBox: {
    flex: 1,
  },

  aiTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  aiSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  aiInfoRow: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  aiInfoLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.mutedText,
    textTransform: "uppercase",
  },

  aiInfoValue: {
    marginTop: 3,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
    lineHeight: 20,
  },

  aiAction: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.primaryDark,
    lineHeight: 21,
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