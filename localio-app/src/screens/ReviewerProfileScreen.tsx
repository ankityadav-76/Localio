import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getUser, getUserReviews, searchListings } from "../lib/api";
import { useAuth } from "../store/auth";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

export default function ReviewerProfileScreen({ userId, showBackButton = true }: { userId: number; showBackButton?: boolean }) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const userQ = useQuery({ queryKey: ["user", userId], queryFn: () => getUser(userId) });
  const reviewsQ = useQuery({ queryKey: ["userReviews", userId], queryFn: () => getUserReviews(userId) });
  const listingsQ = useQuery({ queryKey: ["listings"], queryFn: () => searchListings({ sort: "rating" }) });

  const places = Object.fromEntries((listingsQ.data ?? []).map((l) => [l.id, l]));
  const reviews = reviewsQ.data ?? [];
  const verified = reviews.filter((r) => r.is_verified_visit).length;
  const isMe = session?.userId === userId;

  if (userQ.isLoading) return <Loading />;
  if (userQ.isError) return <ErrorNote message={(userQ.error as Error).message} />;
  const name = userQ.data?.name?.trim() || "A Localio reviewer";

  return (
    <Screen
      contentStyle={{ paddingTop: 12 }}
      onRefresh={() => { userQ.refetch(); reviewsQ.refetch(); }}
      refreshing={reviewsQ.isRefetching}
    >
      {showBackButton && (
        <Pressable onPress={() => router.replace("/(tabs)")} accessibilityRole="button" accessibilityLabel="Back to Home" style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 14, borderRadius: 12, backgroundColor: colors.raised }}>
          <Feather name="arrow-left" size={18} color={colors.accent} />
          <T style={{ color: colors.ink }}>Back</T>
        </Pressable>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <Avatar name={name} size={56} />
        <View>
          <T variant="title" style={{ fontSize: 21 }}>{name}</T>
          <T variant="small">{userQ.data?.review_count ?? 0} reviews · {verified} verified visits</T>
        </View>
      </View>
      {isMe && (
        <View style={{ marginBottom: 12 }}>
          <Button
            title="Log out"
            variant="outline"
            onPress={async () => {
              await logout();
              router.replace("/");
            }}
          />
        </View>
      )}
      <T variant="title" style={{ marginTop: 14, marginBottom: 12 }}>Review history</T>
      {reviewsQ.isLoading && <Loading />}
      {reviewsQ.data && reviews.length === 0 && <EmptyState title="No reviews yet" subtitle="Reviews this person posts will show up here." />}
      <View style={{ gap: 12 }}>
        {reviews.map((r) => <ReviewCard key={r.id} review={r} place={places[r.listing_id]} />)}
      </View>
    </Screen>
  );
}
