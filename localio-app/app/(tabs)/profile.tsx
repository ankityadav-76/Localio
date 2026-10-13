import { Redirect } from "expo-router";
import { useAuth } from "../../src/store/auth";
import ReviewerProfileScreen from "../../src/screens/ReviewerProfileScreen";
import { VendorHomeScreen } from "../../src/screens/VendorDashboardScreen";

export default function ProfileTab() {
  const session = useAuth((s) => s.session);
  if (!session) return <Redirect href="/login" />;
  if (session.isVendor) return <VendorHomeScreen showBackButton={false} />;
  return <ReviewerProfileScreen userId={session.userId} showBackButton={false} />;
}
