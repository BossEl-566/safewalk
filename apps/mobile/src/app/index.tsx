import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl text-red-900 font-bold text-primary-600">
        SafeWalk AI adding things to see if it will work
      </Text>

      <Text className="mt-3 text-base text-slate-500">
        NativeWind is working.
      </Text>
    </View>
  );
}