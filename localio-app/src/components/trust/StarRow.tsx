import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }} accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= Math.round(value) ? "star" : "star-outline"} size={size} color={colors.star} />
      ))}
    </View>
  );
}
