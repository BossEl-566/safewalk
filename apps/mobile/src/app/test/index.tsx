import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { ChevronLeft } from "lucide-react-native";

import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../../constants/theme";

const KNUST_LOCATION = {
  latitude: 6.6745,
  longitude: -1.5716,
};

const AYEDUASE_LOCATION = {
  latitude: 6.6891,
  longitude: -1.5662,
};

export default function MapTestScreen() {
  const cameraPosition = {
    coordinates: KNUST_LOCATION,
    zoom: 14,
  };

  const markers = [
    {
      id: "knust",
      coordinates: KNUST_LOCATION,
      title: "KNUST Area",
      snippet: "SafeWalk AI map test",
    },
    {
      id: "ayeduase",
      coordinates: AYEDUASE_LOCATION,
      title: "Ayeduase",
      snippet: "Destination test marker",
    },
  ];

  const polylines = [
    {
      id: "test-route",
      coordinates: [KNUST_LOCATION, AYEDUASE_LOCATION],
      color: "#059669",
      width: 10,
    },
  ];

  return (
    <View style={styles.container}>
      {Platform.OS === "android" ? (
        <GoogleMaps.View
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          markers={markers}
          polylines={polylines}
          properties={{
            isMyLocationEnabled: true,
            isTrafficEnabled: false,
            isBuildingEnabled: true,
            isIndoorEnabled: true,
          }}
          uiSettings={{
            compassEnabled: true,
            myLocationButtonEnabled: true,
            zoomControlsEnabled: true,
          }}
          onMapLoaded={() => {
            console.log("Expo Google Map loaded successfully");
          }}
        />
      ) : (
        <AppleMaps.View
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          markers={markers}
          polylines={polylines}
        />
      )}

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.titleBox}>
          <Text style={styles.title}>Expo Maps Test</Text>
          <Text style={styles.subtitle}>KNUST → Ayeduase</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    position: "absolute",
    top: 52,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  titleBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: "900",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.mutedText,
  },
});