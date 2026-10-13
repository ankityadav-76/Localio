import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, useFonts } from "@expo-google-fonts/plus-jakarta-sans";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { colors, fonts } from "../src/theme";
import { useAuth } from "../src/store/auth";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const session = useAuth((s) => s.session);
  const hydrate = useAuth((s) => s.hydrate);
  const hydrated = useAuth((s) => s.hydrated);
  const [fontsLoaded, fontError] = useFonts({ PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, Inter_400Regular, Inter_500Medium });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !session && segments[0] !== "login") {
      router.replace("/login");
    }
  }, [hydrated, router, segments, session]);

  const ready = hydrated && (fontsLoaded || !!fontError);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.paper },
            headerShadowVisible: false,
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
            headerBackButtonDisplayMode: "minimal",
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: "" }} />
          <Stack.Screen name="write-review" options={{ title: "Write a review" }} />
          <Stack.Screen name="search" options={{ title: "Search" }} />
          <Stack.Screen name="login" options={{ title: "" }} />
          <Stack.Screen name="reviewer/[id]" options={{ title: "Reviewer" }} />
          <Stack.Screen name="vendor/index" options={{ title: "Your business" }} />
          <Stack.Screen name="vendor/onboarding" options={{ title: "List your business" }} />
          <Stack.Screen name="vendor/dashboard/[id]" options={{ title: "Your business" }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
