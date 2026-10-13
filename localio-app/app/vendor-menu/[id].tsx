import { useState } from "react";
import { Alert, Image, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { createOrder, getListing, getVendorMenu, verifyOrderPayment, API_BASE } from "../../src/lib/api";
import { buildSampleMenu } from "../../src/lib/sampleMenu";
import { colors } from "../../src/theme";
import { useAuth } from "../../src/store/auth";
import type { RazorpayCheckoutOrder } from "../../src/types";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Loading, ErrorNote } from "../../src/components/ui/Loading";
import { Pill } from "../../src/components/ui/Pill";
import { Screen } from "../../src/components/ui/Screen";
import { T } from "../../src/components/ui/Text";

export default function VendorMenuScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const session = useAuth((s) => s.session);
  const listingQ = useQuery({ queryKey: ["listing", id], queryFn: () => getListing(id), enabled: Number.isFinite(id) });
  const menuQ = useQuery({ queryKey: ["menu", id], queryFn: () => getVendorMenu(id), enabled: Number.isFinite(id) });
  const [service, setService] = useState<"Dine-In" | "Takeaway">("Dine-In");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const listing = listingQ.data;
  const liveItems = menuQ.data ?? [];
  const usingSampleMenu = !!listing && menuQ.data !== undefined && liveItems.length === 0;
  const items = usingSampleMenu ? buildSampleMenu(listing!) : liveItems;
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = items.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0);
  const hasUnconfirmedItems = items.some((item) => item.id < 0 && (cart[item.id] ?? 0) > 0);
  const openPaymentSheet = async (
    order: RazorpayCheckoutOrder,
    RazorpayCheckout: typeof import("react-native-razorpay").default,
  ) => {
    if (!listing || !session) {
      setIsCheckingOut(false);
      return;
    }
    let payment: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
    try {
      payment = await RazorpayCheckout.open({
        key: order.razorpay_key_id,
        amount: String(order.amount_paise),
        currency: order.currency,
        name: "Localio",
        description: `Order from ${listing.name}`,
        order_id: order.razorpay_order_id,
        prefill: { contact: session.phoneNumber },
        theme: { color: colors.accent },
      });
    } catch (error) {
      const message = error && typeof error === "object" && "description" in error && typeof error.description === "string"
        ? error.description
        : error instanceof Error
          ? error.message
          : "Payment was cancelled or could not be completed.";
      Alert.alert("Payment not completed", message);
      setIsCheckingOut(false);
      return;
    }

    setCart({});
    try {
      const confirmedOrder = await verifyOrderPayment(order.id, payment);
      Alert.alert(
        "Payment successful",
        `Order #${confirmedOrder.id} is paid. Total: ₹${confirmedOrder.total.toFixed(2)}.`,
      );
    } catch (error) {
      Alert.alert(
        "Payment confirmation pending",
        `Razorpay returned payment ${payment.razorpay_payment_id}, but the server could not confirm the order yet. Don't pay again. Please contact the shop with order #${order.id}. ${error instanceof Error ? error.message : ""}`,
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const startCheckout = async (orderItems: Array<{ menu_item_id: number; quantity: number }>) => {
    if (!listing || !session) return;
    setIsCheckingOut(true);

    let RazorpayCheckout: typeof import("react-native-razorpay").default;
    try {
      RazorpayCheckout = (await import("react-native-razorpay")).default;
    } catch {
      Alert.alert(
        "Razorpay checkout unavailable",
        "Payments require the installed Localio Android/iOS build with native Razorpay support. Expo Go does not include the payment module.",
      );
      setIsCheckingOut(false);
      return;
    }

    let order: RazorpayCheckoutOrder;
    try {
      order = await createOrder({
        listing_id: listing.id,
        user_id: session.userId,
        service,
        items: orderItems,
      });
    } catch (error) {
      Alert.alert("Couldn't start checkout", error instanceof Error ? error.message : "Please try again.");
      setIsCheckingOut(false);
      return;
    }

    Alert.alert(
      "Confirm payment",
      `${count} item${count === 1 ? "" : "s"} · ${service}\nServer-confirmed total: ₹${order.total.toFixed(2)}.`,
      [
        { text: "Cancel", style: "cancel", onPress: () => setIsCheckingOut(false) },
        { text: "Pay securely", onPress: () => { void openPaymentSheet(order, RazorpayCheckout); } },
      ],
      { cancelable: false },
    );
  };
  const placeOrder = () => {
    if (!session) {
      Alert.alert("Log in to order", "Please log in before placing an order.", [
        { text: "Cancel", style: "cancel" },
        { text: "Log in", onPress: () => router.push("/login") },
      ]);
      return;
    }
    if (!listing || count === 0) return;
    const orderItems = items
      .filter((item) => (cart[item.id] ?? 0) > 0)
      .map((item) => ({
        menu_item_id: item.id,
        quantity: cart[item.id],
      }));
    Alert.alert(
      "Confirm your order",
      `${count} item${count === 1 ? "" : "s"} · ${service}\nWe'll confirm the server-side price before opening Razorpay.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue to payment",
          onPress: () => { void startCheckout(orderItems); },
        },
      ],
    );
  };

  return (
    <Screen onRefresh={() => { listingQ.refetch(); menuQ.refetch(); }} refreshing={listingQ.isRefetching || menuQ.isRefetching} contentStyle={{ paddingTop: 4 }}>
      <Stack.Screen options={{ title: listing?.name ?? "Vendor menu" }} />
      {(listingQ.isLoading || menuQ.isLoading) && <Loading label="Loading vendor menu..." />}
      {(listingQ.isError || menuQ.isError) && <ErrorNote message={((listingQ.error || menuQ.error) as Error).message} />}
      {listing && <>
        <View style={{ height: 170, borderRadius: 18, overflow: "hidden", backgroundColor: colors.trustSoft, justifyContent: "center", alignItems: "center" }}>
          {listing.photo_url ? <Image source={{ uri: listing.photo_url.startsWith("http") ? listing.photo_url : `${API_BASE}${listing.photo_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <Feather name="coffee" size={44} color={colors.trust} />}
        </View>
        <View style={{ marginTop: 16, gap: 5 }}>
          <T variant="display" style={{ fontSize: 26 }}>{listing.name}</T>
          <T variant="small"><Feather name="map-pin" size={12} /> {listing.locality}{listing.landmark ? ` · Near ${listing.landmark}` : ""}</T>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <Pill label={listing.is_open ? "● OPEN NOW" : "● CLOSED"} />
            <Pill label={`${listing.crowd_level === "busy" ? "Busy" : listing.crowd_level === "low" ? "Quiet" : "Moderate"} crowd`} />
          </View>
          {!!listing.famous_for && <T style={{ marginTop: 5 }}>Famous for: {listing.famous_for}</T>}
          {!!listing.description && <T variant="small">{listing.description}</T>}
        </View>
        <View style={{ marginTop: 22 }}>
          <T variant="title">Your order</T>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            {(["Dine-In", "Takeaway"] as const).map((option) => <View key={option} style={{ flex: 1 }}>
              <Button title={option} icon={option === "Dine-In" ? "coffee" : "shopping-bag"} variant={service === option ? "primary" : "outline"} onPress={() => setService(option)} disabled={isCheckingOut} />
            </View>)}
          </View>
        </View>
        <View style={{ marginTop: 24, gap: 12 }}>
          <T variant="title">Menu</T>
          {usingSampleMenu && <Card style={{ marginBottom: 2, borderColor: colors.accentSoft }}><T style={{ color: colors.accent, fontWeight: "600" }}>Sample menu · confirmation pending</T><T variant="caption">Suggested items and prices are shown so every shop has a menu preview. Please confirm availability and prices with the vendor.</T></Card>}
          {menuQ.data && items.length === 0 && <Card><T>No menu items have been added yet.</T><T variant="caption">Check back soon or ask the vendor about today's specials.</T></Card>}
          {items.map((item) => <Card key={item.id} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            {item.image_url ? <Image source={{ uri: item.image_url.startsWith("http") ? item.image_url : `${API_BASE}${item.image_url}` }} style={{ width: 88, height: 88, borderRadius: 12 }} resizeMode="cover" /> : <View style={{ width: 88, height: 88, borderRadius: 12, backgroundColor: colors.trustSoft, alignItems: "center", justifyContent: "center" }}><Feather name="coffee" size={25} color={colors.trust} /></View>}
            <View style={{ flex: 1, gap: 4 }}>
              <T variant="title" style={{ fontSize: 15 }}>{item.name}</T>
              {!!item.description && <T variant="caption" numberOfLines={2}>{item.description}</T>}
              <T style={{ fontWeight: "700" }}>₹{item.price.toFixed(2)}</T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 3 }}>
                <Button title="−" variant="outline" disabled={isCheckingOut} onPress={() => setCart((old) => { const next = { ...old }; const n = (next[item.id] ?? 0) - 1; if (n > 0) next[item.id] = n; else delete next[item.id]; return next; })} />
                <T>{cart[item.id] ?? 0}</T>
                <Button title="+" disabled={isCheckingOut} onPress={() => setCart((old) => ({ ...old, [item.id]: (old[item.id] ?? 0) + 1 }))} />
              </View>
            </View>
          </Card>)}
        </View>
        {count > 0 && <View style={{ marginTop: 20, marginBottom: 16 }}>
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <T variant="title">{count} item{count === 1 ? "" : "s"} · {service}</T>
              <T variant="title">₹{total.toFixed(2)}</T>
            </View>
            <Button
              title={hasUnconfirmedItems ? "Sample prices need confirmation" : "Continue to secure payment"}
              icon="shopping-cart"
              onPress={placeOrder}
              loading={isCheckingOut}
              disabled={!listing?.is_open || hasUnconfirmedItems}
            />
            <T variant="caption">
              {hasUnconfirmedItems
                ? "Sample menu prices are estimates. Online payment is available once the vendor adds confirmed menu items."
                : "Your order total is calculated by the server and paid securely with Razorpay."}
            </T>
          </Card>
        </View>}
      </>}
    </Screen>
  );
}
