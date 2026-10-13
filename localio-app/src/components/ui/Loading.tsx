import { ActivityIndicator, View } from "react-native";
import { colors } from "../../theme";
import { T } from "./Text";

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ padding: 32, alignItems: "center", gap: 10 }}>
      <ActivityIndicator color={colors.accent} />
      {label && <T variant="small">{label}</T>}
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <View style={{ padding: 16 }}>
      <T variant="small" color={colors.star}>{message}</T>
    </View>
  );
}
