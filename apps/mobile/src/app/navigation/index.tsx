import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  Copy,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react-native";

import {
  LeafletMapView,
  LeafletMapViewRef,
} from "../../components/LeafletMapView";
import { AppButton } from "../../components/AppButton";
import { SafetyCheckInModal } from "../../components/SafetyCheckInModal";
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
import {
  createLiveShareSessionApi,
  updateLiveShareLocationApi,
  checkInLiveShareSessionApi,
  completeLiveShareSessionApi,
  escalateLiveShareToSOSApi,
} from "../../lib/liveShareApi";
import { checkLocationRiskApi } from "../../lib/riskApi";
import { useLiveShareStore } from "../../store/liveShareStore";
import {
  MapCoordinate,
  RouteDecisionExplanation,
  SafeNavigationRoute,
} from "../../types/navigation";
import { PlaceSuggestion } from "../../types/place";
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

function formatDistanceCovered(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(meters)} m`;
}

function calculatePolylineDistance(points: MapCoordinate[]) {
  if (points.length < 2) return 0;

  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    total += getDistanceMeters(points[index - 1], points[index]);
  }

  return total;
}

export default function NavigationScreen() {
  const insets = useSafeAreaInsets();

  const activeShare = useLiveShareStore((state) => state.activeShare);
  const setActiveShare = useLiveShareStore((state) => state.setActiveShare);
  const clearActiveShare = useLiveShareStore((state) => state.clearActiveShare);

  const mapRef = useRef<LeafletMapViewRef | null>(null);
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null
  );
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sosEscalationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const checkInIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkInCountdownRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastRiskCheckRef = useRef(0);

  const snapPoints = useMemo(() => ["24%", "58%", "90%"], []);

  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [destination, setDestination] = useState<MapCoordinate | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [searchText, setSearchText] = useState("");

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [route, setRoute] = useState<SafeNavigationRoute | null>(null);
  const [routeDecision, setRouteDecision] =
    useState<RouteDecisionExplanation | null>(null);

  const [passedRoute, setPassedRoute] = useState<MapCoordinate[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<MapCoordinate[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  const [friendName, setFriendName] = useState("");
  const [friendPhone, setFriendPhone] = useState("");
  const [creatingShare, setCreatingShare] = useState(false);
  const [escalatingSOS, setEscalatingSOS] = useState(false);

  const [rerouting, setRerouting] = useState(false);
  const [rerouteCount, setRerouteCount] = useState(0);
  const [offRouteWarningShown, setOffRouteWarningShown] = useState(false);

  const [demoWalking, setDemoWalking] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);

  const [currentAreaRisk, setCurrentAreaRisk] =
    useState<LocationRiskResult | null>(null);
  const [dangerAreaWarningShown, setDangerAreaWarningShown] = useState(false);

  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkInCountdown, setCheckInCountdown] = useState(60);
  const [distanceCoveredMeters, setDistanceCoveredMeters] = useState(0);

  const routeRiskColor = route ? getRiskColor(route.riskScore) : COLORS.primary;

  const focusMapOnPoints = useCallback((points: MapCoordinate[]) => {
    if (!mapRef.current || points.length === 0) return;

    mapRef.current.fitToCoordinates(points);
  }, []);

  const clearCheckInTimers = () => {
    if (checkInIntervalRef.current) {
      clearInterval(checkInIntervalRef.current);
      checkInIntervalRef.current = null;
    }

    if (checkInCountdownRef.current) {
      clearInterval(checkInCountdownRef.current);
      checkInCountdownRef.current = null;
    }
  };

  const closeCheckInModal = () => {
    setCheckInModalVisible(false);

    if (checkInCountdownRef.current) {
      clearInterval(checkInCountdownRef.current);
      checkInCountdownRef.current = null;
    }

    setCheckInCountdown(60);
  };

  useEffect(() => {
    return () => {
      clearCheckInTimers();

      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }

      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }

      if (sosEscalationTimerRef.current) {
        clearTimeout(sosEscalationTimerRef.current);
        sosEscalationTimerRef.current = null;
      }
    };
  }, []);

  const handleCopyLiveToken = async () => {
    if (!activeShare?.shareToken) {
      Alert.alert("No Token", "Start Walk Home first to create a live token.");
      return;
    }

    await Clipboard.setStringAsync(activeShare.shareToken);

    Alert.alert(
      "Token Copied",
      "The live share token has been copied. Your friend can paste it in Monitor Friend."
    );
  };

  const handleShareLiveSession = async (shareOverride?: any) => {
    const shareSession = shareOverride ?? activeShare;

    if (!shareSession?.shareToken) {
      Alert.alert(
        "No Live Share",
        "Start Walk Home first to create a live monitoring session."
      );
      return;
    }

    const message = `SafeWalk AI Live Location

${shareSession.ownerName} is sharing their live Walk Home movement.

Destination: ${shareSession.destinationName || "Not specified"}
Risk Level: ${shareSession.routeRiskLevel.toUpperCase()}
Share Token: ${shareSession.shareToken}

Open SafeWalk AI > Profile > Monitor Friend, then paste this token:
${shareSession.shareToken}`;

    try {
      await Share.share({
        message,
      });
    } catch (error) {
      Alert.alert("Share Failed", "Could not open the share menu.");
    }
  };

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

  const stopDemoWalk = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }

    setDemoWalking(false);
  };

  const handleSearchChange = async (value: string) => {
    setSearchText(value);
    setDestinationName(value);
    stopDemoWalk();
    setDemoStepIndex(0);
    setRoute(null);
    setPassedRoute([]);
    setRemainingRoute([]);
    setRerouteCount(0);
    setRouteDecision(null);

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
      Alert.alert(
        "Missing Destination",
        "Please search and select a destination."
      );
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
      setRouteDecision(result.decisionExplanation ?? null);
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
      setRouteDecision(result.decisionExplanation ?? null);
      setRerouteCount((count) => count + 1);

      focusMapOnPoints([currentLocation, destination, ...newRoute.coordinates]);

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
      setDistanceCoveredMeters(calculatePolylineDistance(passed));

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
        console.log("High-risk report near route:", nearbyHighRisk);
      }
    },
    [route, offRouteWarningShown, handleRerouteFromCurrentLocation]
  );

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

  const triggerSafetyCheckInPopup = () => {
    if (!isTracking || !activeShare?.shareToken) return;

    setCheckInCountdown(60);
    setCheckInModalVisible(true);

    if (checkInCountdownRef.current) {
      clearInterval(checkInCountdownRef.current);
    }

    checkInCountdownRef.current = setInterval(() => {
      setCheckInCountdown((current) => {
        if (current <= 1) {
          if (checkInCountdownRef.current) {
            clearInterval(checkInCountdownRef.current);
            checkInCountdownRef.current = null;
          }

          setCheckInModalVisible(false);

          handleEscalateToSOS(
            "User missed periodic safety check-in during Walk Home."
          );

          return 60;
        }

        return current - 1;
      });
    }, 1000);
  };

  const startPeriodicCheckIns = () => {
    if (checkInIntervalRef.current) {
      clearInterval(checkInIntervalRef.current);
    }

    checkInIntervalRef.current = setInterval(() => {
      triggerSafetyCheckInPopup();
    }, 30000);
  };

  const handleModalCheckIn = async () => {
    closeCheckInModal();
    await handleSafeCheckIn();
  };

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
      startPeriodicCheckIns();

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
            text: "Copy Token",
            onPress: async () => {
              await Clipboard.setStringAsync(liveShare.shareToken);
              Alert.alert("Copied", "Live share token copied.");
            },
          },
          {
            text: "Share Now",
            onPress: () => handleShareLiveSession(liveShare),
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

  const handleStartDemoWalk = async () => {
    if (!route?.coordinates.length) {
      Alert.alert("No Route", "Calculate a safe route first.");
      return;
    }

    if (demoWalking) {
      stopDemoWalk();
      return;
    }

    let liveShareToken = activeShare?.shareToken;

    try {
      if (!liveShareToken) {
        const startPoint = route.coordinates[0];

        const liveShare = await createLiveShareSessionApi({
          ownerName: "SafeWalk Demo User",
          friendName: friendName || "Supervisor",
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
            latitude: startPoint.latitude,
            longitude: startPoint.longitude,
            timestamp: new Date().toISOString(),
          },
          routeRiskLevel: route.riskLevel,
          routeRiskScore: route.riskScore,
          expectedArrivalAt: null,
        });

        setActiveShare(liveShare);
        liveShareToken = liveShare.shareToken;
      }

      setDemoWalking(true);
      setIsTracking(true);
      setDemoStepIndex(0);
      startPeriodicCheckIns();

      let index = 0;

      demoIntervalRef.current = setInterval(() => {
        const coordinate = route.coordinates[index];

        if (!coordinate) {
          stopDemoWalk();

          Alert.alert(
            "Demo Complete",
            "The simulated Walk Home movement has reached the destination."
          );

          return;
        }

        setUserLocation(coordinate);
        setDemoStepIndex(index);
        updatePassedAndRemainingRoute(coordinate);
        checkCurrentAreaRisk(coordinate);

        if (liveShareToken) {
          updateLiveShareLocationApi(liveShareToken, {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            timestamp: new Date().toISOString(),
          }).catch((error) => {
            console.log("Demo live location update failed:", error);
          });
        }

        mapRef.current?.animateCamera({
          center: coordinate,
          zoom: 17,
        });

        index += Math.max(1, Math.floor(route.coordinates.length / 40));
      }, 1500);

      Alert.alert(
        "Demo Walk Started",
        "SafeWalk AI is now simulating a student walking along the selected route."
      );
    } catch (error) {
      console.log("Demo walk failed:", error);

      Alert.alert(
        "Demo Failed",
        "Could not start demo walk. Check that your backend is running."
      );

      stopDemoWalk();
    }
  };

  const handleStopTracking = async () => {
    clearCheckInTimers();
    closeCheckInModal();
    stopDemoWalk();

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
    stopDemoWalk();
    setDemoStepIndex(0);
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

      <Pressable onPress={handleUseCurrentLocation} style={styles.locateButton}>
        <LocateFixed size={24} color={COLORS.primary} />
      </Pressable>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        bottomInset={insets.bottom}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.sheetContent,
            {
              paddingBottom: insets.bottom + 120,
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
                Search route, monitor movement, and share live location
              </Text>
            </View>
          </View>

          <View style={styles.friendBox}>
            <Text style={styles.friendLabel}>Live share contact</Text>

            <View style={styles.friendInputRow}>
              <TextInput
                value={friendName}
                onChangeText={setFriendName}
                placeholder="Friend name"
                placeholderTextColor={COLORS.softText}
                style={styles.friendInput}
              />

              <TextInput
                value={friendPhone}
                onChangeText={setFriendPhone}
                placeholder="Phone"
                placeholderTextColor={COLORS.softText}
                keyboardType="phone-pad"
                style={styles.friendInput}
              />
            </View>
          </View>

          {activeShare?.shareToken ? (
            <View style={styles.tokenBox}>
              <View style={styles.tokenHeader}>
                <View>
                  <Text style={styles.tokenLabel}>Live share token</Text>
                  <Text style={styles.tokenHelp}>
                    Give this token to your friend to monitor you.
                  </Text>
                </View>

                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              </View>

              <View style={styles.tokenValueRow}>
                <Text selectable numberOfLines={1} style={styles.tokenValue}>
                  {activeShare.shareToken}
                </Text>

                <Pressable onPress={handleCopyLiveToken} style={styles.copyButton}>
                  <Copy size={17} color={COLORS.white} />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => handleShareLiveSession()}
                style={styles.shareTokenButton}
              >
                <Share2 size={17} color={COLORS.primary} />
                <Text style={styles.shareTokenText}>Share token with friend</Text>
              </Pressable>
            </View>
          ) : null}

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
                  <Text
                    style={[styles.routeStatValue, { color: routeRiskColor }]}
                  >
                    {route.riskScore}/100
                  </Text>
                  <Text style={styles.routeStatLabel}>Risk</Text>
                </View>
              </View>

              <View style={styles.routeMiniStatsRow}>
                <View style={styles.routeMiniStat}>
                  <Footprints size={16} color={COLORS.primary} />
                  <Text style={styles.routeMiniValue}>
                    {route.coordinates.length
                      ? `${Math.min(
                          100,
                          Math.round(
                            (demoStepIndex / route.coordinates.length) * 100
                          )
                        )}%`
                      : "0%"}
                  </Text>
                  <Text style={styles.routeMiniLabel}>Demo progress</Text>
                </View>

                <View style={styles.routeMiniStat}>
                  <Navigation size={16} color={COLORS.primary} />
                  <Text style={styles.routeMiniValue}>{rerouteCount}</Text>
                  <Text style={styles.routeMiniLabel}>Reroutes</Text>
                </View>
              </View>

              <View style={styles.riskBox}>
                <View style={styles.riskHeader}>
                  <ShieldCheck size={19} color={routeRiskColor} />
                  <Text style={[styles.riskTitle, { color: routeRiskColor }]}>
                    {route.riskLevel.toUpperCase()} RISK ROUTE
                  </Text>
                </View>

                {route.reasons.slice(0, 3).map((reason, index) => (
                  <View key={index} style={styles.reasonRow}>
                    <AlertTriangle size={14} color={routeRiskColor} />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
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

              {routeDecision ? (
                <View style={styles.decisionBox}>
                  <Text style={styles.decisionTitle}>Why this route?</Text>

                  <Text style={styles.decisionSummary}>
                    {routeDecision.summary}
                  </Text>

                  {routeDecision.selectedReasons
                    .slice(0, 3)
                    .map((reason, index) => (
                      <View key={`reason-${index}`} style={styles.decisionRow}>
                        <ShieldCheck size={14} color={COLORS.primary} />
                        <Text style={styles.decisionText}>{reason}</Text>
                      </View>
                    ))}
                </View>
              ) : null}
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
              <View style={styles.actionGrid}>
                <Pressable onPress={handleStartDemoWalk} style={styles.actionChip}>
                  <Footprints size={17} color={COLORS.primary} />
                  <Text style={styles.actionChipText}>
                    {demoWalking ? "Stop Demo" : "Demo Walk"}
                  </Text>
                </Pressable>

                {userLocation ? (
                  <Pressable
                    onPress={() =>
                      handleRerouteFromCurrentLocation(
                        userLocation,
                        "Manual reroute requested."
                      )
                    }
                    style={styles.actionChip}
                    disabled={rerouting}
                  >
                    {rerouting ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Navigation size={17} color={COLORS.primary} />
                    )}
                    <Text style={styles.actionChipText}>Reroute</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

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

            {isTracking ? (
              <View style={styles.trackingActionsCard}>
                <Text style={styles.trackingActionsTitle}>
                  Tracking controls
                </Text>

                <View style={styles.actionGrid}>
                  <Pressable
                    onPress={handleSafeCheckIn}
                    style={styles.safeActionChip}
                  >
                    <ShieldCheck size={17} color={COLORS.primary} />
                    <Text style={styles.safeActionText}>I Am Safe</Text>
                  </Pressable>

                  <Pressable
                    onPress={triggerSafetyCheckInPopup}
                    style={styles.safeActionChip}
                  >
                    <Clock size={17} color={COLORS.primary} />
                    <Text style={styles.safeActionText}>Check-In</Text>
                  </Pressable>
                </View>

                <View style={styles.actionGrid}>
                  <Pressable
                    onPress={handleCopyLiveToken}
                    style={styles.safeActionChip}
                    disabled={!activeShare?.shareToken}
                  >
                    <Copy size={17} color={COLORS.primary} />
                    <Text style={styles.safeActionText}>Copy Token</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleShareLiveSession()}
                    style={styles.safeActionChip}
                    disabled={!activeShare?.shareToken}
                  >
                    <Share2 size={17} color={COLORS.primary} />
                    <Text style={styles.safeActionText}>Share</Text>
                  </Pressable>
                </View>

                <View style={styles.actionGrid}>
                  <Pressable
                    onPress={() =>
                      handleEscalateToSOS(
                        "User manually escalated SOS from Walk Home."
                      )
                    }
                    style={styles.sosActionChip}
                    disabled={escalatingSOS}
                  >
                    {escalatingSOS ? (
                      <ActivityIndicator size="small" color={COLORS.danger} />
                    ) : (
                      <ShieldAlert size={17} color={COLORS.danger} />
                    )}
                    <Text style={styles.sosActionText}>SOS</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleStopTracking}
                    style={styles.stopActionChip}
                  >
                    <X size={17} color={COLORS.mutedText} />
                    <Text style={styles.stopActionText}>Stop</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      <SafetyCheckInModal
        visible={checkInModalVisible}
        distanceCoveredText={formatDistanceCovered(distanceCoveredMeters)}
        etaText={route ? formatGoogleDuration(route.duration) : "Unknown"}
        countdownSeconds={checkInCountdown}
        riskLevel={currentAreaRisk?.riskLevel ?? route?.riskLevel ?? "low"}
        onCheckIn={handleModalCheckIn}
        onSendSOS={() =>
          handleEscalateToSOS(
            "User manually escalated SOS from safety check-in popup."
          )
        }
        onClose={closeCheckInModal}
      />
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
    bottom: 225,
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

  bottomSheetBackground: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  bottomSheetHandle: {
    backgroundColor: COLORS.border,
    width: 46,
  },

  sheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
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
    lineHeight: 18,
  },

  friendBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.xl,
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

  friendInputRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },

  friendInput: {
    flex: 1,
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

  tokenBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  tokenHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },

  tokenLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  tokenHelp: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primaryDark,
    lineHeight: 17,
  },

  livePill: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },

  liveText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primaryDark,
    textTransform: "uppercase",
  },

  tokenValueRow: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tokenValue: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  copyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  copyButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.white,
  },

  shareTokenButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  shareTokenText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.primaryDark,
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
    minHeight: 92,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
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

  routeMiniStatsRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  routeMiniStat: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  routeMiniValue: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  routeMiniLabel: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "800",
    color: COLORS.mutedText,
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
    flex: 1,
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

  decisionBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  decisionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  decisionSummary: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
    lineHeight: 18,
  },

  decisionRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },

  decisionText: {
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

  actionGrid: {
    flexDirection: "row",
    gap: SPACING.sm,
  },

  actionChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.16)",
  },

  actionChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  trackingActionsCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.md,
  },

  trackingActionsTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "900",
    color: COLORS.mutedText,
    textTransform: "uppercase",
  },

  safeActionChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  safeActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.primaryDark,
  },

  sosActionChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  sosActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.danger,
  },

  stopActionChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  stopActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.mutedText,
  },
});