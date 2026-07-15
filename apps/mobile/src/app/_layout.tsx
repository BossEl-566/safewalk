import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { GlobalSafetyCheckInProvider } from "../components/GlobalSafetyCheckInProvider";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
          translucent={false}
        />

        <GlobalSafetyCheckInProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </GlobalSafetyCheckInProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}