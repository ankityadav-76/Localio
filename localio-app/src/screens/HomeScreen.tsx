import type { ReactNode } from "react";
import { Image, ScrollView, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { loadDiscoveryData } from "../lib/discovery";
import { API_BASE, searchListings } from "../lib/api";
import { shopPhotos } from "../lib/shop-photos";
import type { Listing } from "../types";
import { colors } from "../theme";
import { useAuth } from "../store/auth";
import { AppHeader } from "../components/navigation/AppHeader";
import { PlaceCard } from "../components/places/PlaceCard";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { PressableScale } from "../components/ui/PressableScale";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

function Row({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 28 }}>
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <T variant="title">{title}</T>
        {subtitle && <T variant="small">{subtitle}</T>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {children}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const shopCardWidth = (windowWidth - 44) / 2;
  const session = useAuth((s) => s.session);
  const q = useQuery({ queryKey: ["discovery"], queryFn: loadDiscoveryData });
  const vendorQ = useQuery({ queryKey: ["food-vendors"], queryFn: () => searchListings({ sort: "rating" }) });
  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <AppHeader />
      <Screen padded={false} onRefresh={() => { q.refetch(); vendorQ.refetch(); }} refreshing={q.isRefetching || vendorQ.isRefetching}>
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <T variant="display" style={{ fontSize: 32, lineHeight: 39, letterSpacing: -0.8 }}>Local legends.{'\n'}Unforgettable bites.</T>
          <T variant="small" style={{ marginTop: 8, fontSize: 14 }}>Discover the street-food spots your city can’t stop talking about.</T>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <Button title="Explore nearby" icon="compass" onPress={() => router.push("/nearby")} />
            {session?.isVendor ? null : <Button title="Write a review" icon="edit-3" variant="outline" onPress={() => router.push("/write-review")} />}
          </View>
        </View>

        {!session && (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <PressableScale onPress={() => router.push({ pathname: "/login", params: { role: "vendor" } })} accessibilityRole="button">
              <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.trustSoft, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="shopping-bag" size={18} color={colors.trust} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontSize: 14 }}>Run ankit a stall or small business?</T>
                  <T variant="caption">List it on Localio and see what your customers say.</T>
                </View>
              </Card>
            </PressableScale>
          </View>
        )}

        {q.isLoading && <Loading label="Loading what's around you..." />}
        {q.isError && <ErrorNote message={(q.error as Error).message} />}
        {vendorQ.data && (() => {
          const vendors: Listing[] = vendorQ.data;
          return (
            <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
              <T variant="title">Street food, close by</T>
              <T variant="small" style={{ marginTop: 3, marginBottom: 12 }}>Meet the local legends behind your favourite bites</T>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {vendors.map((vendor) => (
                  <PressableScale key={vendor.id} onPress={() => router.push(`/vendor-menu/${vendor.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${vendor.name}, view menu`}
                    style={{ width: shopCardWidth, height: 324, backgroundColor: colors.raised, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}>
                    {shopPhotos[vendor.name] || vendor.photo_url ? (
                      <Image
                        source={
                          shopPhotos[vendor.name] ??
                          { uri: vendor.photo_url!.startsWith("http") ? vendor.photo_url! : `${API_BASE}${vendor.photo_url!}` }
                        }
                        style={{ width: "100%", height: 112 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ width: "100%", height: 112, alignItems: "center", justifyContent: "center", backgroundColor: colors.trustSoft }}>
                        <Feather name="coffee" size={28} color={colors.trust} />
                      </View>
                    )}
                    <View style={{ height: 212, padding: 12, justifyContent: "space-between" }}>
                      <T variant="title" style={{ height: 40, fontSize: 15, lineHeight: 20 }} numberOfLines={2}>{vendor.name}</T>
                      <T variant="caption" numberOfLines={1} style={{ height: 18 }}>
                        <Feather name="map-pin" size={11} /> {vendor.locality || "Nearby"}
                      </T>
                      <T variant="small" numberOfLines={2} style={{ height: 38 }}>
                        {vendor.famous_for || vendor.description || (vendor.category === "street_food" ? "Local street food favourites" : "Local dining")}
                      </T>
                      <View style={{ height: 24, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: vendor.is_open ? colors.trustSoft : colors.surface, flexShrink: 1 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: vendor.is_open ? colors.trust : colors.inkFaint }} />
                          <T style={{ fontSize: 10, color: vendor.is_open ? colors.trust : colors.inkSoft }} numberOfLines={1}>{vendor.is_open ? "Open now" : "Closed"}</T>
                        </View>
                        <T variant="caption" numberOfLines={1} style={{ flexShrink: 1, fontSize: 10 }}>{vendor.crowd_level === "busy" ? "Busy" : vendor.crowd_level === "low" ? "Quiet" : "Moderate"}</T>
                      </View>
                      <View style={{ height: 30, borderTopWidth: 1, borderTopColor: colors.borderSoft, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <T style={{ color: colors.accent, fontSize: 13, fontFamily: "Inter_500Medium" }}>View menu</T>
                        <Feather name="arrow-up-right" size={15} color={colors.accent} />
                      </View>
                    </View>
                  </PressableScale>
                ))}
              </View>
            </View>
          );
        })()}

        {d && d.peopleAreTalkingAbout.length === 0 && (
          <EmptyState title="Nothing here yet" subtitle="Seed some listings on the backend to see the discovery feed come alive." />
        )}

        {d && d.peopleAreTalkingAbout.length > 0 && (
          <>
            <Row title="People are talking about..." subtitle="The most helpful reviews from around the neighborhood">
              {d.peopleAreTalkingAbout.map((r) => (
                <View key={r.id} style={{ width: 310 }}>
                  <ReviewCard review={r} place={r.listing} />
                </View>
              ))}
            </Row>
            {d.trendingNearby.length > 0 && (
              <Row title="Trending nearby" subtitle="Places gaining attention right now">
                {d.trendingNearby.map((l) => <PlaceCard key={l.id} listing={l} />)}
              </Row>
            )}
            {d.hiddenGems.length > 0 && (
              <Row title="Hidden gems" subtitle="Strong reviews, still flying under the radar">
                {d.hiddenGems.map((l) => <PlaceCard key={l.id} listing={l} />)}
              </Row>
            )}
            {d.highlyRatedVerified.length > 0 && (
              <Row title="Highly rated by verified visitors" subtitle="Trust-driven picks">
                {d.highlyRatedVerified.map((l) => <PlaceCard key={l.id} listing={l} />)}
              </Row>
            )}
            {d.recentlyReviewed.length > 0 && (
              <Row title="Recently reviewed" subtitle="Fresh activity from the community">
                {d.recentlyReviewed.map((r) => (
                  <View key={r.id} style={{ width: 310 }}>
                    <ReviewCard review={r} place={r.listing} />
                  </View>
                ))}
              </Row>
            )}
          </>
        )}
      </Screen>
    </View>
  );
}
