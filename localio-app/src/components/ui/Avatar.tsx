import { View } from "react-native";
import { colors, fonts } from "../../theme";
import { T } from "./Text";

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
      <T style={{ fontFamily: fonts.display, fontSize: size * 0.42, color: colors.accentInk }}>{name.trim().charAt(0).toUpperCase() || "?"}</T>
    </View>
  );
}
