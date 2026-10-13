import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { getListing, getReviews, voteReviewHelpful } from "../lib/api";
import { CATEGORY_LABEL } from "../lib/format";
import {
  getCachedContactReviewerIds,
  getContactConsent,
} from "../lib/contact-matching";
import { colors, fonts } from "../theme";
import { useAuth } from "../store/auth";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { RatingBadge } from "../components/trust/RatingBadge";
import { VerificationTierBadge } from "../components/trust/VerificationTierBadge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { Pill } from "../components/ui/Pill";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "tag_taste", label: "Taste" },
  { key: "tag_value", label: "Value" },
  { key: "tag_hygiene", label: "Hygiene" },
  { key: "tag_crowd", label: "Crowd" },
] as const;
const SORTS = [
  { key: "helpful", label: "Most helpful" },
  { key: "newest", label: "Newest" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
  { key: "verified", label: "Verified" },
] as const;

export default function PlaceScreen({ listingId }: { listingId: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("helpful");
  const [contactReviewerIds, setContactReviewerIds] = useState<number[]>([]);

  const listingQ = useQuery({ queryKey: ["listing", listingId], queryFn: () => getListing(listingId) });
  const reviewsQ = useQuery({ queryKey: ["reviews", listingId], queryFn: () => getReviews(listingId, "recent") });

  useEffect(() => {
    let active = true;
    const loadContactPreference = async () => {
      try {
        const consent = await getContactConsent();
        if (!active) return;
        if (consent === "accepted") {
          setContactReviewerIds((await getCachedContactReviewerIds()) ?? []);
        }
      } catch (error) {
        Alert.alert("Couldn't load contact preferences", error instanceof Error ? error.message : "Please try again.");
      }
    };
    void loadContactPreference();
    return () => {
      active = false;
    };
  }, []);

  const vote = useMutation({
    mutationFn: (reviewId: number) => voteReviewHelpful(reviewId, session!.userId),
    onSettled: () => qc.invalidateQueries(),
  });

  const visible = useMemo(() => {
    let list = reviewsQ.data ?? [];
    if (filter !== "all") list = list.filter((r) => r[filter] !== null);
    const s = [...list];
    switch (sort) {
      case "helpful": s.sort((a, b) => b.helpful_count - a.helpful_count); break;
      case "newest": s.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case "highest": s.sort((a, b) => b.star_rating - a.star_rating); break;
      case "lowest": s.sort((a, b) => a.star_rating - b.star_rating); break;
      case "verified": s.sort((a, b) => Number(b.is_verified_visit) - Number(a.is_verified_visit)); break;
    }
    const knownContacts = new Set(contactReviewerIds.filter((userId) => userId !== session?.userId));
    return s.sort((a, b) => Number(knownContacts.has(b.user_id)) - Number(knownContacts.has(a.user_id)));
  }, [reviewsQ.data, filter, sort, contactReviewerIds, session?.userId]);

  const listing = listingQ.data;
  const onHelpful = (id: number) => {
    if (!session) return router.push("/login");
    vote.mutate(id);
  };
  const writeReview = () => router.push({ pathname: "/write-review", params: { listing: String(listingId) } });

  return (
    <Screen
      onRefresh={() => { listingQ.refetch(); reviewsQ.refetch(); }}
      refreshing={listingQ.isRefetching || reviewsQ.isRefetching}
      contentStyle={{ paddingTop: 8 }}
    >
      <Stack.Screen options={{ title: "" }} />
      {listingQ.isLoading && <Loading />}
      {listingQ.isError && <ErrorNote message={(listingQ.error as Error).message} />}
      {listing && (
        <>
          {/* Community rating first: the review is the product */}
          <RatingBadge value={listing.bayesian_avg} reviewCount={listing.review_count} size="lg" />

          <View style={{ marginTop: 18, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, gap: 4 }}>
            <T variant="display" style={{ fontSize: 26, lineHeight: 32 }}>{listing.name}</T>
            <T variant="small">
              {CATEGORY_LABEL[listing.category]}
              {listing.landmark ? ` · Near ${listing.landmark}` : ""}
            </T>
            <VerificationTierBadge tier={listing.verification_tier} />
            {!session?.isVendor && (
              <View style={{ marginTop: 10 }}>
                <Button title="Write a review" icon="edit-3" onPress={writeReview} />
              </View>
            )}
          </View>

          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <T variant="title">What people are saying</T>
              <Pressable
                onPress={() => router.push("/(tabs)/contacts")}
                accessibilityRole="button"
                accessibilityLabel="View reviews from your contacts"
                hitSlop={6}
              >
                <T variant="caption" color={colors.accent}>Contacts</T>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {FILTERS.map((f) => <Pill key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />)}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 14 }}>
              {SORTS.map((s) => (
                <Pressable key={s.key} onPress={() => setSort(s.key)} hitSlop={6}>
                  <T style={{ fontFamily: sort === s.key ? fonts.bodyMedium : fonts.body, fontSize: 12, color: sort === s.key ? colors.accentInk : colors.inkFaint }}>{s.label}</T>
                </Pressable>
              ))}
            </ScrollView>

            {reviewsQ.isLoading && <Loading />}
            {reviewsQ.data && visible.length === 0 && (
              <EmptyState
                title="No reviews yet"
                subtitle="Be the first person to tell your neighborhood about this place."
                action={session?.isVendor ? undefined : <Button title="Write the first review" onPress={writeReview} />}
              />
            )}
            <View style={{ gap: 12 }}>
              {visible.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  isFromContact={r.user_id !== session?.userId && contactReviewerIds.includes(r.user_id)}
                  onMarkHelpful={onHelpful}
                />
              ))}
            </View>
          </View>

          {/* Business info deliberately comes after the reviews */}
          <View style={{ marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.borderSoft }}>
            <T variant="title" style={{ marginBottom: 10 }}>About this place</T>
            {!!listing.description && <T style={{ marginBottom: 10 }}>{listing.description}</T>}
            <Card style={{ flexDirection: "row", gap: 12 }}>
              <Feather name="map-pin" size={18} color={colors.inkSoft} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <T style={{ fontSize: 14 }}>{listing.locality}</T>
                {!!listing.landmark && <T variant="small">Near {listing.landmark}</T>}
                <Pressable
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`)}
                  accessibilityRole="link"
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}
                >
                  <Feather name="navigation" size={14} color={colors.accentInk} />
                  <T style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.accentInk }}>Get directions</T>
                </Pressable>
              </View>
            </Card>
            {!listing.description && <T variant="caption" style={{ marginTop: 10 }}>This business hasn't added a description yet.</T>}
          </View>
        </>
      )}
    </Screen>
  );
}
