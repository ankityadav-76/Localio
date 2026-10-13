import type { ReactNode } from "react";
import { View } from "react-native";
import { T } from "./Text";

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 16, gap: 6 }}>
      <T variant="title">{title}</T>
      {subtitle && <T variant="small" style={{ textAlign: "center" }}>{subtitle}</T>}
      {action && <View style={{ marginTop: 12 }}>{action}</View>}
    </View>
  );
}
