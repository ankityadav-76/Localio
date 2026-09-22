import { Outlet, useLocation } from "react-router-dom";
import { DesktopHeader } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";
import { BottomNav } from "./BottomNav";

export function Layout() {
  const location = useLocation();
  // Place pages and the review composer have their own focused headers/back
  // buttons, so skip the generic search header there.
  const hideSearch = location.pathname.startsWith("/place/") || location.pathname.startsWith("/write-review");

  return (
    <div className="min-h-screen bg-paper text-ink">
      <DesktopHeader />
      {!hideSearch && <MobileHeader />}
      <main className="max-w-6xl mx-auto pb-20 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
