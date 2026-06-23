import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CurrentUser {
  username: string;
  name: string;
  badge: string;
  role: "police" | "citizen";
}

interface UserContextType {
  user: CurrentUser | null;
  login: (u: CurrentUser) => void;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const UserContext = createContext<UserContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

const SESSION_KEY = "crimichain_user";

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<CurrentUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = (u: CurrentUser) => {
    setUser(u);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
    queryClient.invalidateQueries();
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
    }
    queryClient.invalidateQueries();
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}

// ─── SHA-256 hash helper (browser-native) ─────────────────────────────────────
export async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
