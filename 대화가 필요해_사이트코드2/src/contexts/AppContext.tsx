import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase, User } from "../lib/supabase";

type AppContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  login: (nickname: string, email: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  dbReady: boolean;
};

const AppContext = createContext<AppContextType | null>(null);

const SERVER_URL = `https://ihohircjejwpdvtfdflc.supabase.co/functions/v1/make-server-0cd82ee9`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Init DB schema
    fetch(`${SERVER_URL}/setup`, { method: "POST" })
      .catch(() => {})
      .finally(() => setDbReady(true));

    // Restore session
    const stored = localStorage.getItem("challenge_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    if (localStorage.getItem("challenge_admin") === "1") {
      setIsAdmin(true);
    }
  }, []);

  async function login(nickname: string, email: string): Promise<User> {
    // Upsert user
    const { data, error } = await supabase
      .from("users")
      .upsert({ nickname, email }, { onConflict: "email" })
      .select()
      .single();
    if (error) throw error;
    const u = data as User;
    setUser(u);
    localStorage.setItem("challenge_user", JSON.stringify(u));
    return u;
  }

  function logout() {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("challenge_user");
    localStorage.removeItem("challenge_admin");
  }

  return (
    <AppContext.Provider value={{ user, setUser, login, logout, isAdmin, setIsAdmin, dbReady }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
