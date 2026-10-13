import { useLocalSearchParams } from "expo-router";
import { VendorDashboardScreen } from "../../../src/screens/VendorDashboardScreen";

export default function VendorDashboardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <VendorDashboardScreen listingId={Number(id)} />;
}
