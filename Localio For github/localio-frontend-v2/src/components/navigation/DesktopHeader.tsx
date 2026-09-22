import { Link, useNavigate } from "react-router-dom";
import { Search, PenLine, User, Store } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export function DesktopHeader() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { userId, isVendor } = useAuth();

  const runSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const profileHref = !userId ? "/login" : isVendor ? "/vendor" : `/profile/${userId}`;

  return (
    <header className="hidden md:flex items-center gap-8 px-8 py-4 border-b border-border-soft bg-paper sticky top-0 z-30">
      <Link to="/" className="font-display font-semibold text-xl shrink-0">
        localio
      </Link>

      <div className="flex-1 max-w-md flex items-center gap-2 border border-border rounded-full px-4 py-2 bg-surface">
        <Search size={16} className="text-ink-faint shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search places, food, landmarks..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      <nav className="flex items-center gap-6 text-sm ml-auto">
        <Link to="/explore" className="text-ink-soft hover:text-ink transition-colors">
          Explore
        </Link>
        {!isVendor && (
          <Link to="/write-review" className="flex items-center gap-1.5 text-accent-ink font-medium">
            <PenLine size={15} />
            Write a review
          </Link>
        )}
        <Link to={profileHref} className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors">
          {isVendor ? <Store size={15} /> : <User size={15} />}
          {!userId ? "Log in" : isVendor ? "Your business" : "Profile"}
        </Link>
      </nav>
    </header>
  );
}
