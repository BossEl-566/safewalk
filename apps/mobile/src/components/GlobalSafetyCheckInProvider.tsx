import { ReactNode, useEffect } from "react";
import { Alert } from "react-native";
import * as SMS from "expo-sms";
import { router } from "expo-router";

import { SafetyCheckInModal } from "./SafetyCheckInModal";
import { getCurrentLocation } from "../lib/location";
import { createSOSAlertApi } from "../lib/sosApi";
import { useContactStore } from "../store/contactStore";
import { useSOSStore } from "../store/sosStore";
import { useActiveTripStore } from "../store/activeTripStore";

type Props = {
  children: ReactNode;
};

function buildEmergencyMessage({
  destinationName,
  latitude,
  longitude,
}: {
  destinationName: string;
  latitude: number;
  longitude: number;
}) {
  const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return `EMERGENCY SOS from SafeWalk AI

The user may be in danger and needs urgent help.

Destination:
${destinationName}

Current location:
${mapLink}

Coordinates:
Latitude: ${latitude}
Longitude: ${longitude}

Please call or check on them immediately.`;
}

export function GlobalSafetyCheckInProvider({ children }: Props) {
  const contacts = useContactStore((state) => state.contacts);
  const createSOSAlert = useSOSStore((state) => state.createSOSAlert);

  const activeTrip = useActiveTripStore((state) => state.activeTrip);
  const checkInPopupVisible = useActiveTripStore(
    (state) => state.checkInPopupVisible
  );
  const secondsLeft = useActiveTripStore((state) => state.secondsLeft);

  const tick = useActiveTripStore((state) => state.tick);
  const markCheckIn = useActiveTripStore((state) => state.markCheckIn);
  const updateCurrentLocation = useActiveTripStore(
    (state) => state.updateCurrentLocation
  );
  const hideCheckInPopup = useActiveTripStore(
    (state) => state.hideCheckInPopup
  );

  useEffect(() => {
    tick();

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [tick]);

  const handleCheckIn = async () => {
    try {
      const location = await getCurrentLocation();

      updateCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      markCheckIn();

      Alert.alert(
        "Check-in Confirmed",
        "You are marked safe. SafeWalk AI will remind you again later."
      );
    } catch {
      markCheckIn();

      Alert.alert(
        "Check-in Confirmed",
        "You are marked safe, but your current GPS location could not be updated."
      );
    }
  };

  const handleSendSOS = async () => {
    if (!activeTrip) return;

    if (contacts.length === 0) {
      Alert.alert(
        "No Emergency Contacts",
        "Add at least one trusted contact before sending SOS."
      );
      return;
    }

    try {
      const location = await getCurrentLocation();

      const trustedPhones = contacts
        .map((contact) => contact.phone)
        .filter((phone) => phone && phone.trim().length > 0);

      const message = buildEmergencyMessage({
        destinationName: activeTrip.destinationName,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const alertId = createSOSAlert({
        userName: "SafeWalk User",
        location,
      });

      createSOSAlertApi({
        userName: "SafeWalk User",
        location,
        message,
        source: "walk_safe",
        trustedContactName: contacts[0]?.name ?? "",
        trustedContactPhone: contacts[0]?.phone ?? "",
      }).catch((error) => {
        console.log("SOS backend sync failed:", error);
      });

      const smsAvailable = await SMS.isAvailableAsync();

      if (smsAvailable && trustedPhones.length > 0) {
        await SMS.sendSMSAsync(trustedPhones, message);
      }

      hideCheckInPopup();

      router.push({
        pathname: "/sos/active",
        params: { alertId },
      });
    } catch (error) {
      Alert.alert(
        "SOS Error",
        error instanceof Error
          ? error.message
          : "Unable to send emergency alert."
      );
    }
  };

  return (
    <>
      {children}

      <SafetyCheckInModal
        visible={
          Boolean(activeTrip) &&
          activeTrip?.status === "active" &&
          checkInPopupVisible
        }
        distanceCoveredText={
          activeTrip
            ? `Destination: ${activeTrip.destinationName}`
            : "Active trip"
        }
        etaText={
          activeTrip?.expectedArrivalAt
            ? new Date(activeTrip.expectedArrivalAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "In progress"
        }
        countdownSeconds={secondsLeft}
        riskLevel={activeTrip?.riskLevel ?? "low"}
        onCheckIn={handleCheckIn}
        onSendSOS={handleSendSOS}
        onClose={() => {
          // Do not cancel the trip. Only hide the popup briefly.
          hideCheckInPopup();
        }}
      />
    </>
  );
}