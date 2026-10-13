import { Alert } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

export type Coords = { lat: number; lng: number };

/** Current GPS position, or null if permission is denied/unavailable. */
export async function getCoords(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

/** Asks camera-or-gallery, returns the picked image URI (or null if cancelled). */
export function pickPhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert(
      "Add a photo",
      undefined,
      [
        {
          text: "Take photo",
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) return resolve(null);
            const r = await ImagePicker.launchCameraAsync({ quality: 0.6 });
            resolve(r.canceled ? null : r.assets[0].uri);
          },
        },
        {
          text: "Choose from gallery",
          onPress: async () => {
            const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
            resolve(r.canceled ? null : r.assets[0].uri);
          },
        },
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}

/** Builds the { uri, name, type } object React Native's FormData expects for a file. */
export function photoPart(uri: string): Blob {
  return { uri, name: "photo.jpg", type: "image/jpeg" } as unknown as Blob;
}
