import { useLocalSearchParams } from "expo-router";
import ReviewComposer from "../src/screens/ReviewComposer";

export default function WriteReviewRoute() {
  const { listing } = useLocalSearchParams<{ listing?: string }>();
  return <ReviewComposer initialListingId={listing ? Number(listing) : undefined} />;
}
