import { useLocalSearchParams } from "expo-router";
import ReviewerProfileScreen from "../../src/screens/ReviewerProfileScreen";

export default function ReviewerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReviewerProfileScreen userId={Number(id)} />;
}
