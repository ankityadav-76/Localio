import { Pressable, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { getMyVendorListings, getVendorDashboard } from "../lib/api";
import { CATEGORY_LABEL } from "../lib/format";
import { colors } from "../theme";
import { useAuth } from "../store/auth";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { RatingBadge } from "../components/trust/RatingBadge";
import { VerificationTierBadge } from "../components/trust/VerificationTierBadge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

/** Read-only by design: no reply / edit / hide controls for reviews. */
export function VendorDashboardScreen({ listingId, showBackButton = true }: { listingId: number; showBackButton?: boolean }) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const q = useQuery({
    queryKey: ["vendorDashboard", listingId],
    queryFn: () => getVendorDashboard(listingId, session!.userId),
    enabled: !!session,
  });

  if (!session) return <Redirect href="/login" />;
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorNote message="Couldn't load this dashboard. Is this listing yours?" />;
  if (!q.data) return null;

  const { listing, total_helpful_votes, recent_reviews } = q.data;
  return (
    <Screen contentStyle={{ paddingTop: 12 }} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      {showBackButton && (
        <Pressable onPress={() => router.replace("/(tabs)")} accessibilityRole="button" accessibilityLabel="Back to Home" style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 12, borderRadius: 12, backgroundColor: colors.raised }}>
          <Feather name="arrow-left" size={18} color={colors.accent} />
          <T style={{ color: colors.ink }}>Back</T>
        </Pressable>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <T variant="caption">Your business dashboard</T>
        <Button
          title="Log out"
          variant="ghost"
          onPress={async () => {
            await logout();
            router.replace("/");
          }}
        />
      </View>
      <T variant="display" style={{ fontSize: 26, lineHeight: 32 }}>{listing.name}</T>
      <T variant="small" style={{ marginBottom: 4 }}>
        {CATEGORY_LABEL[listing.category]}
        {listing.landmark ? ` · Near ${listing.landmark}` : ""}
      </T>
      <VerificationTierBadge tier={listing.verification_tier} />

      <View style={{ flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 24 }}>
        <Card style={{ flex: 1 }}>
          <RatingBadge value={listing.bayesian_avg} reviewCount={listing.review_count} />
        </Card>
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="heart" size={20} color={colors.star} />
            <T variant="display" style={{ fontSize: 26, lineHeight: 30 }}>{total_helpful_votes}</T>
          </View>
          <T variant="small" style={{ marginTop: 4 }}>Helpful votes across all reviews</T>
        </Card>
      </View>

      {!!listing.description && (
        <Card style={{ marginBottom: 20 }}>
          <T variant="caption" style={{ marginBottom: 4 }}>Your description</T>
          <T style={{ fontSize: 14 }}>{listing.description}</T>
        </Card>
      )}

      <T variant="title" style={{ marginBottom: 4 }}>What customers are saying</T>
      <T variant="caption" style={{ marginBottom: 14 }}>
        Read-only view. There's no reply or edit option by design, so reviews stay an honest signal for customers.
      </T>
      {recent_reviews.length === 0 ? (
        <EmptyState title="No reviews yet" subtitle="Once customers start reviewing, they'll show up here." />
      ) : (
        <View style={{ gap: 12 }}>{recent_reviews.map((r) => <ReviewCard key={r.id} review={r} />)}</View>
      )}
    </Screen>
  );
}

/** Entry point for the vendor tab: dashboard if they own a shop, onboarding if not. */
export function VendorHomeScreen({ showBackButton = true }: { showBackButton?: boolean }) {
  const session = useAuth((s) => s.session);
  const q = useQuery({
    queryKey: ["myListings", session?.userId],
    queryFn: () => getMyVendorListings(session!.userId),
    enabled: !!session,
  });
  if (!session) return <Redirect href="/login" />;
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorNote message={(q.error as Error).message} />;
  if (!q.data || q.data.length === 0) return <Redirect href="/vendor/onboarding" />;
  return <VendorDashboardScreen listingId={q.data[0].id} showBackButton={showBackButton} />;
}
