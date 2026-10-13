import type { ReactNode } from "react";
import { RefreshControl, ScrollView, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../../theme";

export function Screen({
  children,
  padded = true,
  onRefresh,
  refreshing,
  contentStyle,
}: {
  children: ReactNode;
  padded?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={[{ paddingBottom: 40 }, padded && { paddingHorizontal: 16 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}
