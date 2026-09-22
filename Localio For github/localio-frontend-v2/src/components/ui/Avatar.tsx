export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="rounded-full flex items-center justify-center font-display font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: "var(--accent-soft)",
        color: "var(--accent-ink)",
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  );
}
