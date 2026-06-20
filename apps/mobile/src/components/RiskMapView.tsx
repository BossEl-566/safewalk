import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { MapPin } from "lucide-react-native";

import { COLORS, FONT_SIZE, RADIUS, SHADOWS, SPACING } from "../constants/theme";
import { IncidentReport } from "../types/incident";

type RiskMapViewProps = {
  reports: IncidentReport[];
};

function getRiskColor(score: number) {
  if (score >= 85) return "#DC2626";
  if (score >= 70) return "#EF4444";
  if (score >= 40) return "#F59E0B";
  return "#059669";
}

function getRiskLabel(score: number) {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function createMapHtml(reports: IncidentReport[]) {
  const reportsWithLocation = reports
    .filter((report) => report.location?.latitude && report.location?.longitude)
    .map((report) => ({
      id: report.id,
      title: report.title,
      locationName: report.locationName || "Unknown location",
      description: report.description,
      latitude: report.location?.latitude,
      longitude: report.location?.longitude,
      aiRiskScore: report.aiRiskScore,
      riskColor: getRiskColor(report.aiRiskScore),
      riskLabel: getRiskLabel(report.aiRiskScore),
    }));

  const firstReport = reportsWithLocation[0];

  const centerLat = firstReport?.latitude ?? 6.6745;
  const centerLng = firstReport?.longitude ?? -1.5716;

  const markerData = JSON.stringify(reportsWithLocation).replace(
    /<\/script>/g,
    "<\\/script>"
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <style>
          html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #F8FAFC;
          }

          .risk-marker {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
          }

          .popup {
            font-family: Arial, sans-serif;
            max-width: 220px;
          }

          .popup-title {
            font-size: 15px;
            font-weight: 800;
            color: #0F172A;
            margin-bottom: 4px;
          }

          .popup-location {
            font-size: 12px;
            font-weight: 700;
            color: #64748B;
            margin-bottom: 8px;
          }

          .popup-risk {
            font-size: 12px;
            font-weight: 900;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          .popup-description {
            font-size: 12px;
            line-height: 17px;
            color: #334155;
            font-weight: 600;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script>
          const reports = ${markerData};

          const map = L.map("map", {
            zoomControl: true,
            attributionControl: true
          }).setView([${centerLat}, ${centerLng}], 15);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
          }).addTo(map);

          reports.forEach((report) => {
            if (!report.latitude || !report.longitude) return;

            const icon = L.divIcon({
              className: "",
              html: '<div class="risk-marker" style="background:' + report.riskColor + ';"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            const popupHtml =
              '<div class="popup">' +
                '<div class="popup-title">' + report.title + '</div>' +
                '<div class="popup-location">' + report.locationName + '</div>' +
                '<div class="popup-risk" style="color:' + report.riskColor + ';">' +
                  report.riskLabel + ' Risk • ' + report.aiRiskScore +
                '</div>' +
                '<div class="popup-description">' + report.description + '</div>' +
              '</div>';

            L.marker([report.latitude, report.longitude], { icon })
              .addTo(map)
              .bindPopup(popupHtml);
          });

          if (reports.length > 1) {
            const bounds = L.latLngBounds(
              reports.map((report) => [report.latitude, report.longitude])
            );

            map.fitBounds(bounds, {
              padding: [35, 35]
            });
          }
        </script>
      </body>
    </html>
  `;
}

export function RiskMapView({ reports }: RiskMapViewProps) {
  const reportsWithLocation = reports.filter(
    (report) => report.location?.latitude && report.location?.longitude
  );

  if (reportsWithLocation.length === 0) {
    return (
      <View style={styles.emptyMapCard}>
        <View style={styles.emptyIcon}>
          <MapPin size={28} color={COLORS.primary} />
        </View>

        <Text style={styles.emptyTitle}>No GPS markers yet</Text>
        <Text style={styles.emptyText}>
          Submit incident reports with location permission enabled to show
          danger-zone markers on the map.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapCard}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: createMapHtml(reportsWithLocation) }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={styles.webView}
      />

      <View style={styles.mapOverlay}>
        <Text style={styles.overlayTitle}>Live Risk Markers</Text>
        <Text style={styles.overlayText}>
          {reportsWithLocation.length} mapped incident
          {reportsWithLocation.length > 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    height: 360,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  webView: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  mapOverlay: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  overlayTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
    color: COLORS.text,
  },

  overlayText: {
    marginTop: 2,
    fontSize: FONT_SIZE.xs,
    color: COLORS.mutedText,
    fontWeight: "700",
  },

  emptyMapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },

  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "900",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.mutedText,
    textAlign: "center",
    lineHeight: 21,
  },
});