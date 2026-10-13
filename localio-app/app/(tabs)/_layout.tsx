import { Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../../src/theme";
import { useAuth } from "../../src/store/auth";

export default function TabsLayout() {
  const isVendor = useAuth((s) => s.session?.isVendor ?? false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSoft,
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(5, insets.bottom),
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ color, size }) => <Feather name="compass" size={size} color={color} /> }} />
      <Tabs.Screen name="nearby" options={{ title: "Nearby", tabBarIcon: ({ color, size }) => <Feather name="map-pin" size={size} color={color} /> }} />
      <Tabs.Screen name="contacts" options={{ title: "Contacts", tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={color} /> }} />
      {/* Business accounts don't post reviews, so the Review tab is hidden for them. */}
      <Tabs.Screen
        name="review"
        options={{ title: "Review", href: isVendor ? null : undefined, tabBarIcon: ({ color, size }) => <Feather name="message-square" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isVendor ? "Business" : "Profile",
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/(tabs)")}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              hitSlop={8}
              style={{ paddingRight: 12 }}
            >
              <Feather name="arrow-left" size={22} color={colors.accent} />
            </Pressable>
          ),
          tabBarIcon: ({ color, size }) => <Feather name={isVendor ? "shopping-bag" : "user"} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
