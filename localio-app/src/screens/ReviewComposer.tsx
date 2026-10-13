import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getListing, searchListings, submitReview } from "../lib/api";
import { getCoords, photoPart, pickPhoto } from "../lib/device";
import { colors, fonts, radius } from "../theme";
import type { Listing } from "../types";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

const TAGS = [
  { key: "tag_taste", label: "Taste" },
  { key: "tag_value", label: "Value" },
  { key: "tag_hygiene", label: "Hygiene" },
  { key: "tag_crowd", label: "Crowd" },
] as const;

function PlacePicker({ onPick }: { onPick: (l: Listing) => void }) {
  const [query, setQuery] = useState("");
  const all = useQuery({ queryKey: ["listings"], queryFn: () => searchListings({ sort: "rating" }) });
  const needle = query.trim().toLowerCase();
  const results = needle
    ? (all.data ?? []).filter((l) => `${l.name} ${l.locality} ${l.landmark ?? ""}`.toLowerCase().includes(needle))
    : (all.data ?? []).slice(0, 6);
  return (
    <View>
      <T variant="title" style={{ marginBottom: 4 }}>Which place are you reviewing?</T>
      <T variant="small" style={{ marginBottom: 12 }}>Search by name, locality or landmark.</T>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 14, backgroundColor: colors.surface, marginBottom: 14 }}>
        <Feather name="search" size={16} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. CG Road"
          placeholderTextColor={colors.inkFaint}
          style={{ flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 14, color: colors.ink }}
        />
      </View>
      <View style={{ gap: 8 }}>
        {results.map((l) => (
          <Pressable key={l.id} onPress={() => onPick(l)}>
            <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <T style={{ fontFamily: fonts.bodyMedium, fontSize: 14, flex: 1 }}>{l.name}</T>
              <T variant="caption">{l.locality}</T>
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ReviewComposer({
  initialListingId,
  safeAreaTop = false,
}: {
  initialListingId?: number;
  safeAreaTop?: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const insets = useSafeAreaInsets();
  const contentTop = safeAreaTop ? insets.top + 16 : 20;

  const [listing, setListing] = useState<Listing | null>(null);
  const [star, setStar] = useState(0);
  const [tags, setTags] = useState<Record<string, number | undefined>>({});
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (initialListingId) getListing(initialListingId).then(setListing).catch(() => {});
  }, [initialListingId]);

  const post = useMutation({
    mutationFn: async () => {
      // Location is only sent if the user grants permission. No permission = the
      // review still posts, just without the verified-visit badge (never faked).
      const coords = await getCoords();
      const form = new FormData();
      form.append("listing_id", String(listing!.id));
      form.append("user_id", String(session!.userId));
      form.append("star_rating", String(star));
      if (coords) {
        form.append("reviewer_lat", String(coords.lat));
        form.append("reviewer_lng", String(coords.lng));
      }
      if (text.trim()) form.append("text", text.trim());
      for (const [k, v] of Object.entries(tags)) if (v !== undefined) form.append(k, String(v));
      if (photo) form.append("photo", photoPart(photo));
      return submitReview(form);
    },
    onSuccess: () => {
      qc.invalidateQueries();
      setDone(true);
      setTimeout(() => router.replace(`/place/${listing!.id}`), 1200);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!session) return <Redirect href="/login" />;
  if (session.isVendor) {
    return (
      <Screen contentStyle={{ paddingTop: safeAreaTop ? insets.top + 24 : 32 }}>
        <T variant="title">Reviews come from customers</T>
        <T variant="small" style={{ marginTop: 6 }}>Business accounts can't post reviews. Log out and use a reviewer account to leave one.</T>
      </Screen>
    );
  }

  if (done) {
    return (
      <View style={{ flex: 1, paddingTop: safeAreaTop ? insets.top : 0, backgroundColor: colors.paper, alignItems: "center", justifyContent: "center", gap: 8 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.trustSoft, alignItems: "center", justifyContent: "center" }}>
          <Feather name="check" size={26} color={colors.trust} />
        </View>
        <T variant="title">Posted</T>
        <T variant="small">Thanks for telling the neighborhood.</T>
      </View>
    );
  }

  if (!listing) {
    return (
      <Screen contentStyle={{ paddingTop: contentTop }}>
        <PlacePicker onPick={setListing} />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: contentTop }}>
      <T variant="caption">Reviewing</T>
      <T variant="display" style={{ fontSize: 24, lineHeight: 30, marginBottom: 22 }}>{listing.name}</T>

      <T style={{ fontFamily: fonts.bodyMedium, fontSize: 14, marginBottom: 8 }}>How was it?</T>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStar(n)} accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`} hitSlop={4}>
            <Ionicons name={n <= star ? "star" : "star-outline"} size={38} color={colors.star} />
          </Pressable>
        ))}
      </View>

      {star > 0 && (
        <>
          <T style={{ fontFamily: fonts.bodyMedium, fontSize: 14, marginBottom: 10 }}>Rate the experience (optional)</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
            {TAGS.map((t) => (
              <View key={t.key} style={{ width: "46%" }}>
                <T variant="caption" style={{ marginBottom: 4 }}>{t.label}</T>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} hitSlop={4} onPress={() => setTags((p) => ({ ...p, [t.key]: p[t.key] === n ? undefined : n }))}>
                      <Ionicons name={(tags[t.key] ?? 0) >= n ? "star" : "star-outline"} size={20} color={colors.star} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <T style={{ fontFamily: fonts.bodyMedium, fontSize: 14, marginBottom: 8 }}>Add a photo (optional)</T>
          <View style={{ marginBottom: 22 }}>
            <Button
              title={photo ? "Photo added — tap to change" : "Add a photo"}
              icon="camera"
              variant="outline"
              onPress={async () => {
                const uri = await pickPhoto();
                if (uri) setPhoto(uri);
              }}
            />
          </View>

          <T style={{ fontFamily: fonts.bodyMedium, fontSize: 14, marginBottom: 8 }}>Anything else? (optional)</T>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Tell people what they should know..."
            placeholderTextColor={colors.inkFaint}
            style={{ minHeight: 90, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, padding: 12, fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginBottom: 20 }}
          />
        </>
      )}

      {!!error && <T variant="small" color={colors.star} style={{ marginBottom: 12 }}>{error}</T>}
      <Button title="Post review" full loading={post.isPending} disabled={star === 0} onPress={() => { setError(null); post.mutate(); }} />
      <T variant="caption" style={{ marginTop: 10, textAlign: "center" }}>
        Allow location when asked and your review earns a Verified visit badge if you're at the place.
      </T>
    </Screen>
  );
}
