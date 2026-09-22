import type { ReactNode } from "react";

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4">
      <p className="font-display font-medium text-lg">{title}</p>
      {subtitle && <p className="text-sm text-ink-soft mt-1 max-w-sm mx-auto">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
