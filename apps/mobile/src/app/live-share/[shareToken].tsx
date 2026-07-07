import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  Clock,
  Footprints,
  MapPin,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react-native";

import { Screen } from "../../components/Screen";
import { AppButton } from "../../components/AppButton";
import { LeafletMapView } from "../../components/LeafletMapView";
import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";
import { getLiveShareSessionApi } from "../../lib/liveShareApi";
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

export default function LiveShareMonitorScreen() {
  const params = useLocalSearchParams<{ shareToken: string }>();
  const shareToken = String(params.shareToken || "");

  const [session, setSession] = useState<LiveShareSession | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!shareToken) return;

    try {
      setLoading(true);
      const data = await getLiveShareSessionApi(shareToken);
      setSession(data);
    } catch (error) {
      Alert.alert(
        "Live Share Not Found",
        "Could not load this live sharing session."
      );
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useFocusEffect(
    useCallback(() => {
      fetchSession();

      const interval = setInterval(() => {
        fetchSession();
      }, 5000);

      return () => clearInterval(interval);
    }, [fetchSession])
  );

  const currentLocation = session?.currentLocation;
  const destinationLocation = session?.destinationLocation;

  const pathCoordinates =
    session?.locationUpdates.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
    })) ?? [];

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

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Live Monitor</Text>
          <Text style={styles.headerSubtitle}>
            Tracking token: {shareToken ? `${shareToken.slice(0, 8)}...` : "None"}
          </Text>
        </View>

        <Pressable onPress={fetchSession} style={styles.refreshButton}>
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
          riskColor={COLORS.primary}
        />
      </View>

      {session ? (
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <Footprints size={25} color={COLORS.primary} />
            </View>

            <View style={styles.statusTextBox}>
              <Text style={styles.statusTitle}>
                {session.ownerName} is sharing location
              </Text>
              <Text style={styles.statusSubtitle}>
                Status: {session.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={17} color={COLORS.mutedText} />
            <Text style={styles.infoText}>
              Destination: {session.destinationName || "Not specified"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={17} color={COLORS.mutedText} />
            <Text style={styles.infoText}>
              Last check-in: {formatDateTime(session.lastCheckInAt)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={17} color={COLORS.mutedText} />
            <Text style={styles.infoText}>
              Last updated: {formatDateTime(session.updatedAt)}
            </Text>
          </View>

          <View style={styles.riskBox}>
            <ShieldAlert
              size={19}
              color={getRiskColor(session.routeRiskScore)}
            />
            <Text
              style={[
                styles.riskText,
                { color: getRiskColor(session.routeRiskScore) },
              ]}
            >
              Risk: {session.routeRiskLevel.toUpperCase()} • Score{" "}
              {session.routeRiskScore}/100
            </Text>
          </View>

          {session.lastCheckInStatus === "safe" ? (
            <View style={styles.safeBox}>
              <ShieldCheck size={19} color={COLORS.primary} />
              <Text style={styles.safeText}>
                Latest check-in says the student is safe.
              </Text>
            </View>
          ) : null}

          <AppButton
            title="Refresh Location"
            onPress={fetchSession}
            style={styles.refreshAction}
          />
        </View>
      ) : (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading live share session...</Text>
        </View>
      )}
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

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  mapCard: {
    height: 360,
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

  statusCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  statusTextBox: {
    flex: 1,
  },

  statusTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  statusSubtitle: {
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

  safeBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  safeText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  refreshAction: {
    marginTop: SPACING.lg,
  },

  loadingCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    fontWeight: "700",
  },
});