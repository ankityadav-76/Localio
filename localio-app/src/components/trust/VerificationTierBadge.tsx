import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts } from "../../theme";
import { T } from "../ui/Text";
import type { VerificationTier } from "../../types";

const CONFIG: Record<VerificationTier, { label: string; icon: keyof typeof Feather.glyphMap } | null> = {
  unverified: null,
  photo_verified: { label: "Photo verified", icon: "check-circle" },
  registered_business: { label: "Registered business", icon: "shield" },
};

export function VerificationTierBadge({ tier }: { tier: VerificationTier }) {
  const c = CONFIG[tier];
  if (!c) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Feather name={c.icon} size={13} color={colors.trust} />
      <T style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.trust }}>{c.label}</T>
    </View>
  );
}
