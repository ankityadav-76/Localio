import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import type { Listing, Review } from "../../types";
import { colors, fonts } from "../../theme";
import { timeAgo } from "../../lib/format";
import { Card } from "../ui/Card";
import { T } from "../ui/Text";
import { Avatar } from "../ui/Avatar";
import { Pill } from "../ui/Pill";
import { PressableScale } from "../ui/PressableScale";
import { StarRow } from "../trust/StarRow";
import { VerifiedBadge } from "../trust/VerifiedBadge";

const TAGS: { key: "tag_taste" | "tag_value" | "tag_hygiene" | "tag_crowd"; label: string }[] = [
  { key: "tag_taste", label: "Taste" },
  { key: "tag_value", label: "Value" },
  { key: "tag_hygiene", label: "Hygiene" },
  { key: "tag_crowd", label: "Crowd" },
];

export function ReviewCard({
  review,
  place,
  isFromContact = false,
  onMarkHelpful,
}: {
  review: Review;
  place?: Listing;
  isFromContact?: boolean;
  onMarkHelpful?: (id: number) => void;
}) {
  const router = useRouter();
  const [marked, setMarked] = useState(false);
  const name = review.reviewer_name?.trim() || "A Localio reviewer";
  const tags = TAGS.filter((t) => review[t.key] !== null);

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={name} size={38} />
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }} numberOfLines={1}>{name}</T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {isFromContact && <T variant="caption" color={colors.accent}>In your contacts</T>}
            {review.is_verified_visit && <VerifiedBadge />}
            <T variant="caption">{review.reviewer_review_count} review{review.reviewer_review_count === 1 ? "" : "s"}</T>
          </View>
        </View>
        <T variant="caption">{timeAgo(review.created_at)}</T>
      </View>

      <View style={{ marginTop: 12 }}>
        <StarRow value={review.star_rating} size={15} />
      </View>

      {!!review.text && <T style={{ marginTop: 10 }}>{review.text}</T>}

      {tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {tags.map((t) => (
            <Pill key={t.key} label={t.label} />
          ))}
        </View>
      )}

      <PressableScale
        onPress={() => {
          if (!onMarkHelpful || marked) return;
          setMarked(true);
          onMarkHelpful(review.id);
        }}
        accessibilityRole="button"
        accessibilityLabel="Mark this review as helpful"
        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, alignSelf: "flex-start", paddingVertical: 6 }}
      >
        <Feather name="heart" size={15} color={marked ? colors.star : colors.inkSoft} />
        <T variant="caption" color={colors.inkSoft}>
          {review.helpful_count + (marked ? 1 : 0)} found this helpful
        </T>
      </PressableScale>

      {place && (
        <Pressable
          onPress={() => router.push(`/place/${place.id}`)}
          style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft, flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Feather name="map-pin" size={13} color={colors.inkSoft} />
          <T variant="caption" color={colors.inkSoft} numberOfLines={1} style={{ flex: 1 }}>
            {place.name}
            {place.landmark ? ` · Near ${place.landmark}` : ""}
          </T>
        </Pressable>
      )}
    </Card>
  );
}
