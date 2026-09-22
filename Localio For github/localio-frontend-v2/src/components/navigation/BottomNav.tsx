import { NavLink } from "react-router-dom";
import { Home, Compass, MapPin, MessageSquareText, User, Store } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass, end: false },
  { to: "/nearby", label: "Nearby", icon: MapPin, end: false },
];

export function BottomNav() {
  const { userId, isVendor } = useAuth();
  const profileHref = !userId ? "/login" : isVendor ? "/vendor" : `/profile/${userId}`;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface-raised border-t border-border-soft flex items-stretch">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] ${
              isActive ? "text-accent-ink" : "text-ink-faint"
            }`
          }
        >
          <Icon size={20} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
      {!isVendor && (
        <NavLink
          to="/write-review"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] ${
              isActive ? "text-accent-ink" : "text-ink-faint"
            }`
          }
        >
          <MessageSquareText size={20} strokeWidth={1.75} />
          Review
        </NavLink>
      )}
      <NavLink
        to={profileHref}
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] ${
            isActive ? "text-accent-ink" : "text-ink-faint"
          }`
        }
      >
        {isVendor ? <Store size={20} strokeWidth={1.75} /> : <User size={20} strokeWidth={1.75} />}
        {isVendor ? "Business" : "Profile"}
      </NavLink>
    </nav>
  );
}
