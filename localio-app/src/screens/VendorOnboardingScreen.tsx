import { useState } from "react";
import { TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { createVendorListing } from "../lib/api";
import { getCoords, photoPart, pickPhoto, type Coords } from "../lib/device";
import { colors, fonts, radius } from "../theme";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Pill } from "../components/ui/Pill";
import { Screen } from "../components/ui/Screen";
import { T } from "../components/ui/Text";

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
  marginBottom: 16,
} as const;

function Label({ children }: { children: string }) {
  return <T variant="caption" style={{ marginBottom: 6 }}>{children}</T>;
}

export default function VendorOnboardingScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useAuth((s) => s.session);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("street_food");
  const [locality, setLocality] = useState("");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [gst, setGst] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("user_id", String(session!.userId));
      form.append("name", name.trim());
      form.append("category", category);
      form.append("locality", locality.trim());
      if (landmark.trim()) form.append("landmark", landmark.trim());
      // The shop is placed where the owner stands when claiming it. NOTE: this
      // means the same GPS point is the listing location and the "vendor
      // location", so the distance check can't fail from the app. See README.
      form.append("lat", String(coords!.lat));
      form.append("lng", String(coords!.lng));
      form.append("vendor_lat", String(coords!.lat));
      form.append("vendor_lng", String(coords!.lng));
      if (description.trim()) form.append("description", description.trim());
      if (gst.trim()) form.append("gst_number", gst.trim());
      if (photo) form.append("photo", photoPart(photo));
      return createVendorListing(form);
    },
    onSuccess: (listing) => {
      qc.invalidateQueries();
      router.replace(`/vendor/dashboard/${listing.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!session) return <Redirect href="/login" />;

  const confirmLocation = async () => {
    setError(null);
    setLocating(true);
    const c = await getCoords();
    setLocating(false);
    if (c) setCoords(c);
    else setError("Couldn't get your location. Allow location access so we can place your business on the map.");
  };

  const onSubmit = () => {
    if (!name.trim() || !locality.trim()) return setError("Business name and locality are required.");
    if (!coords) return setError('Tap "Confirm I\'m at my stall" first so we can place your listing.');
    setError(null);
    submit.mutate();
  };

  return (
    <Screen contentStyle={{ paddingTop: 20 }}>
      <T variant="display" style={{ fontSize: 26 }}>List your business</T>
      <T variant="small" style={{ marginTop: 6, marginBottom: 22 }}>
        One-time setup. You won't be able to reply to or edit reviews — that's what keeps them trustworthy for customers.
      </T>

      <Label>Business name</Label>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Raju Vada Pav" placeholderTextColor={colors.inkFaint} style={input} />

      <Label>Category</Label>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <Pill label="Street food" active={category === "street_food"} onPress={() => setCategory("street_food")} />
        <Pill label="Eatery" active={category === "eatery"} onPress={() => setCategory("eatery")} />
      </View>

      <Label>Locality</Label>
      <TextInput value={locality} onChangeText={setLocality} placeholder="e.g. CG Road" placeholderTextColor={colors.inkFaint} style={input} />

      <Label>Nearby landmark (optional)</Label>
      <TextInput value={landmark} onChangeText={setLandmark} placeholder="e.g. Near Fun Republic" placeholderTextColor={colors.inkFaint} style={input} />

      <View style={{ marginBottom: 6 }}>
        <Button
          title={locating ? "Getting your location..." : coords ? "Location confirmed" : "Confirm I'm at my stall"}
          icon={coords ? "check-circle" : "map-pin"}
          variant="outline"
          loading={locating}
          onPress={confirmLocation}
        />
      </View>
      <T variant="caption" style={{ marginBottom: 16 }}>Your business is placed on the map where you're standing right now.</T>

      <Label>Description (optional)</Label>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="What should people know before they visit?"
        placeholderTextColor={colors.inkFaint}
        style={[input, { minHeight: 80, textAlignVertical: "top" }]}
      />

      <Label>Business photo (needed for the Photo verified badge)</Label>
      <View style={{ marginBottom: 16 }}>
        <Button
          title={photo ? "Photo added — tap to change" : "Add a photo"}
          icon="camera"
          variant="outline"
          onPress={async () => {
            const uri = await pickPhoto();
            if (uri) setPhoto(uri);
          }}
        />
      </View>

      <Label>GST number (optional)</Label>
      <TextInput value={gst} onChangeText={setGst} autoCapitalize="characters" placeholder="Only if your business is GST-registered" placeholderTextColor={colors.inkFaint} style={[input, { marginBottom: 6 }]} />
      <T variant="caption" style={{ marginBottom: 18 }}>Most street vendors are under the registration threshold. Adding one upgrades your badge to Registered business.</T>

      <Card style={{ flexDirection: "row", gap: 10, backgroundColor: colors.trustSoft, marginBottom: 20 }}>
        <Feather name="shield" size={16} color={colors.trust} style={{ marginTop: 2 }} />
        <T variant="caption" color={colors.trust} style={{ flex: 1 }}>
          A photo gets you Photo verified. Adding a GST number upgrades you to Registered business.
        </T>
      </Card>

      {!!error && <T variant="small" color={colors.star} style={{ marginBottom: 12 }}>{error}</T>}
      <Button title="List my business" full loading={submit.isPending} onPress={onSubmit} />
    </Screen>
  );
}
