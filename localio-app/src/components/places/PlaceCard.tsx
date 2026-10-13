import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import type { Listing } from "../../types";
import { API_BASE } from "../../lib/api";
import { CATEGORY_LABEL } from "../../lib/format";
import { shopPhotos } from "../../lib/shop-photos";
import { colors } from "../../theme";
import { Feather } from "@expo/vector-icons";
import { cardStyle } from "../ui/Card";
import { T } from "../ui/Text";
import { Pill } from "../ui/Pill";
import { PressableScale } from "../ui/PressableScale";
import { StarRow } from "../trust/StarRow";
import { VerificationTierBadge } from "../trust/VerificationTierBadge";

export function PlaceCard({ listing, fill = false }: { listing: Listing; fill?: boolean }) {
  const router = useRouter();
  const photo = shopPhotos[listing.name] ??
    (listing.photo_url
      ? { uri: listing.photo_url.startsWith("http") ? listing.photo_url : `${API_BASE}${listing.photo_url}` }
      : null);
  return (
    <PressableScale
      onPress={() => router.push(`/place/${listing.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${listing.name}, open place`}
      style={[cardStyle, { padding: 0, gap: 8, overflow: "hidden" }, fill ? { alignSelf: "stretch" } : { width: 250 }]}
    >
      {photo ? (
        <Image source={photo} style={{ width: "100%", height: 132 }} resizeMode="cover" />
      ) : (
        <View style={{ width: "100%", height: 132, alignItems: "center", justifyContent: "center", backgroundColor: colors.accentSoft }}>
          <Feather name="coffee" size={30} color={colors.accent} />
        </View>
      )}
      <View style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Pill label={CATEGORY_LABEL[listing.category] ?? listing.category} />
          <VerificationTierBadge tier={listing.verification_tier} />
        </View>
        <T variant="title" style={{ fontSize: 17, lineHeight: 22 }}>{listing.name}</T>
        {!!listing.landmark && <T variant="caption">Near {listing.landmark}</T>}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
          <StarRow value={listing.bayesian_avg} size={13} />
          <T variant="caption">{listing.review_count > 0 ? `${listing.bayesian_avg.toFixed(1)} · ${listing.review_count} reviews` : "New"}</T>
        </View>
      </View>
    </PressableScale>
  );
}
