import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Patch global fetch once on the client to attach the Supabase access token
// to TanStack Start server-function requests, so middleware can authenticate.
if (typeof window !== "undefined" && !(window as unknown as { __sfPatched?: boolean }).__sfPatched) {
  (window as unknown as { __sfPatched?: boolean }).__sfPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("/_serverFn/")) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
        return originalFetch(input, { ...init, headers });
      }
    }
    return originalFetch(input, init);
  };
}

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
