import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { LeafletMapView } from "../components/LeafletMapView";
import { COLORS, FONT_SIZE, RADIUS, SPACING } from "../constants/theme";

const KNUST = {
  latitude: 6.6745,
  longitude: -1.5716,
};

const AYEDUASE = {
  latitude: 6.6891,
  longitude: -1.5662,
};

export default function MapTestScreen() {
  return (
    <View style={styles.container}>
      <LeafletMapView
        style={styles.map}
        center={KNUST}
        zoom={14}
        userLocation={KNUST}
        destination={AYEDUASE}
        remainingRoute={[KNUST, AYEDUASE]}
        riskColor={COLORS.primary}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.titleBox}>
          <Text style={styles.title}>OpenStreetMap Test</Text>
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

  map: {
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