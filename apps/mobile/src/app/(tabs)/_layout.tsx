import { Tabs } from "expo-router";
import {
  Home,
  Map,
  User,
  ShieldAlert,
  Footprints,
} from "lucide-react-native";

import { COLORS, FONT_SIZE } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.softText,
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: "800",
        },
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={String(color)} strokeWidth={2.4} />
          ),
        }}
      />

      <Tabs.Screen
        name="walk-safe"
        options={{
          title: "Walk",
          tabBarIcon: ({ color, size }) => (
            <Footprints size={size} color={String(color)} strokeWidth={2.4} />
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: ({ color, size }) => (
            <ShieldAlert size={size} color={String(color)} strokeWidth={2.4} />
          ),
        }}
      />

      <Tabs.Screen
        name="risk-map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Map size={size} color={String(color)} strokeWidth={2.4} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={String(color)} strokeWidth={2.4} />
          ),
        }}
      />
    </Tabs>
  );
}