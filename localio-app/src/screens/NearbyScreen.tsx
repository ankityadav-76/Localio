import { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { loadDiscoveryData } from "../lib/discovery";
import { colors } from "../theme";
import type { Listing } from "../types";
import { AppHeader } from "../components/navigation/AppHeader";
import { StarRow } from "../components/trust/StarRow";
import { cardStyle } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { PressableScale } from "../components/ui/PressableScale";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

export default function NearbyScreen() {
  const router = useRouter();
  const q = useQuery({ queryKey: ["discovery"], queryFn: loadDiscoveryData });

  const { groups, topReview, verifiedCount } = useMemo(() => {
    const byLocality = new Map<string, Listing[]>();
    for (const l of q.data?.listings ?? []) byLocality.set(l.locality, [...(byLocality.get(l.locality) ?? []), l]);
    const top: Record<number, string> = {};
    const topHelpful: Record<number, number> = {};
    const verified: Record<number, number> = {};
    for (const r of q.data?.reviewsWithListing ?? []) {
      if (r.text && (topHelpful[r.listing_id] === undefined || r.helpful_count > topHelpful[r.listing_id])) {
        top[r.listing_id] = r.text;
        topHelpful[r.listing_id] = r.helpful_count;
      }
      if (r.is_verified_visit) verified[r.listing_id] = (verified[r.listing_id] ?? 0) + 1;
    }
    return {
      groups: [...byLocality.entries()].map(([locality, listings]) => ({ locality, listings: [...listings].sort((a, b) => b.bayesian_avg - a.bayesian_avg) })),
      topReview: top,
      verifiedCount: verified,
    };
  }, [q.data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <AppHeader />
      <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching} contentStyle={{ paddingTop: 20 }}>
        <T variant="display" style={{ fontSize: 26 }}>Nearby</T>
        <T variant="small" style={{ marginBottom: 16 }}>Grouped by locality and landmark, not exact address.</T>
        {q.isLoading && <Loading />}
        {q.isError && <ErrorNote message={(q.error as Error).message} />}
        {q.data && groups.length === 0 && <EmptyState title="Nothing nearby yet" subtitle="Seed some listings on the backend to populate this." />}
        {groups.map((g) => (
          <View key={g.locality} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Feather name="map-pin" size={15} color={colors.inkSoft} />
              <T variant="title" style={{ fontSize: 16 }}>Around {g.locality}</T>
            </View>
            <View style={{ gap: 10 }}>
              {g.listings.map((l) => (
                <PressableScale key={l.id} onPress={() => router.push(`/place/${l.id}`)} accessibilityRole="button" style={[cardStyle, { padding: 16 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <StarRow value={l.bayesian_avg} size={13} />
                    <T style={{ fontSize: 14 }}>{l.review_count > 0 ? l.bayesian_avg.toFixed(1) : "New"}</T>
                  </View>
                  <T variant="title" style={{ fontSize: 17 }}>{l.name}</T>
                  {!!topReview[l.id] && <T variant="small" numberOfLines={1} style={{ marginTop: 4 }}>"{topReview[l.id]}"</T>}
                  {(verifiedCount[l.id] ?? 0) > 0 && (
                    <T variant="caption" style={{ marginTop: 6 }}>{verifiedCount[l.id]} verified review{verifiedCount[l.id] === 1 ? "" : "s"}</T>
                  )}
                </PressableScale>
              ))}
            </View>
          </View>
        ))}
      </Screen>
    </View>
  );
}
