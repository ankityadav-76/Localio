import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { getMyVendorListings, sendOtp, verifyOtp } from "../lib/api";
import { colors, fonts, radius } from "../theme";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

type Role = "user" | "vendor";
type AuthMode = "login" | "signup";

const input = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  backgroundColor: colors.surface,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontFamily: fonts.body,
  fontSize: 15,
  color: colors.ink,
} as const;

export default function LoginScreen() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const { session, login, logout } = useAuth();

  const [role, setRole] = useState<Role | null>(roleParam === "vendor" ? "vendor" : roleParam === "user" ? "user" : null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await sendOtp(phone.trim());
      setDevCode(res.dev_code);
      setStage("code");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!role) return;
    setBusy(true);
    setError(null);
    try {
      const res = await verifyOtp(phone.trim(), code.trim(), role);
      setRedirecting(true);
      await login({ userId: res.user_id, phoneNumber: res.phone_number, isVendor: res.is_vendor });
      if (res.is_vendor) {
        const mine = await getMyVendorListings(res.user_id);
        router.replace(mine.length > 0 ? `/vendor/dashboard/${mine[0].id}` : "/vendor/onboarding");
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch (e) {
      setRedirecting(false);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (session && !redirecting) {
    return (
      <Screen contentStyle={{ paddingTop: 32 }}>
        <T variant="display" style={{ fontSize: 26 }}>You're already logged in</T>
        <T variant="small" style={{ marginTop: 8, marginBottom: 24 }}>
          {session.phoneNumber} ({session.isVendor ? "business account" : "reviewer account"}). To sign up or log in as a different type of user, log out first.
        </T>
        <View style={{ gap: 12 }}>
          <Button title="Continue" full onPress={() => router.replace(session.isVendor ? "/vendor" : "/")} />
          <Button title="Log out and switch account" variant="outline" full onPress={logout} />
        </View>
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen contentStyle={{ paddingTop: 40 }}>
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Feather name="map-pin" size={28} color={colors.accentInk} />
          </View>
          <T variant="display" style={{ fontSize: 30, textAlign: "center" }}>Welcome to Localio</T>
          <T variant="small" style={{ marginTop: 8, fontSize: 14, textAlign: "center" }}>
            Find neighborhood favorites or help your business get discovered.
          </T>
        </View>

        <T variant="caption" style={{ marginBottom: 10, fontFamily: fonts.bodyMedium, letterSpacing: 0.5 }}>
          CONTINUE AS
        </T>
        <View style={{ gap: 12 }}>
          <Pressable onPress={() => setRole("user")} accessibilityRole="button">
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18 }}>
              <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
                <Feather name="coffee" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <T style={{ fontFamily: fonts.bodyMedium, fontSize: 15 }}>Discover as a user</T>
                <T variant="caption">Explore places and share reviews</T>
              </View>
              <Feather name="chevron-right" size={20} color={colors.inkFaint} />
            </Card>
          </Pressable>
          <Pressable onPress={() => setRole("vendor")} accessibilityRole="button">
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18 }}>
              <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: colors.trustSoft, alignItems: "center", justifyContent: "center" }}>
                <Feather name="shopping-bag" size={18} color={colors.trust} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <T style={{ fontFamily: fonts.bodyMedium, fontSize: 15 }}>Continue as a vendor</T>
                <T variant="caption">List and manage your business</T>
              </View>
              <Feather name="chevron-right" size={20} color={colors.inkFaint} />
            </Card>
          </Pressable>
        </View>
        <T variant="caption" style={{ marginTop: 24, textAlign: "center" }}>
          Your account type can be changed by signing out.
        </T>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 32 }}>
      <Pressable onPress={() => { setRole(null); setStage("phone"); setCode(""); setError(null); }} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 }}>
        <Feather name="arrow-left" size={16} color={colors.accent} />
        <T variant="caption" color={colors.accent}>Change account type</T>
      </Pressable>
      <T variant="display" style={{ fontSize: 27 }}>
        {authMode === "signup" ? "Create your account" : "Welcome back"}
      </T>
      <T variant="small" style={{ marginTop: 7, marginBottom: 22, fontSize: 14 }}>
        {role === "vendor" ? "Vendor account" : "User account"} · Continue securely with your phone number.
      </T>

      <View style={{ flexDirection: "row", backgroundColor: colors.accentSoft, padding: 4, borderRadius: radius.md, marginBottom: 24 }}>
        {(["login", "signup"] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => { setAuthMode(mode); setError(null); }}
            accessibilityRole="button"
            accessibilityState={{ selected: authMode === mode }}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm, backgroundColor: authMode === mode ? colors.surface : "transparent" }}
          >
            <T style={{ fontFamily: fonts.bodyMedium, color: authMode === mode ? colors.ink : colors.inkSoft }}>
              {mode === "login" ? "Log in" : "Sign up"}
            </T>
          </Pressable>
        ))}
      </View>

      {stage === "phone" ? (
        <>
          <T variant="caption" style={{ marginBottom: 7 }}>PHONE NUMBER</T>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="+91 phone number"
            placeholderTextColor={colors.inkFaint}
            style={[input, { marginBottom: 16 }]}
          />
          <Button title={authMode === "signup" ? "Create account" : "Continue with phone"} full loading={busy} disabled={phone.trim().length < 8} onPress={send} />
          <T variant="caption" style={{ marginTop: 14, textAlign: "center" }}>
            We’ll send a one-time verification code. New phone numbers are registered automatically.
          </T>
        </>
      ) : (
        <>
          <T variant="caption" style={{ marginBottom: 7 }}>VERIFICATION CODE</T>
          <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code" placeholderTextColor={colors.inkFaint} style={[input, { marginBottom: 8 }]} />
          {!!devCode && <T variant="caption" style={{ marginBottom: 16 }}>Dev mode: no SMS is sent yet, your code is {devCode}</T>}
          <Button title="Verify" full loading={busy} disabled={code.trim().length < 6} onPress={verify} />
        </>
      )}

      {!!error && <T variant="small" color={colors.star} style={{ marginTop: 14 }}>{error}</T>}
    </Screen>
  );
}
