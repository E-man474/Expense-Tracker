import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null); // null = still loading
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    // Current session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setProfileLoaded(true);
      }
    });

    // Login/logout par reload
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setProfile(null);
        setProfileLoaded(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadProfile = async (user) => {
    if (!user) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      user = currentUser;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile({
        name: data.full_name || user.user_metadata?.full_name || "",
        email: data.email || user.email || "",
        currency: data.currency || "PKR",
        theme: data.theme || "Light",
      });
    } else {
      const newProfile = {
        name: user.user_metadata?.full_name || "",
        email: user.email || "",
        currency: "PKR",
        theme: "Light",
      };
      setProfile(newProfile);
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: newProfile.name,
        email: newProfile.email,
        currency: newProfile.currency,
        theme: newProfile.theme,
      });
    }
    setProfileLoaded(true);
  };

  const formatAmount = (amount) => {
    const currency = profile?.currency || "PKR";
    const symbols = { PKR: "Rs.", USD: "$", EUR: "€" };
    const symbol = symbols[currency] || "Rs.";
    return `${symbol} ${Number(amount).toLocaleString()}`;
  };

  return (
    <AppContext.Provider value={{
      profile: profile || { name: "", email: "", currency: "PKR", theme: "Light" },
      setProfile,
      loadProfile,
      formatAmount,
      profileLoaded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}