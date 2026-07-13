import * as Speech from "expo-speech";

type RiskLevel = "low" | "medium" | "high" | "critical";

const lastSpokenAt: Record<string, number> = {};

const DEFAULT_OPTIONS = {
  language: "en-US",
  pitch: 1.0,
  rate: 0.9,
};

function canSpeak(key: string, cooldownMs: number) {
  const now = Date.now();
  const lastTime = lastSpokenAt[key] ?? 0;

  if (now - lastTime < cooldownMs) {
    return false;
  }

  lastSpokenAt[key] = now;
  return true;
}

export function speakSafeWalk(
  message: string,
  key = "general",
  cooldownMs = 8000
) {
  if (!message.trim()) return;

  if (!canSpeak(key, cooldownMs)) {
    return;
  }

  try {
    Speech.stop();

    Speech.speak(message, {
      ...DEFAULT_OPTIONS,
    });
  } catch (error) {
    console.log("SafeWalk voice error:", error);
  }
}

export function stopSafeWalkVoice() {
  try {
    Speech.stop();
  } catch (error) {
    console.log("Stop SafeWalk voice error:", error);
  }
}

export function speakRouteReady(
  riskLevel: RiskLevel,
  distanceText: string,
  etaText: string
) {
  speakSafeWalk(
    `Safe route calculated. Estimated time is ${etaText}. Distance is ${distanceText}. Route risk level is ${riskLevel}.`,
    "route-ready",
    5000
  );
}

export function speakWalkHomeStarted() {
  speakSafeWalk(
    "Walk Home has started. SafeWalk AI is now monitoring your route and live location.",
    "walk-home-started",
    6000
  );
}

export function speakDangerZone(riskLevel: RiskLevel, warning: string) {
  const intro =
    riskLevel === "critical"
      ? "Critical danger warning."
      : riskLevel === "high"
        ? "Danger zone warning."
        : "Safety warning.";

  speakSafeWalk(
    `${intro} ${warning}. Please stay alert, avoid isolated shortcuts, and remain on the safer route.`,
    `danger-zone-${riskLevel}`,
    20000
  );
}

export function speakOffRouteWarning() {
  speakSafeWalk(
    "You are moving away from the recommended safe route. Please return to the route, or tap reroute from here.",
    "off-route",
    15000
  );
}

export function speakRerouteReady() {
  speakSafeWalk(
    "Route updated. SafeWalk AI has calculated a new safer route from your current location.",
    "reroute-ready",
    6000
  );
}

export function speakSafeCheckIn() {
  speakSafeWalk(
    "Safety check-in sent. Your trusted contact can now see that you are safe.",
    "safe-check-in",
    5000
  );
}

export function speakSOSEscalated() {
  speakSafeWalk(
    "SOS alert has been created. SafeWalk AI has escalated this live monitoring session for emergency attention.",
    "sos-escalated",
    8000
  );
}

export function speakDestinationSelected(destinationName: string) {
  speakSafeWalk(
    `Destination selected. ${destinationName}. You can now calculate a safe route.`,
    "destination-selected",
    5000
  );
}