import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  ChevronLeft,
  Clock,
  Footprints,
  MapPin,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { AppButton } from "../../components/AppButton";
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

export default function AdminLiveSharesScreen() {
  const [sessions, setSessions] = useState<LiveShareSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<LiveShareSession | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLiveShareSessionsApi("active");

      setSessions(data);

      if (!selectedSession && data.length > 0) {
        setSelectedSession(data[0]);
      }

      if (selectedSession) {
        const updatedSelected = data.find(
          (item) => item.shareToken === selectedSession.shareToken
        );

        if (updatedSelected) {
          setSelectedSession(updatedSelected);
        }
      }
    } catch (error) {
      Alert.alert(
        "Live Shares Error",
        "Could not load active live sharing sessions."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();

      const interval = setInterval(() => {
        fetchSessions();
      }, 5000);

      return () => clearInterval(interval);
    }, [fetchSessions])
  );

  const currentLocation = selectedSession?.currentLocation;
  const destinationLocation = selectedSession?.destinationLocation;

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
    selectedSession?.locationUpdates.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
    })) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Live Monitoring</Text>
          <Text style={styles.headerSubtitle}>
            Active Walk Home sessions: {sessions.length}
          </Text>
        </View>

        <Pressable onPress={fetchSessions} style={styles.refreshButton}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <RefreshCcw size={19} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <LeafletMapView
          style={styles.map}
          center={mapCenter}
          zoom={15}
          userLocation={currentLocation}
          destination={destination}
          remainingRoute={pathCoordinates}
          riskColor={
            selectedSession
              ? getRiskColor(selectedSession.routeRiskScore)
              : COLORS.primary
          }
        />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentInner}
      >
        {selectedSession ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedIcon}>
                <Footprints size={25} color={COLORS.primary} />
              </View>

              <View style={styles.selectedTextBox}>
                <Text style={styles.selectedTitle}>
                  {selectedSession.ownerName}
                </Text>
                <Text style={styles.selectedSubtitle}>
                  {selectedSession.mode.replace("_", " ").toUpperCase()} •{" "}
                  {selectedSession.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MapPin size={17} color={COLORS.mutedText} />
              <Text style={styles.infoText}>
                Destination: {selectedSession.destinationName || "Not specified"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Clock size={17} color={COLORS.mutedText} />
              <Text style={styles.infoText}>
                Last updated: {formatDateTime(selectedSession.updatedAt)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <ShieldCheck size={17} color={COLORS.mutedText} />
              <Text style={styles.infoText}>
                Last check-in: {formatDateTime(selectedSession.lastCheckInAt)}
              </Text>
            </View>

            <View style={styles.riskBox}>
              <ShieldAlert
                size={19}
                color={getRiskColor(selectedSession.routeRiskScore)}
              />
              <Text
                style={[
                  styles.riskText,
                  { color: getRiskColor(selectedSession.routeRiskScore) },
                ]}
              >
                Risk: {selectedSession.routeRiskLevel.toUpperCase()} • Score{" "}
                {selectedSession.routeRiskScore}/100
              </Text>
            </View>

            <AppButton
              title="Open Full Monitor"
              onPress={() =>
                router.push(`/live-share/${selectedSession.shareToken}`)
              }
              style={styles.openButton}
            />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <ShieldCheck size={36} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No Active Live Shares</Text>
            <Text style={styles.emptyText}>
              Active Walk Home sessions will appear here when students start live monitoring.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Active Sessions</Text>

        {sessions.map((session) => {
          const isSelected = selectedSession?.shareToken === session.shareToken;

          return (
            <Pressable
              key={session.shareToken}
              onPress={() => setSelectedSession(session)}
              style={[
                styles.sessionCard,
                isSelected && styles.sessionCardActive,
              ]}
            >
              <View style={styles.sessionIcon}>
                <UserRound
                  size={22}
                  color={isSelected ? COLORS.white : COLORS.primary}
                />
              </View>

              <View style={styles.sessionContent}>
                <Text
                  style={[
                    styles.sessionTitle,
                    isSelected && styles.sessionTitleActive,
                  ]}
                >
                  {session.ownerName}
                </Text>

                <Text
                  style={[
                    styles.sessionText,
                    isSelected && styles.sessionTextActive,
                  ]}
                >
                  {session.destinationName || "No destination"} •{" "}
                  {session.routeRiskLevel.toUpperCase()} risk
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 52,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
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

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  mapCard: {
    height: 300,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  map: {
    flex: 1,
  },

  content: {
    flex: 1,
    marginTop: SPACING.lg,
  },

  contentInner: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  selectedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  selectedIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedTextBox: {
    flex: 1,
  },

  selectedTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  selectedSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "800",
  },

  infoRow: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  riskBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
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

  openButton: {
    marginTop: SPACING.lg,
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
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

  sectionTitle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
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
    marginBottom: SPACING.md,
  },

  sessionCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  sessionIcon: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  sessionContent: {
    flex: 1,
  },

  sessionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  sessionTitleActive: {
    color: COLORS.white,
  },

  sessionText: {
    marginTop: 2,
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