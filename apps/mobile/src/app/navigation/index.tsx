import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  LeafletMapView,
  LeafletMapViewRef,
} from "../../components/LeafletMapView";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react-native";

import { AppButton } from "../../components/AppButton";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { calculateSafeNavigationRouteApi } from "../../lib/navigationApi";
import {
  autocompletePlacesApi,
  getPlaceDetailsApi,
} from "../../lib/placeApi";
import { MapCoordinate, SafeNavigationRoute } from "../../types/navigation";
import { PlaceSuggestion } from "../../types/place";
import {
  createLiveShareSessionApi,
  updateLiveShareLocationApi,
  checkInLiveShareSessionApi,
  completeLiveShareSessionApi,
  escalateLiveShareToSOSApi,
} from "../../lib/liveShareApi";
import { useLiveShareStore } from "../../store/liveShareStore";
import { checkLocationRiskApi } from "../../lib/riskApi";
import { LocationRiskResult } from "../../types/risk";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_REGION: Region = {
  latitude: 6.6745,
  longitude: -1.5716,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

function getRiskColor(score: number) {
  if (score >= 85) return COLORS.danger;
  if (score >= 70) return COLORS.danger;
  if (score >= 40) return COLORS.warning;
  return COLORS.primary;
}

function formatDistance(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

function formatGoogleDuration(duration: string) {
  if (!duration) return "Unknown time";

  const seconds = Number(duration.replace("s", ""));

  if (Number.isNaN(seconds)) return duration;

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(pointA: MapCoordinate, pointB: MapCoordinate) {
  const earthRadiusMeters = 6371000;

  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const deltaLat = toRadians(pointB.latitude - pointA.latitude);
  const deltaLng = toRadians(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function findNearestRouteIndex(
  userLocation: MapCoordinate,
  routeCoordinates: MapCoordinate[]
) {
  if (routeCoordinates.length === 0) return 0;

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  routeCoordinates.forEach((coordinate, index) => {
    const distance = getDistanceMeters(userLocation, coordinate);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return {
    nearestIndex,
    nearestDistance,
  };
}

export default function NavigationScreen() {
  const insets = useSafeAreaInsets();
  const activeShare = useLiveShareStore((state) => state.activeShare);
const setActiveShare = useLiveShareStore((state) => state.setActiveShare);
const clearActiveShare = useLiveShareStore((state) => state.clearActiveShare);
const sosEscalationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
  null
);
  const mapRef = useRef<LeafletMapViewRef | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const lastRiskCheckRef = useRef(0);

  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const snapPoints = useMemo(() => ["28%", "64%", "92%"], []);

  const [rerouting, setRerouting] = useState(false);
const [rerouteCount, setRerouteCount] = useState(0);

  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [destination, setDestination] = useState<MapCoordinate | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [searchText, setSearchText] = useState("");

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [escalatingSOS, setEscalatingSOS] = useState(false);

  const [route, setRoute] = useState<SafeNavigationRoute | null>(null);
  const [passedRoute, setPassedRoute] = useState<MapCoordinate[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<MapCoordinate[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [offRouteWarningShown, setOffRouteWarningShown] = useState(false);
  const [currentAreaRisk, setCurrentAreaRisk] =
  useState<LocationRiskResult | null>(null);

const [dangerAreaWarningShown, setDangerAreaWarningShown] = useState(false);

  const [friendName, setFriendName] = useState("");
const [friendPhone, setFriendPhone] = useState("");
const [creatingShare, setCreatingShare] = useState(false);

  const routeRiskColor = route ? getRiskColor(route.riskScore) : COLORS.primary;

  const focusMapOnPoints = useCallback(
    (points: MapCoordinate[]) => {
      if (!mapRef.current || points.length === 0) return;

      mapRef.current.fitToCoordinates(points);
    },
    []
  );

  const handleSafeCheckIn = async () => {
  if (!activeShare?.shareToken) {
    Alert.alert("No Active Share", "Start Walk Home first.");
    return;
  }

  try {
    const updated = await checkInLiveShareSessionApi(activeShare.shareToken);
    setActiveShare(updated);

    Alert.alert("Check-in Sent", "Your friend can now see that you are safe.");
  } catch (error) {
    Alert.alert("Check-in Failed", "Could not send your safety check-in.");
  }
};

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Needed",
          "SafeWalk AI needs your current location to calculate a route."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setUserLocation(coordinate);

      mapRef.current?.animateToRegion({
  ...coordinate,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
});
    } catch (error) {
      Alert.alert("Location Error", "Could not get your current location.");
    }
  };

  const handleSearchChange = async (value: string) => {
    setSearchText(value);
    setDestinationName(value);
    setRoute(null);
    setPassedRoute([]);
    setRemainingRoute([]);
    setRerouteCount(0);

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSearching(true);
      const result = await autocompletePlacesApi(value);
      setSuggestions(result);
    } catch (error) {
      console.log("Autocomplete failed:", error);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    try {
      setSearching(true);
      setSuggestions([]);
      setSearchText(suggestion.description);
      setDestinationName(suggestion.description);

      const details = await getPlaceDetailsApi(suggestion.placeId);

      if (!details.location) {
        Alert.alert("No Location", "This place has no GPS coordinates.");
        return;
      }

      setDestination(details.location);

      mapRef.current?.animateToRegion({
  latitude: details.location.latitude,
  longitude: details.location.longitude,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
});
    } catch (error) {
      Alert.alert("Place Error", "Could not load selected place details.");
    } finally {
      setSearching(false);
    }
  };

  const getFreshCurrentLocation = async (): Promise<MapCoordinate | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Location Permission Needed",
        "SafeWalk AI needs your current location to calculate a route."
      );
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    setUserLocation(coordinate);

    mapRef.current?.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });

    return coordinate;
  } catch (error) {
    Alert.alert("Location Error", "Could not get your current location.");
    return null;
  }
};

  const handleCalculateRoute = async () => {
    const currentLocation = userLocation ?? (await getFreshCurrentLocation());

if (!currentLocation) {
  Alert.alert(
    "Missing Location",
    "SafeWalk AI could not get your current location."
  );
  return;
}

    if (!destination) {
      Alert.alert("Missing Destination", "Please search and select a destination.");
      return;
    }

    try {
      setLoadingRoute(true);

      const result = await calculateSafeNavigationRouteApi({
        origin: currentLocation,
        destination,
        travelMode: "WALK",
        selectedHour: new Date().getHours(),
      });

      if (!result.recommendedRoute) {
        Alert.alert("No Route", "Google could not return a route.");
        return;
      }

      const recommended = result.recommendedRoute;

      setRoute(recommended);
      setPassedRoute([]);
      setRemainingRoute(recommended.coordinates);
      setOffRouteWarningShown(false);
      checkCurrentAreaRisk(currentLocation);

      focusMapOnPoints([
        currentLocation,
        destination,
        ...recommended.coordinates,
      ]);

      bottomSheetRef.current?.snapToIndex(1);
    } catch (error) {
      console.log("Route calculation failed:", error);
      Alert.alert(
        "Route Failed",
        "Could not calculate route. Check your Google Routes API key and backend."
      );
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleRerouteFromCurrentLocation = async (
  currentLocation: MapCoordinate,
  reason = "You moved away from the recommended route."
) => {
  if (!destination) {
    Alert.alert("Missing Destination", "No destination found for rerouting.");
    return;
  }

  try {
    setRerouting(true);

    const result = await calculateSafeNavigationRouteApi({
      origin: currentLocation,
      destination,
      travelMode: "WALK",
      selectedHour: new Date().getHours(),
    });

    if (!result.recommendedRoute) {
      Alert.alert("Reroute Failed", "SafeWalk AI could not find a new route.");
      return;
    }

    const newRoute = result.recommendedRoute;

    setRoute(newRoute);
    setPassedRoute([]);
    setRemainingRoute(newRoute.coordinates);
    setOffRouteWarningShown(false);
    setRerouteCount((count) => count + 1);

    focusMapOnPoints([
      currentLocation,
      destination,
      ...newRoute.coordinates,
    ]);

    checkCurrentAreaRisk(currentLocation);

    Alert.alert(
      "Route Updated",
      `${reason}\n\nSafeWalk AI has calculated a new safer route from your current location.`
    );
  } catch (error) {
    console.log("Reroute failed:", error);

    Alert.alert(
      "Reroute Failed",
      "Could not calculate a new route. Check your backend and route service."
    );
  } finally {
    setRerouting(false);
  }
};

  const updatePassedAndRemainingRoute = useCallback(
    (location: MapCoordinate) => {
      if (!route?.coordinates.length) return;

      const nearest = findNearestRouteIndex(location, route.coordinates);

      if (typeof nearest === "number") return;

      const passed = route.coordinates.slice(0, nearest.nearestIndex + 1);
      const remaining = route.coordinates.slice(nearest.nearestIndex);

      setPassedRoute(passed);
      setRemainingRoute(remaining);

      if (nearest.nearestDistance > 80 && !offRouteWarningShown) {
  setOffRouteWarningShown(true);

  Alert.alert(
    "Route Warning",
    "You appear to be moving away from the recommended route. SafeWalk AI suggests returning to the safer route or recalculating from your current location.",
    [
      {
        text: "Return to Route",
        style: "cancel",
      },
      {
        text: "Reroute",
        onPress: () =>
          handleRerouteFromCurrentLocation(
            location,
            "You moved away from the recommended route."
          ),
      },
    ]
  );
}

      const nearbyHighRisk = route.nearbyReports.find(
        (report) => report.aiRiskScore >= 70
      );

      if (nearbyHighRisk && nearest.nearestDistance < 120) {
        // We keep this simple for now to avoid repeated alerts.
        console.log("High-risk report near route:", nearbyHighRisk);
      }
    },
    [route, offRouteWarningShown, handleRerouteFromCurrentLocation]
  );

  const handleShareLiveSession = async () => {
  if (!activeShare?.shareToken) {
    Alert.alert(
      "No Live Share",
      "Start Walk Home first to create a live monitoring session."
    );
    return;
  }

  const message = `SafeWalk AI Live Location

${activeShare.ownerName} is sharing their live Walk Home movement.

Destination: ${activeShare.destinationName || "Not specified"}
Risk Level: ${activeShare.routeRiskLevel.toUpperCase()}
Share Token: ${activeShare.shareToken}

Open SafeWalk AI and use this token to monitor:
${activeShare.shareToken}`;

  try {
    await Share.share({
      message,
    });
  } catch (error) {
    Alert.alert("Share Failed", "Could not open the share menu.");
  }
};

const handleEscalateToSOS = async (reason: string) => {
  if (!activeShare?.shareToken) {
    Alert.alert(
      "No Active Live Share",
      "Start Walk Home first before escalating to SOS."
    );
    return;
  }

  try {
    setEscalatingSOS(true);

    await escalateLiveShareToSOSApi(activeShare.shareToken, reason);

    Alert.alert(
      "SOS Escalated",
      "SafeWalk AI has created an SOS alert from your live monitoring session."
    );
  } catch (error) {
    console.log("SOS escalation failed:", error);

    Alert.alert(
      "SOS Escalation Failed",
      "Could not create SOS alert. Check that your backend is running."
    );
  } finally {
    setEscalatingSOS(false);
  }
};

const startSafetyCheckCountdown = (riskMessage: string) => {
  if (!activeShare?.shareToken) return;

  if (sosEscalationTimerRef.current) {
    return;
  }

  Alert.alert(
    "Safety Check Required",
    `${riskMessage}\n\nPlease confirm that you are safe.`,
    [
      {
        text: "I Am Safe",
        onPress: async () => {
          if (sosEscalationTimerRef.current) {
            clearTimeout(sosEscalationTimerRef.current);
            sosEscalationTimerRef.current = null;
          }

          await handleSafeCheckIn();
        },
      },
      {
        text: "Send SOS",
        style: "destructive",
        onPress: () => {
          if (sosEscalationTimerRef.current) {
            clearTimeout(sosEscalationTimerRef.current);
            sosEscalationTimerRef.current = null;
          }

          handleEscalateToSOS("User manually escalated SOS from danger area.");
        },
      },
      {
        text: "Remind Me",
        style: "cancel",
      },
    ]
  );

  sosEscalationTimerRef.current = setTimeout(() => {
    sosEscalationTimerRef.current = null;

    handleEscalateToSOS(
      "User missed safety check-in after entering a high-risk area."
    );
  }, 60000);
};

const checkCurrentAreaRisk = useCallback(
  async (coordinate: MapCoordinate) => {
    const now = Date.now();

    // Avoid calling backend every second.
    if (now - lastRiskCheckRef.current < 12000) {
      return;
    }

    lastRiskCheckRef.current = now;

    try {
      const risk = await checkLocationRiskApi({
        location: coordinate,
        radiusMeters: 220,
        selectedHour: new Date().getHours(),
      });

      setCurrentAreaRisk(risk);

      if (
        (risk.riskLevel === "high" || risk.riskLevel === "critical") &&
        !dangerAreaWarningShown
      ) {
        setDangerAreaWarningShown(true);

        const warningMessage =
  risk.warnings[0] || "A risky area was detected nearby.";

Alert.alert(
  "Danger Area Warning",
  `${warningMessage}\n\nSafeWalk AI recommends staying on the safer route and avoiding isolated shortcuts.`
);

startSafetyCheckCountdown(warningMessage);
      }

      if (risk.riskLevel === "low") {
        setDangerAreaWarningShown(false);
      }
    } catch (error) {
      console.log("Location risk check failed:", error);
    }
  },
  [dangerAreaWarningShown]
);

 const handleStartTracking = async () => {
  if (!route) {
    Alert.alert("No Route", "Calculate a route first.");
    return;
  }

  if (!userLocation) {
    Alert.alert(
      "Missing Location",
      "Tap the locate button first so SafeWalk AI can know where you are."
    );
    return;
  }

  try {
    setCreatingShare(true);

    const liveShare = await createLiveShareSessionApi({
      ownerName: "SafeWalk User",
      friendName,
      friendPhone,
      mode: "walk_home",
      destinationName: destinationName || "Selected destination",
      destinationLocation: destination
        ? {
            latitude: destination.latitude,
            longitude: destination.longitude,
            timestamp: new Date().toISOString(),
          }
        : null,
      currentLocation: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: new Date().toISOString(),
      },
      routeRiskLevel: route.riskLevel,
      routeRiskScore: route.riskScore,
      expectedArrivalAt: null,
    });

    setActiveShare(liveShare);

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Location Permission Needed",
        "SafeWalk AI needs location access to monitor your route."
      );
      return;
    }

    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
    }

    setIsTracking(true);

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 3000,
      },
      (position) => {
        const coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(coordinate);
        updatePassedAndRemainingRoute(coordinate);

        checkCurrentAreaRisk(coordinate);

        updateLiveShareLocationApi(liveShare.shareToken, {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        }).catch((error) => {
          console.log("Live location update failed:", error);
        });

        mapRef.current?.animateCamera(
          {
            center: coordinate,
            zoom: 17,
          },
          {
            duration: 600,
          }
        );
      }
    );

    locationSubscriptionRef.current = subscription;

    bottomSheetRef.current?.snapToIndex(0);

    Alert.alert(
      "Walk Home Started",
      `Live monitoring is active.\n\nShare Token:\n${liveShare.shareToken}`,
      [
        {
          text: "Share Now",
          onPress: handleShareLiveSession,
        },
        {
          text: "OK",
        },
      ]
    );
  } catch (error) {
    console.log("Live share start failed:", error);

    Alert.alert(
      "Live Share Failed",
      "Could not create live sharing session. Check that your backend is running."
    );
  } finally {
    setCreatingShare(false);
  }
};

  const handleStopTracking = async () => {
    if (sosEscalationTimerRef.current) {
  clearTimeout(sosEscalationTimerRef.current);
  sosEscalationTimerRef.current = null;
}
  locationSubscriptionRef.current?.remove();
  locationSubscriptionRef.current = null;
  setIsTracking(false);

  if (activeShare?.shareToken) {
    completeLiveShareSessionApi(activeShare.shareToken).catch((error) => {
      console.log("Complete live share failed:", error);
    });
  }

  clearActiveShare();
};

  const handleClearDestination = () => {
    setDestination(null);
    setDestinationName("");
    setSearchText("");
    setSuggestions([]);
    setRoute(null);
    setPassedRoute([]);
    setRemainingRoute([]);
    setIsTracking(false);
    setRerouteCount(0);
    handleStopTracking();
  };

  return (
    <View style={styles.container}>
      <LeafletMapView
  ref={mapRef}
  style={styles.map}
  center={userLocation ?? DEFAULT_REGION}
  zoom={15}
  userLocation={userLocation}
  destination={destination}
  passedRoute={passedRoute}
  remainingRoute={remainingRoute}
  riskColor={routeRiskColor}
  dangerMarkers={
    currentAreaRisk?.nearbyIncidents
      .filter((incident) => incident.location)
      .map((incident) => ({
        id: incident.id,
        title: incident.title || "Reported incident",
        description: `${incident.category} • ${incident.distanceMeters}m away`,
        latitude: incident.location!.latitude,
        longitude: incident.location!.longitude,
        riskLevel: currentAreaRisk.riskLevel,
      })) ?? []
  }
/>

      <View style={styles.topPanel}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ChevronLeft size={24} color={COLORS.text} />
          </Pressable>

          <View style={styles.searchBox}>
            <Search size={19} color={COLORS.mutedText} />

            <TextInput
              value={searchText}
              onChangeText={handleSearchChange}
              placeholder="Where are you going?"
              placeholderTextColor={COLORS.softText}
              style={styles.searchInput}
            />

            {searchText.length > 0 ? (
              <Pressable onPress={handleClearDestination}>
                <X size={18} color={COLORS.mutedText} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.suggestionsCard}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.placeId}
                onPress={() => handleSelectSuggestion(suggestion)}
                style={styles.suggestionItem}
              >
                <MapPin size={18} color={COLORS.primary} />

                <View style={styles.suggestionTextBox}>
                  <Text style={styles.suggestionMain}>
                    {suggestion.mainText || suggestion.description}
                  </Text>
                  <Text style={styles.suggestionSecondary}>
                    {suggestion.secondaryText}
                  </Text>
                </View>
              </Pressable>
            ))}

            {searching ? (
              <View style={styles.suggestionLoading}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={handleUseCurrentLocation}
        style={styles.locateButton}
      >
        <LocateFixed size={24} color={COLORS.primary} />
      </Pressable>

      <BottomSheet
  ref={bottomSheetRef}
  index={0}
  snapPoints={snapPoints}
  bottomInset={insets.bottom}
  backgroundStyle={styles.bottomSheetBackground}
  handleIndicatorStyle={styles.bottomSheetHandle}
>
        <BottomSheetScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={[
    styles.sheetContent,
    {
      paddingBottom: insets.bottom + SPACING.xxxl,
    },
  ]}
>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <Navigation size={25} color={COLORS.primary} />
            </View>

            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Safe Navigation</Text>
              <Text style={styles.sheetSubtitle}>
                Uber-style route monitoring for Walk Home
              </Text>
            </View>
          </View>

          <View style={styles.friendBox}>
  <Text style={styles.friendLabel}>Share with friend</Text>

  <TextInput
    value={friendName}
    onChangeText={setFriendName}
    placeholder="Friend name, e.g. Ama"
    placeholderTextColor={COLORS.softText}
    style={styles.friendInput}
  />

  <TextInput
    value={friendPhone}
    onChangeText={setFriendPhone}
    placeholder="Friend phone, optional"
    placeholderTextColor={COLORS.softText}
    keyboardType="phone-pad"
    style={styles.friendInput}
  />
</View>

          {destinationName ? (
            <View style={styles.destinationBox}>
              <MapPin size={18} color={COLORS.primary} />
              <Text style={styles.destinationText}>{destinationName}</Text>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Search size={20} color={COLORS.mutedText} />
              <Text style={styles.emptyText}>
                Search and select a destination to calculate a safe route.
              </Text>
            </View>
          )}

          {route ? (
            <>
              <View style={styles.routeStatsGrid}>
                <View style={styles.routeStat}>
                  <Clock size={18} color={COLORS.primary} />
                  <Text style={styles.routeStatValue}>
                    {formatGoogleDuration(route.duration)}
                  </Text>
                  <Text style={styles.routeStatLabel}>ETA</Text>
                </View>

                <View style={styles.routeStat}>
                  <Footprints size={18} color={COLORS.primary} />
                  <Text style={styles.routeStatValue}>
                    {formatDistance(route.distanceMeters)}
                  </Text>
                  <Text style={styles.routeStatLabel}>Distance</Text>
                </View>

                <View style={styles.routeStat}>
                  <ShieldAlert size={18} color={routeRiskColor} />
                  <Text style={[styles.routeStatValue, { color: routeRiskColor }]}>
                    {route.riskScore}/100
                  </Text>
                  <Text style={styles.routeStatLabel}>Risk</Text>
                </View>
              </View>

              <View style={styles.routeStat}>
  <Navigation size={18} color={COLORS.primary} />
  <Text style={styles.routeStatValue}>{rerouteCount}</Text>
  <Text style={styles.routeStatLabel}>Reroutes</Text>
</View>

              <View style={styles.riskBox}>
                <View style={styles.riskHeader}>
                  <ShieldCheck size={19} color={routeRiskColor} />
                  <Text style={[styles.riskTitle, { color: routeRiskColor }]}>
                    {route.riskLevel.toUpperCase()} RISK ROUTE
                  </Text>
                </View>

                {currentAreaRisk ? (
  <View style={styles.currentRiskBox}>
    <View style={styles.riskHeader}>
      <ShieldAlert
        size={19}
        color={getRiskColor(currentAreaRisk.riskScore)}
      />

      <Text
        style={[
          styles.riskTitle,
          { color: getRiskColor(currentAreaRisk.riskScore) },
        ]}
      >
        CURRENT AREA: {currentAreaRisk.riskLevel.toUpperCase()} RISK
      </Text>
    </View>

    <Text style={styles.currentRiskScore}>
      Score: {currentAreaRisk.riskScore}/100 • Nearby reports:{" "}
      {currentAreaRisk.nearbyIncidentCount}
    </Text>

    {currentAreaRisk.warnings.slice(0, 2).map((warning, index) => (
      <View key={index} style={styles.reasonRow}>
        <AlertTriangle
          size={14}
          color={getRiskColor(currentAreaRisk.riskScore)}
        />

        <Text style={styles.reasonText}>{warning}</Text>
      </View>
    ))}
  </View>
) : null}

                {route.reasons.slice(0, 3).map((reason, index) => (
                  <View key={index} style={styles.reasonRow}>
                    <AlertTriangle size={14} color={routeRiskColor} />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.actionArea}>
            <AppButton
              title={loadingRoute ? "Calculating..." : "Calculate Safe Route"}
              onPress={handleCalculateRoute}
              loading={loadingRoute}
              disabled={loadingRoute}
            />

            {route ? (
  <AppButton
    title={
      creatingShare
        ? "Starting Live Share..."
        : isTracking
          ? "Tracking Active"
          : "Start Walk Home"
    }
    onPress={handleStartTracking}
    variant={isTracking ? "secondary" : "primary"}
    disabled={isTracking || creatingShare}
    loading={creatingShare}
  />
) : null}

{route && userLocation ? (
  <AppButton
    title={rerouting ? "Rerouting..." : "Reroute From Here"}
    onPress={() =>
      handleRerouteFromCurrentLocation(
        userLocation,
        "Manual reroute requested."
      )
    }
    variant="secondary"
    loading={rerouting}
    disabled={rerouting}
  />
) : null}

{isTracking ? (
  <AppButton
    title="I Am Safe"
    onPress={handleSafeCheckIn}
    variant="secondary"
  />
) : null}

{isTracking ? (
  <AppButton
    title={escalatingSOS ? "Escalating SOS..." : "Escalate to SOS"}
    onPress={() =>
      handleEscalateToSOS("User manually escalated SOS from Walk Home.")
    }
    variant="secondary"
    loading={escalatingSOS}
    disabled={escalatingSOS}
  />
) : null}

{activeShare?.shareToken ? (
  <AppButton
    title="Share Live Token"
    onPress={handleShareLiveSession}
    variant="secondary"
  />
) : null}

            {isTracking ? (
              <AppButton
                title="Stop Tracking"
                onPress={handleStopTracking}
                variant="ghost"
              />
            ) : null}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  map: {
    flex: 1,
  },

  topPanel: {
    position: "absolute",
    top: 52,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  iconButton: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  searchBox: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: "700",
  },

  suggestionsCard: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.soft,
  },

  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  suggestionTextBox: {
    flex: 1,
  },

  suggestionMain: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  suggestionSecondary: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.mutedText,
  },

  suggestionLoading: {
    padding: SPACING.md,
  },

  locateButton: {
    position: "absolute",
    right: SPACING.lg,
    bottom: 255,
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  userMarkerOuter: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(37, 99, 235, 0.20)",
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.info,
  },

  destinationMarker: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  bottomSheetBackground: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  bottomSheetHandle: {
    backgroundColor: COLORS.border,
    width: 46,
  },

  sheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  sheetIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetHeaderText: {
    flex: 1,
  },

  sheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  sheetSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  destinationBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  destinationText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  emptyBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  emptyText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 20,
  },

  routeStatsGrid: {
    marginTop: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  routeStat: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
  },

  routeStatValue: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  routeStatLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    color: COLORS.mutedText,
    textTransform: "uppercase",
  },

  riskBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  riskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  riskTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },

  reasonText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: "700",
    lineHeight: 18,
  },

  actionArea: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  friendBox: {
  backgroundColor: COLORS.surfaceMuted,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  marginBottom: SPACING.md,
  gap: SPACING.sm,
},

friendLabel: {
  fontSize: FONT_SIZE.xs,
  fontWeight: "900",
  color: COLORS.mutedText,
  textTransform: "uppercase",
},

friendInput: {
  backgroundColor: COLORS.surface,
  borderRadius: RADIUS.md,
  borderWidth: 1,
  borderColor: COLORS.border,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.sm,
  fontSize: FONT_SIZE.sm,
  fontWeight: "700",
  color: COLORS.text,
},
currentRiskBox: {
  marginTop: SPACING.md,
  backgroundColor: COLORS.surfaceMuted,
  borderRadius: RADIUS.lg,
  padding: SPACING.md,
  borderWidth: 1,
  borderColor: COLORS.border,
},

currentRiskScore: {
  fontSize: FONT_SIZE.xs,
  color: COLORS.mutedText,
  fontWeight: "800",
  marginBottom: SPACING.xs,
},
});