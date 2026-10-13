import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { Session } from "../types";

const KEY = "localio_session";

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (session: Session) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      set({ session: raw ? (JSON.parse(raw) as Session) : null, hydrated: true });
    } catch {
      set({ session: null, hydrated: true });
    }
  },
  login: async (session) => {
    set({ session });
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify(session));
    } catch {
      // session still works for this run even if persisting fails
    }
  },
  logout: async () => {
    set({ session: null });
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch {
      // ignore
    }
  },
}));
