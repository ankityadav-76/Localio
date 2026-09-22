import { createContext, useContext, useState, type ReactNode } from "react";

type AuthState = {
  userId: number | null;
  phoneNumber: string | null;
  isVendor: boolean;
  login: (userId: number, phoneNumber: string, isVendor: boolean) => void;
  logout: () => void;
};

type StoredSession = {
  userId: number;
  phoneNumber: string;
  isVendor: boolean;
};

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "localio_session";

function readSession(): StoredSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readSession());

  const login = (id: number, phone: string, isVendor: boolean) => {
    const next = { userId: id, phoneNumber: phone, isVendor };
    setSession(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setSession(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        userId: session?.userId ?? null,
        phoneNumber: session?.phoneNumber ?? null,
        isVendor: session?.isVendor ?? false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
