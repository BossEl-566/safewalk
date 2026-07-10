import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  House,
  Footprints,
  ShieldAlert,
  Map,
  UserRound,
} from "lucide-react-native";

import {
  COLORS,
  FONT_SIZE,
  RADIUS,
  SHADOWS,
  SPACING,
} from "../../constants/theme";

const TAB_CONFIG = {
  home: {
    label: "Home",
    Icon: House,
  },
  "walk-safe": {
    label: "Walk",
    Icon: Footprints,
  },
  report: {
    label: "Report",
    Icon: ShieldAlert,
  },
  "risk-map": {
    label: "Map",
    Icon: Map,
  },
  profile: {
    label: "Profile",
    Icon: UserRound,
  },
};

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: insets.bottom > 0 ? insets.bottom + 8 : 12,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];

        if (!config) return null;

        const focused = state.index === index;
        const Icon = config.Icon;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tabButton,
              focused ? styles.activeTabButton : styles.inactiveTabButton,
            ]}
          >
            <Icon
              size={22}
              color={focused ? COLORS.white : COLORS.text}
              strokeWidth={2.3}
            />

            {focused ? (
              <Text numberOfLines={1} style={styles.activeLabel}>
                {config.label}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="walk-safe"
        options={{
          title: "Walk",
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
        }}
      />

      <Tabs.Screen
        name="risk-map"
        options={{
          title: "Map",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 78,
    borderRadius: RADIUS.full,
    backgroundColor: "#E9EDF8",
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#D7DCEB",
    ...SHADOWS.soft,
    elevation: 10,
  },

  tabButton: {
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    overflow: "hidden",
  },

  activeTabButton: {
    flex: 1.55,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
  },

  inactiveTabButton: {
    flex: 0.72,
    backgroundColor: COLORS.surface,
  },

  activeLabel: {
    marginLeft: 9,
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: "900",
  },
});