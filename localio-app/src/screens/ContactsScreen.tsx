import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getPermissionsAsync } from "expo-contacts";
import { getListing, getUserReviews } from "../lib/api";
import {
  ContactsPermissionError,
  findContactReviewers,
  getCachedContactReviewerIds,
  getContactConsent,
  saveContactConsent,
  type ContactConsent,
} from "../lib/contact-matching";
import { useAuth } from "../store/auth";
import { colors } from "../theme";
import type { Review } from "../types";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorNote, Loading } from "../components/ui/Loading";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const session = useAuth((state) => state.session);
  const [consent, setConsent] = useState<ContactConsent | null>(null);
  const [reviewerIds, setReviewerIds] = useState<number[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [matchingContacts, setMatchingContacts] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [permissionNeedsSettings, setPermissionNeedsSettings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPermissionsAsync()
        .then((permission) => {
          if (active) setPermissionNeedsSettings(!permission.granted && !permission.canAskAgain);
        })
        .catch((error: unknown) => {
          if (active) setContactError(error instanceof Error ? error.message : "Couldn't check contacts access.");
        });
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const savedConsent = await getContactConsent();
        const cachedIds = savedConsent === "accepted" ? await getCachedContactReviewerIds() : null;
        if (active) {
          setConsent(savedConsent);
          setReviewerIds(cachedIds ?? []);
        }
      } catch (error) {
        if (active) setContactError(error instanceof Error ? error.message : "Couldn't load contact settings.");
      } finally {
        if (active) setLoadingPreferences(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const matchContacts = async () => {
    setMatchingContacts(true);
    setContactError(null);
    setPermissionNeedsSettings(false);
    try {
      const matchedIds = await findContactReviewers();
      const filteredIds = matchedIds.filter((userId) => userId !== session?.userId);
      await saveContactConsent("accepted");
      setConsent("accepted");
      setReviewerIds(filteredIds);
    } catch (error) {
      if (error instanceof ContactsPermissionError) {
        setPermissionNeedsSettings(!error.canAskAgain);
      }
      setContactError(error instanceof Error ? error.message : "Couldn't match your contacts. Please try again.");
    } finally {
      setMatchingContacts(false);
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setContactError("Couldn't open device settings. Open Localio's app permissions from your device settings.");
    }
  };

  const reviewsQ = useQuery({
    queryKey: ["contactReviews", reviewerIds],
    queryFn: async () => {
      const reviews = await Promise.all(reviewerIds.map((userId) => getUserReviews(userId)));
      return reviews
        .flat()
        .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime());
    },
    enabled: reviewerIds.length > 0,
  });
  const listingIds = useMemo(
    () => Array.from(new Set((reviewsQ.data ?? []).map((review) => review.listing_id))),
    [reviewsQ.data],
  );
  const listingsQ = useQuery({
    queryKey: ["contactReviewListings", listingIds],
    queryFn: () => Promise.all(listingIds.map((listingId) => getListing(listingId))),
    enabled: listingIds.length > 0,
  });
  const places = useMemo(
    () => Object.fromEntries((listingsQ.data ?? []).map((listing) => [listing.id, listing])),
    [listingsQ.data],
  );
  const reviews: Review[] = reviewsQ.data ?? [];
  const showConsent = consent !== "accepted" || permissionNeedsSettings;

  return (
    <Screen
      contentStyle={{ paddingTop: insets.top + 16 }}
      onRefresh={() => {
        if (reviewerIds.length > 0) void reviewsQ.refetch();
        if (listingIds.length > 0) void listingsQ.refetch();
      }}
      refreshing={reviewsQ.isRefetching || listingsQ.isRefetching}
    >
      <Card style={{ marginBottom: 18, padding: 20, backgroundColor: colors.accentSoft, borderColor: colors.accentSoft }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
            <Feather name="users" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="display" style={{ fontSize: 24, lineHeight: 30 }}>Your circle, their picks</T>
            <T variant="small" style={{ marginTop: 4 }}>
              Local recommendations from people you know.
            </T>
          </View>
        </View>
        {consent === "accepted" && !permissionNeedsSettings && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.surface }}>
              <T variant="title">{reviewerIds.length}</T>
              <T variant="caption">people matched</T>
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.surface }}>
              <T variant="title">{reviews.length}</T>
              <T variant="caption">reviews to explore</T>
            </View>
          </View>
        )}
      </Card>

      {showConsent && (
        <Card style={{ marginBottom: 18, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Feather name={permissionNeedsSettings ? "settings" : "shield"} size={18} color={colors.accent} />
            <T variant="title" style={{ flex: 1 }}>
              {permissionNeedsSettings ? "Allow access in Settings" : "Find people you know"}
            </T>
          </View>
          <T variant="small">
            {permissionNeedsSettings
              ? "Contacts access was previously turned off. Open Localio's app settings and allow Contacts, then come back and refresh."
              : "Tap below to allow contact access. Localio compares phone numbers with reviewer accounts; contact names and numbers aren't saved or shown."}
          </T>
          <Button
            title={matchingContacts ? "Checking contacts..." : permissionNeedsSettings ? "Open Settings" : "Allow contact access"}
            icon={permissionNeedsSettings ? "settings" : "users"}
            loading={matchingContacts}
            disabled={matchingContacts || loadingPreferences}
            onPress={() => void (permissionNeedsSettings ? openSettings() : matchContacts())}
          />
        </Card>
      )}

      {consent === "accepted" && !permissionNeedsSettings && (
        <Pressable
          onPress={() => void matchContacts()}
          disabled={matchingContacts}
          accessibilityRole="button"
          style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, marginBottom: 8 }}
        >
          <Feather name="refresh-cw" size={13} color={colors.accent} />
          <T style={{ color: colors.accent, fontFamily: "Inter_500Medium" }}>
            {matchingContacts ? "Refreshing contacts..." : "Refresh contact matches"}
          </T>
        </Pressable>
      )}

      {!!contactError && <ErrorNote message={contactError} />}
      {loadingPreferences && <Loading label="Loading contact preferences..." />}
      {consent === "accepted" && reviewerIds.length === 0 && !loadingPreferences && !permissionNeedsSettings && (
        <EmptyState
          title="No contacts matched yet"
          subtitle="When someone in your contacts joins Localio and reviews a place, their reviews will appear here."
          action={<Button title="Refresh contacts" icon="refresh-cw" onPress={() => void matchContacts()} loading={matchingContacts} />}
        />
      )}
      {reviewsQ.isLoading && <Loading label="Loading contact reviews..." />}
      {reviewsQ.isError && <ErrorNote message={(reviewsQ.error as Error).message} />}
      {reviewsQ.data && reviews.length === 0 && reviewerIds.length > 0 && (
        <EmptyState
          title="No contact reviews yet"
          subtitle="Reviews from people in your contacts will show up here."
        />
      )}
      {listingsQ.isLoading && <Loading label="Loading places..." />}
      {listingsQ.isError && <ErrorNote message={(listingsQ.error as Error).message} />}
      {reviews.length > 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 8 }}>
          <T variant="title">Latest reviews</T>
          <T variant="caption">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</T>
        </View>
      )}
      <View style={{ gap: 12 }}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} place={places[review.listing_id]} isFromContact />
        ))}
      </View>
    </Screen>
  );
}
