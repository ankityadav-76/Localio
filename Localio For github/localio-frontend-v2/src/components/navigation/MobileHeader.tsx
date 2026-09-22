import { Link, useNavigate } from "react-router-dom";
import { Search, User, Store } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export function MobileHeader({ showSearch = true }: { showSearch?: boolean }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { userId, isVendor } = useAuth();

  const runSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const profileHref = !userId ? "/login" : isVendor ? "/vendor" : `/profile/${userId}`;

  return (
    <header className="md:hidden sticky top-0 z-30 bg-paper border-b border-border-soft px-4 pt-4 pb-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-display font-semibold text-lg">
          localio
        </Link>
        <Link to={profileHref}>
          {isVendor ? (
            <Store size={20} className="text-ink-soft" />
          ) : (
            <User size={20} className="text-ink-soft" />
          )}
        </Link>
      </div>
      {showSearch && (
        <div className="mt-3 flex items-center gap-2 border border-border rounded-full px-4 py-2.5 bg-surface">
          <Search size={16} className="text-ink-faint shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search places, food, landmarks..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
        </div>
      )}
    </header>
  );
}
