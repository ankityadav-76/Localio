import { useLocalSearchParams } from "expo-router";
import PlaceScreen from "../../src/screens/PlaceScreen";

export default function PlaceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceScreen listingId={Number(id)} />;
}
