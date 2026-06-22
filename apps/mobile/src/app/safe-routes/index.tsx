import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  Footprints,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
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
import { recommendSafeRouteApi } from "../../lib/safeRouteApi";
import {
  SafeRouteAreaType,
  SafeRouteOption,
  SafeRouteRecommendation,
  SafeRouteTravelMode,
} from "../../types/safeRoute";

function getRiskColor(score: number) {
  if (score >= 85) return COLORS.danger;
  if (score >= 70) return COLORS.danger;
  if (score >= 40) return COLORS.warning;
  return COLORS.primary;
}

function getRiskBackground(score: number) {
  if (score >= 70) return COLORS.dangerLight;
  if (score >= 40) return COLORS.warningLight;
  return COLORS.primaryLight;
}

function RouteOptionCard({ route }: { route: SafeRouteOption }) {
  const riskColor = getRiskColor(route.riskScore);
  const riskBackground = getRiskBackground(route.riskScore);

  return (
    <View
      style={[
        styles.routeCard,
        route.isRecommended && styles.recommendedRouteCard,
      ]}
    >
      {route.isRecommended ? (
        <View style={styles.recommendedBadge}>
          <ShieldCheck size={15} color={COLORS.white} />
          <Text style={styles.recommendedBadgeText}>Recommended</Text>
        </View>
      ) : null}

      <View style={styles.routeHeader}>
        <View style={[styles.routeIcon, { backgroundColor: riskBackground }]}>
          <Route size={23} color={riskColor} />
        </View>

        <View style={styles.routeHeaderText}>
          <Text style={styles.routeName}>{route.routeName}</Text>
          <Text style={styles.routeMeta}>
            {route.estimatedTimeMinutes} min •{" "}
            {Math.round(route.routeDistanceMeters)}m
          </Text>
        </View>

        <View style={[styles.riskPill, { backgroundColor: riskBackground }]}>
          <Text style={[styles.riskPillText, { color: riskColor }]}>
            {route.riskLevel.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>Risk Score</Text>
        <Text style={[styles.scoreValue, { color: riskColor }]}>
          {route.riskScore}/100
        </Text>
      </View>

      <View style={styles.recommendationBox}>
        <Navigation size={17} color={COLORS.primary} />
        <Text style={styles.recommendationText}>{route.recommendation}</Text>
      </View>

      <View style={styles.reasonList}>
        {route.riskReasons.slice(0, 4).map((reason, index) => (
          <View key={`${route.routeName}-${index}`} style={styles.reasonItem}>
            <AlertTriangle size={14} color={riskColor} />
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SafeRoutesScreen() {
  const [startName, setStartName] = useState("Campus Library");
  const [destinationName, setDestinationName] = useState("Ayeduase Hostel");
  const [travelMode, setTravelMode] = useState<SafeRouteTravelMode>("walking");
  const [areaType, setAreaType] = useState<SafeRouteAreaType>("off_campus");
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] =
    useState<SafeRouteRecommendation | null>(null);

  const handleRecommendRoute = async () => {
    if (!startName.trim()) {
      Alert.alert("Missing Start", "Please enter your starting point.");
      return;
    }

    if (!destinationName.trim()) {
      Alert.alert("Missing Destination", "Please enter your destination.");
      return;
    }

    try {
      setLoading(true);

      const result = await recommendSafeRouteApi({
        startName,
        destinationName,
        travelMode,
        areaType,
        selectedHour,
      });

      setRecommendation(result);
    } catch (error) {
      Alert.alert(
        "Route Recommendation Failed",
        "Could not generate safe route recommendation. Make sure your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const recommendedRoute = recommendation?.routes.find(
    (route) => route.isRecommended
  );

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Safe Route</Text>
          <Text style={styles.headerSubtitle}>
            Find the safer route before moving
          </Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Navigation size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.heroTitle}>Safe Route Recommendation</Text>
        <Text style={styles.heroText}>
          SafeWalk AI compares possible routes using incident reports, time, and
          area type to recommend a safer option.
        </Text>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Route Details"
          subtitle="Enter where you are moving from and where you are going."
        />

        <AppInput
          label="Start Location"
          value={startName}
          onChangeText={setStartName}
          placeholder="e.g. Campus Library"
        />

        <AppInput
          label="Destination"
          value={destinationName}
          onChangeText={setDestinationName}
          placeholder="e.g. Ayeduase Hostel"
        />

        <Text style={styles.optionLabel}>Movement Type</Text>

        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setTravelMode("walking")}
            style={[
              styles.chip,
              travelMode === "walking" && styles.chipSelected,
            ]}
          >
            <Footprints
              size={15}
              color={travelMode === "walking" ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.chipText,
                travelMode === "walking" && styles.chipTextSelected,
              ]}
            >
              Walking
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTravelMode("ride")}
            style={[styles.chip, travelMode === "ride" && styles.chipSelected]}
          >
            <Navigation
              size={15}
              color={travelMode === "ride" ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.chipText,
                travelMode === "ride" && styles.chipTextSelected,
              ]}
            >
              Ride
            </Text>
          </Pressable>
        </View>

        <Text style={styles.optionLabelSpacing}>Area Type</Text>

        <View style={styles.chipRow}>
          {(["on_campus", "off_campus", "unknown"] as SafeRouteAreaType[]).map(
            (type) => {
              const selected = areaType === type;

              return (
                <Pressable
                  key={type}
                  onPress={() => setAreaType(type)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <MapPin
                    size={15}
                    color={selected ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {type.replace("_", " ")}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        <Text style={styles.optionLabelSpacing}>Travel Time</Text>

        <View style={styles.chipRow}>
          {[7, 12, 16, 19, 20, 21, 22].map((hour) => {
            const selected = selectedHour === hour;

            return (
              <Pressable
                key={hour}
                onPress={() => setSelectedHour(hour)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Clock
                  size={15}
                  color={selected ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {hour}:00
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          title={loading ? "Checking Route..." : "Recommend Safe Route"}
          onPress={handleRecommendRoute}
          disabled={loading}
          loading={loading}
          style={styles.recommendButton}
        />
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>
            SafeWalk AI is checking route risks...
          </Text>
        </View>
      ) : null}

      {recommendation ? (
        <View style={styles.section}>
          <SectionHeader
            title="Recommendation Result"
            subtitle={`${recommendation.incidentCountUsed} incident report(s) were used in this route risk analysis.`}
          />

          {recommendedRoute ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <ShieldCheck size={28} color={COLORS.primary} />
              </View>

              <Text style={styles.summaryTitle}>
                Recommended: {recommendedRoute.routeName}
              </Text>

              <Text style={styles.summaryText}>
                This route has the lowest risk score among the generated route
                options.
              </Text>

              <View style={styles.summaryMetaRow}>
                <Text style={styles.summaryMeta}>
                  Risk: {recommendedRoute.riskScore}/100
                </Text>
                <Text style={styles.summaryMeta}>
                  Time: {recommendedRoute.estimatedTimeMinutes} min
                </Text>
              </View>

              <AppButton
                title="Start Walk Home"
                onPress={() => router.push("/(tabs)/walk-safe")}
                variant="primary"
                style={styles.startWalkButton}
              />
            </View>
          ) : null}

          {recommendation.routes.map((route) => (
            <RouteOptionCard key={route.routeName} route={route} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

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
    width: 82,
    height: 82,
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
    textAlign: "center",
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

  optionLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  optionLabelSpacing: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  chip: {
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

  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "capitalize",
  },

  chipTextSelected: {
    color: COLORS.white,
  },

  recommendButton: {
    marginTop: SPACING.xl,
  },

  loadingCard: {
    marginTop: SPACING.xl,
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

  loadingText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.lg,
  },

  summaryIcon: {
    width: 62,
    height: 62,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  summaryTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.primaryDark,
    textAlign: "center",
  },

  summaryText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "700",
  },

  summaryMetaRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
    gap: SPACING.md,
  },

  summaryMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  startWalkButton: {
    marginTop: SPACING.lg,
    width: "100%",
  },

  routeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  recommendedRouteCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  recommendedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },

  recommendedBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    fontWeight: "900",
  },

  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  routeHeaderText: {
    flex: 1,
  },

  routeName: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  routeMeta: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  riskPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },

  riskPillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
  },

  scoreRow: {
    marginTop: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  scoreLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  scoreValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },

  recommendationBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  recommendationText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "800",
    lineHeight: 18,
  },

  reasonList: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  reasonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },

  reasonText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },
});