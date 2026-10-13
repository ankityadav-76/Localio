import { Pressable, StyleSheet } from "react-native";
import { colors, radius } from "../../theme";
import { T } from "./Text";

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.pill, active && styles.active]}
    >
      <T variant="caption" color={active ? colors.accentInk : colors.inkSoft}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  active: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
});
