import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius } from "../../theme";
import { useAuth } from "../../store/auth";
import { T } from "../ui/Text";

/** Logo row + search field used at the top of the tab screens. */
export function AppHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuth((s) => s.session);
  const [query, setQuery] = useState("");

  const go = () => {
    if (query.trim()) router.push({ pathname: "/search", params: { q: query.trim() } });
  };

  return (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <T variant="title" style={{ fontSize: 23, letterSpacing: -0.7 }}>localio</T>
        {!session && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable onPress={() => router.push({ pathname: "/login", params: { role: "vendor" } })} hitSlop={8}>
              <T style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.accent }}>List your business</T>
            </Pressable>
            <Pressable onPress={() => router.push("/login")} hitSlop={8}>
              <T style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkSoft }}>Log in</T>
            </Pressable>
          </View>
        )}
      </View>
      <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, backgroundColor: colors.surface }}>
        <Feather name="search" size={16} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={go}
          returnKeyType="search"
          placeholder="Search places, food, landmarks..."
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel="Search"
          style={{ flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14, color: colors.ink }}
        />
      </View>
    </View>
  );
}
