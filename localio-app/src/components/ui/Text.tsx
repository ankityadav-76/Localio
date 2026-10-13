import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from "react-native";
import { colors, fonts } from "../../theme";

type Variant = "display" | "title" | "body" | "small" | "caption";

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.inkFaint },
};

export function T({ variant = "body", color, style, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  return <RNText {...rest} style={StyleSheet.flatten([variants[variant], color ? { color } : null, style])} />;
}
