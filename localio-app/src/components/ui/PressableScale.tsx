import { useRef, type ReactNode } from "react";
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

/** Pressable with a subtle press-in scale, using RN's built-in Animated (no native module setup). */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  ...rest
}: Omit<PressableProps, "style" | "children"> & { children: ReactNode; style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <Pressable {...rest} onPressIn={() => to(scaleTo)} onPressOut={() => to(1)}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
