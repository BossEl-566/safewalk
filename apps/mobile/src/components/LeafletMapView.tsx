import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleProp, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

export type LeafletPoint = {
  latitude: number;
  longitude: number;
};

export type LeafletMapViewRef = {
  fitToCoordinates: (points: LeafletPoint[]) => void;
  animateToRegion: (
    region: LeafletPoint & {
      latitudeDelta?: number;
      longitudeDelta?: number;
    }
  ) => void;
  animateCamera: (
    camera: {
      center?: LeafletPoint;
      zoom?: number;
    },
    options?: {
      duration?: number;
    }
  ) => void;
};

type DangerMarker = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
};

type LeafletMapViewProps = {
  style?: StyleProp<ViewStyle>;
  center: LeafletPoint;
  zoom?: number;
  userLocation?: LeafletPoint | null;
  destination?: LeafletPoint | null;
  passedRoute?: LeafletPoint[];
  remainingRoute?: LeafletPoint[];
  dangerMarkers?: DangerMarker[];
  riskColor?: string;
};

function createMapHtml(initialPayload: unknown) {
  const payload = JSON.stringify(initialPayload);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #E5E7EB;
    }

    .safe-popup {
      font-family: Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    const initialPayload = ${payload};

    const map = L.map("map", {
      zoomControl: false,
      attributionControl: true
    }).setView(
      [initialPayload.center.latitude, initialPayload.center.longitude],
      initialPayload.zoom || 15
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    L.control.zoom({
      position: "bottomright"
    }).addTo(map);

    let userLayer = null;
    let destinationLayer = null;
    let passedRouteLayer = null;
    let remainingRouteLayer = null;
    let dangerLayer = L.layerGroup().addTo(map);

    function toLatLngArray(points) {
      return (points || []).map((point) => [
        point.latitude,
        point.longitude
      ]);
    }

    function riskMarkerColor(riskLevel) {
      if (riskLevel === "critical") return "#991B1B";
      if (riskLevel === "high") return "#DC2626";
      if (riskLevel === "medium") return "#F59E0B";
      return "#059669";
    }

    function clearLayer(layer) {
      if (layer) {
        map.removeLayer(layer);
      }
    }

    window.updateSafeWalkMap = function updateSafeWalkMap(data) {
      clearLayer(userLayer);
      clearLayer(destinationLayer);
      clearLayer(passedRouteLayer);
      clearLayer(remainingRouteLayer);
      dangerLayer.clearLayers();

      if (data.userLocation) {
        userLayer = L.circleMarker(
          [data.userLocation.latitude, data.userLocation.longitude],
          {
            radius: 9,
            color: "#FFFFFF",
            weight: 4,
            fillColor: "#2563EB",
            fillOpacity: 1
          }
        )
          .addTo(map)
          .bindPopup('<div class="safe-popup">You are here</div>');
      }

      if (data.destination) {
        destinationLayer = L.circleMarker(
          [data.destination.latitude, data.destination.longitude],
          {
            radius: 10,
            color: "#FFFFFF",
            weight: 4,
            fillColor: "#DC2626",
            fillOpacity: 1
          }
        )
          .addTo(map)
          .bindPopup('<div class="safe-popup">Destination</div>');
      }

      if (data.passedRoute && data.passedRoute.length > 1) {
        passedRouteLayer = L.polyline(toLatLngArray(data.passedRoute), {
          color: "#94A3B8",
          weight: 7,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map);
      }

      if (data.remainingRoute && data.remainingRoute.length > 1) {
        remainingRouteLayer = L.polyline(toLatLngArray(data.remainingRoute), {
          color: data.riskColor || "#059669",
          weight: 7,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map);
      }

      if (data.dangerMarkers && data.dangerMarkers.length > 0) {
        data.dangerMarkers.forEach((marker) => {
          L.circleMarker([marker.latitude, marker.longitude], {
            radius: 8,
            color: "#FFFFFF",
            weight: 3,
            fillColor: riskMarkerColor(marker.riskLevel),
            fillOpacity: 0.95
          })
            .addTo(dangerLayer)
            .bindPopup(
              '<div class="safe-popup">' +
                marker.title +
                '<br />' +
                (marker.description || "") +
              '</div>'
            );
        });
      }
    };

    window.fitToSafeWalkCoordinates = function fitToSafeWalkCoordinates(points) {
      if (!points || points.length === 0) return;

      const latLngs = points.map((point) => [
        point.latitude,
        point.longitude
      ]);

      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 17
      });
    };

    window.animateSafeWalkCamera = function animateSafeWalkCamera(camera) {
      if (!camera || !camera.center) return;

      map.setView(
        [camera.center.latitude, camera.center.longitude],
        camera.zoom || map.getZoom(),
        {
          animate: true
        }
      );
    };

    window.updateSafeWalkMap(initialPayload);
  </script>
</body>
</html>
`;
}

export const LeafletMapView = forwardRef<LeafletMapViewRef, LeafletMapViewProps>(
  function LeafletMapView(
    {
      style,
      center,
      zoom = 15,
      userLocation,
      destination,
      passedRoute = [],
      remainingRoute = [],
      dangerMarkers = [],
      riskColor = "#059669",
    },
    ref
  ) {
    const webViewRef = useRef<WebView | null>(null);

    const payload = useMemo(
      () => ({
        center,
        zoom,
        userLocation,
        destination,
        passedRoute,
        remainingRoute,
        dangerMarkers,
        riskColor,
      }),
      [
        center,
        zoom,
        userLocation,
        destination,
        passedRoute,
        remainingRoute,
        dangerMarkers,
        riskColor,
      ]
    );

    const html = useMemo(() => createMapHtml(payload), []);

    useEffect(() => {
      const js = `
        if (window.updateSafeWalkMap) {
          window.updateSafeWalkMap(${JSON.stringify(payload)});
        }
        true;
      `;

      webViewRef.current?.injectJavaScript(js);
    }, [payload]);

    useImperativeHandle(ref, () => ({
      fitToCoordinates: (points) => {
        const js = `
          if (window.fitToSafeWalkCoordinates) {
            window.fitToSafeWalkCoordinates(${JSON.stringify(points)});
          }
          true;
        `;

        webViewRef.current?.injectJavaScript(js);
      },

      animateToRegion: (region) => {
        const js = `
          if (window.animateSafeWalkCamera) {
            window.animateSafeWalkCamera({
              center: {
                latitude: ${region.latitude},
                longitude: ${region.longitude}
              },
              zoom: 16
            });
          }
          true;
        `;

        webViewRef.current?.injectJavaScript(js);
      },

      animateCamera: (camera) => {
        const js = `
          if (window.animateSafeWalkCamera) {
            window.animateSafeWalkCamera(${JSON.stringify(camera)});
          }
          true;
        `;

        webViewRef.current?.injectJavaScript(js);
      },
    }));

    return (
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={style}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowsInlineMediaPlayback
      />
    );
  }
);