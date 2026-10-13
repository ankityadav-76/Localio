import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts } from "../../theme";
import { T } from "../ui/Text";

export function VerifiedBadge() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }} accessibilityLabel="Verified visit">
      <Feather name="check-circle" size={13} color={colors.trust} />
      <T style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.trust }}>Verified visit</T>
    </View>
  );
}
