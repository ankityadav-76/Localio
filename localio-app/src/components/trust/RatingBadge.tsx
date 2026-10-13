import { View } from "react-native";
import { T } from "../ui/Text";
import { StarRow } from "./StarRow";

export function RatingBadge({ value, reviewCount, size = "md" }: { value: number; reviewCount: number; size?: "md" | "lg" }) {
  const early = reviewCount > 0 && reviewCount < 5;
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <T variant="display" style={{ fontSize: size === "lg" ? 48 : 26, lineHeight: size === "lg" ? 54 : 30 }}>
          {reviewCount > 0 ? value.toFixed(1) : "—"}
        </T>
        <StarRow value={value} size={size === "lg" ? 18 : 14} />
      </View>
      <T variant="small" style={{ marginTop: 4 }}>
        {reviewCount === 0
          ? "No reviews yet"
          : early
            ? `Early rating · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
            : `${reviewCount} reviews`}
      </T>
    </View>
  );
}
