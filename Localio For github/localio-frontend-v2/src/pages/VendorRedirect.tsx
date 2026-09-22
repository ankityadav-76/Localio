import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMyVendorListings } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

export default function VendorRedirect() {
  const { userId } = useAuth();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getMyVendorListings(userId).then((listings) => {
      setTarget(listings.length > 0 ? `/vendor/dashboard/${listings[0].id}` : "/vendor/onboarding");
    });
  }, [userId]);

  if (!userId) return <Navigate to="/login" replace />;
  if (!target) return <div className="px-4 md:px-8 py-8 text-sm text-ink-soft">Loading...</div>;
  return <Navigate to={target} replace />;
}
