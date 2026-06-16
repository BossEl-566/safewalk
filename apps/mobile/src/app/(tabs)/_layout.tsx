import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="walk-safe"
        options={{
          title: "Walk",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="walk"
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "warning" : "warning-outline"}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="risk-map"
        options={{
          title: "Map",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}