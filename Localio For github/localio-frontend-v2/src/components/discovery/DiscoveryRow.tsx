import type { ReactNode } from "react";

export function DiscoveryRow({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="px-4 md:px-8 mb-3">
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        {subtitle && <p className="text-sm text-ink-soft mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 md:px-8 pb-1">
        {children}
      </div>
    </section>
  );
}
