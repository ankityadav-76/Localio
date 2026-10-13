import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { colors, radius } from "../../theme";

export function Card({ style, ...rest }: ViewProps & { style?: StyleProp<ViewStyle> }) {
  return <View {...rest} style={[styles.card, style]} />;
}

export const cardStyle: ViewStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.borderSoft,
  borderRadius: radius.md,
  shadowColor: colors.ink,
  shadowOpacity: 0.06,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};
const styles = StyleSheet.create({ card: { ...cardStyle, padding: 16 } });
