import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts, radius } from "../../theme";
import { T } from "./Text";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
};

export function Button({ title, onPress, variant = "primary", icon, disabled, loading, full }: Props) {
  const primary = variant === "primary";
  const fg = primary ? colors.accentInk : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        primary && styles.primary,
        variant === "outline" && styles.outline,
        full && { alignSelf: "stretch" },
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Feather name={icon} size={16} color={fg} />}
          <T style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: fg }}>{title}</T>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 44, paddingHorizontal: 20, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  primary: { backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.raised },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
