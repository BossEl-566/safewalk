import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Clock,
  Copy,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCcw,
  Share2,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { LeafletMapView } from "../../components/LeafletMapView";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { getLiveShareSessionsApi } from "../../lib/liveShareApi";
import { LiveShareSession } from "../../types/liveShare";

const DEFAULT_LOCATION = {
  latitude: 6.6745,
  longitude: -1.5716,
};

function formatDateTime(value?: string | null) {
  if (!value) return "Not yet";

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRiskColor(score: number) {
  if (score >= 70) return COLORS.danger;
  if (score >= 40) return COLORS.warning;
  return COLORS.primary;
}

function getRiskLightColor(score: number) {
  if (score >= 70) return COLORS.dangerLight;
  if (score >= 40) return COLORS.warningLight;
  return COLORS.primaryLight;
}

function formatMode(value: string) {
  return value.replace("_", " ").toUpperCase();
}

function formatStatus(value: string) {
  return value.toUpperCase();
}

export default function AdminLiveSharesScreen() {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["30%", "62%", "90%"], []);

  const [sessions, setSessions] = useState<LiveShareSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<LiveShareSession | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getLiveShareSessionsApi("active");

      setSessions(data);

      setSelectedSession((current) => {
        if (!current) {
          return data[0] ?? null;
        }

        const updatedSelected = data.find(
          (item) => item.shareToken === current.shareToken
        );

        return updatedSelected ?? data[0] ?? null;
      });
    } catch (error) {
      Alert.alert(
        "Live Shares Error",
        "Could not load active live sharing sessions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();

      const interval = setInterval(() => {
        fetchSessions();
      }, 5000);

      return () => clearInterval(interval);
    }, [fetchSessions])
  );

  const currentLocation = selectedSession?.currentLocation ?? null;
  const destinationLocation = selectedSession?.destinationLocation ?? null;

  const mapCenter = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : DEFAULT_LOCATION;

  const destination = destinationLocation
    ? {
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
      }
    : null;

  const pathCoordinates =
    selectedSession?.locationUpdates?.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
    })) ?? [];

  const activeMarkers = sessions
    .filter((session) => session.currentLocation)
    .map((session) => ({
      id: session.shareToken,
      latitude: session.currentLocation!.latitude,
      longitude: session.currentLocation!.longitude,
      title: session.ownerName,
      description: `${session.destinationName || "No destination"} • ${session.routeRiskLevel.toUpperCase()} risk`,
      riskLevel: session.routeRiskLevel,
    }));

  const selectedRiskColor = selectedSession
    ? getRiskColor(selectedSession.routeRiskScore)
    : COLORS.primary;

  const selectedRiskLightColor = selectedSession
    ? getRiskLightColor(selectedSession.routeRiskScore)
    : COLORS.primaryLight;

  const handleCopyToken = async () => {
    if (!selectedSession?.shareToken) {
      Alert.alert("No Token", "No live share token is available.");
      return;
    }

    await Clipboard.setStringAsync(selectedSession.shareToken);

    Alert.alert(
      "Token Copied",
      "The live share token has been copied to your clipboard."
    );
  };

  const handleShareToken = async () => {
    if (!selectedSession?.shareToken) {
      Alert.alert("No Token", "No live share token is available.");
      return;
    }

    const message = `SafeWalk AI Live Monitoring

${selectedSession.ownerName} is sharing live movement.

Destination: ${selectedSession.destinationName || "Not specified"}
Risk Level: ${selectedSession.routeRiskLevel.toUpperCase()}
Share Token: ${selectedSession.shareToken}

Open SafeWalk AI > Profile > Monitor Friend, then paste this token:
${selectedSession.shareToken}`;

    try {
      await Share.share({ message });
    } catch {
      Alert.alert("Share Failed", "Could not open the share menu.");
    }
  };

  return (
    <View style={styles.container}>
      <LeafletMapView
        style={styles.map}
        center={mapCenter}
        zoom={15}
        userLocation={currentLocation}
        destination={destination}
        remainingRoute={pathCoordinates}
        riskColor={selectedRiskColor}
        dangerMarkers={activeMarkers as any}
      />

      <View style={styles.topPanel}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ChevronLeft size={24} color={COLORS.text} />
          </Pressable>

          <View style={styles.titleBox}>
            <Text style={styles.overline}>Admin live map</Text>
            <Text style={styles.headerTitle}>Live Monitoring</Text>
            <Text style={styles.headerSubtitle}>
              {sessions.length} active Walk Home session
              {sessions.length === 1 ? "" : "s"}
            </Text>
          </View>

          <Pressable onPress={fetchSessions} style={styles.iconButton}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <RefreshCcw size={20} color={COLORS.primary} />
            )}
          </Pressable>
        </View>
      </View>

      <Pressable onPress={fetchSessions} style={styles.locateButton}>
        <LocateFixed size={24} color={COLORS.primary} />
      </Pressable>

      <BottomSheet
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
              paddingBottom: insets.bottom + 120,
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIcon}>
              <Navigation size={25} color={COLORS.primary} />
            </View>

            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>Monitoring Center</Text>
              <Text style={styles.sheetSubtitle}>
                Track active live-share sessions in real time
              </Text>
            </View>
          </View>

          {selectedSession ? (
            <>
              <View style={styles.selectedCard}>
                <View style={styles.selectedHeader}>
                  <View style={styles.selectedIconOuter}>
                    <View style={styles.selectedIcon}>
                      <Footprints size={28} color={COLORS.primary} />
                    </View>
                  </View>

                  <View style={styles.selectedTextBox}>
                    <View style={styles.selectedTitleRow}>
                      <Text style={styles.selectedTitle}>
                        {selectedSession.ownerName}
                      </Text>

                      <View style={styles.livePill}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>Live</Text>
                      </View>
                    </View>

                    <Text style={styles.selectedSubtitle}>
                      {formatMode(selectedSession.mode)} •{" "}
                      {formatStatus(selectedSession.status)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.riskBox,
                    { backgroundColor: selectedRiskLightColor },
                  ]}
                >
                  <ShieldAlert size={19} color={selectedRiskColor} />

                  <Text style={[styles.riskText, { color: selectedRiskColor }]}>
                    {selectedSession.routeRiskLevel.toUpperCase()} RISK • Score{" "}
                    {selectedSession.routeRiskScore}/100
                  </Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <MapPin size={18} color={COLORS.primary} />
                    <Text style={styles.infoValue}>
                      {selectedSession.destinationName || "No destination"}
                    </Text>
                    <Text style={styles.infoLabel}>Destination</Text>
                  </View>

                  <View style={styles.infoCard}>
                    <Clock size={18} color={COLORS.primary} />
                    <Text style={styles.infoValue}>
                      {formatDateTime(selectedSession.updatedAt)}
                    </Text>
                    <Text style={styles.infoLabel}>Last update</Text>
                  </View>
                </View>

                <View style={styles.checkInBox}>
                  <ShieldCheck size={18} color={COLORS.primary} />
                  <Text style={styles.checkInText}>
                    Last check-in:{" "}
                    {formatDateTime(selectedSession.lastCheckInAt)}
                  </Text>
                </View>

                <View style={styles.tokenBox}>
                  <View style={styles.tokenHeader}>
                    <View>
                      <Text style={styles.tokenLabel}>Live share token</Text>
                      <Text style={styles.tokenHelp}>
                        Copy this token if another monitor needs to track this
                        student.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tokenValueRow}>
                    <Text selectable numberOfLines={1} style={styles.tokenValue}>
                      {selectedSession.shareToken}
                    </Text>

                    <Pressable
                      onPress={handleCopyToken}
                      style={styles.copyButton}
                    >
                      <Copy size={16} color={COLORS.white} />
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleShareToken}
                    style={styles.shareButton}
                  >
                    <Share2 size={17} color={COLORS.primary} />
                    <Text style={styles.shareButtonText}>Share token</Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() =>
                    router.push(`/live-share/${selectedSession.shareToken}`)
                  }
                  style={styles.primaryAction}
                >
                  <Navigation size={18} color={COLORS.white} />
                  <Text style={styles.primaryActionText}>
                    Open Full Monitor
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <ShieldCheck size={40} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>No Active Live Shares</Text>
              <Text style={styles.emptyText}>
                Active Walk Home sessions will appear here when students start
                live monitoring.
              </Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Active Sessions</Text>
              <Text style={styles.sectionSubtitle}>
                Tap a session to focus the map and view monitoring details.
              </Text>
            </View>
          </View>

          <View style={styles.sessionsList}>
            {sessions.map((session) => {
              const isSelected =
                selectedSession?.shareToken === session.shareToken;

              const riskColor = getRiskColor(session.routeRiskScore);
              const riskLightColor = getRiskLightColor(session.routeRiskScore);

              return (
                <Pressable
                  key={session.shareToken}
                  onPress={() => setSelectedSession(session)}
                  style={[
                    styles.sessionCard,
                    isSelected && styles.sessionCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.sessionIcon,
                      {
                        backgroundColor: isSelected
                          ? COLORS.white
                          : COLORS.primaryLight,
                      },
                    ]}
                  >
                    <UserRound
                      size={22}
                      color={isSelected ? COLORS.primary : COLORS.primary}
                    />
                  </View>

                  <View style={styles.sessionContent}>
                    <View style={styles.sessionTitleRow}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.sessionTitle,
                          isSelected && styles.sessionTitleActive,
                        ]}
                      >
                        {session.ownerName}
                      </Text>

                      <View
                        style={[
                          styles.sessionRiskPill,
                          {
                            backgroundColor: isSelected
                              ? "rgba(255,255,255,0.18)"
                              : riskLightColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sessionRiskText,
                            { color: isSelected ? COLORS.white : riskColor },
                          ]}
                        >
                          {session.routeRiskLevel.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.sessionText,
                        isSelected && styles.sessionTextActive,
                      ]}
                    >
                      {session.destinationName || "No destination"}
                    </Text>

                    <Text
                      style={[
                        styles.sessionMeta,
                        isSelected && styles.sessionTextActive,
                      ]}
                    >
                      Updated: {formatDateTime(session.updatedAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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

  titleBox: {
    flex: 1,
    minHeight: 58,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    ...SHADOWS.soft,
  },

  overline: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  headerTitle: {
    marginTop: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  locateButton: {
    position: "absolute",
    right: SPACING.lg,
    bottom: 235,
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

  selectedCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  selectedIconOuter: {
    width: 66,
    height: 66,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 150, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedTextBox: {
    flex: 1,
  },

  selectedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  selectedTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  selectedSubtitle: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  livePill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
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
    color: COLORS.primaryDark,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  riskBox: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  riskText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },

  infoGrid: {
    marginTop: SPACING.md,
    flexDirection: "row",
    gap: SPACING.sm,
  },

  infoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoValue: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    fontWeight: "900",
    lineHeight: 18,
  },

  infoLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  checkInBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  checkInText: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    color: COLORS.primaryDark,
    fontWeight: "800",
    lineHeight: 18,
  },

  tokenBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.18)",
  },

  tokenHeader: {
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
    color: COLORS.white,
    fontWeight: "900",
  },

  shareButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  shareButtonText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "900",
  },

  primaryAction: {
    marginTop: SPACING.md,
    minHeight: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryActionText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
    fontWeight: "700",
  },

  sectionHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },

  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
    lineHeight: 18,
  },

  sessionsList: {
    gap: SPACING.md,
  },

  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    ...SHADOWS.soft,
  },

  sessionCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  sessionIcon: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  sessionContent: {
    flex: 1,
  },

  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  sessionTitle: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  sessionTitleActive: {
    color: COLORS.white,
  },

  sessionRiskPill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },

  sessionRiskText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  sessionText: {
    marginTop: 3,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.mutedText,
  },

  sessionTextActive: {
    color: COLORS.white,
  },

  sessionMeta: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.softText,
  },
});