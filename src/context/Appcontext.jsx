import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: "PKR",
    theme: "Light",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user);
    });
  }, []); // sirf ek baar — onAuthStateChange nahi

  const loadProfile = async (user) => {
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      user = u;
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
  };

  const formatAmount = (amount) => {
    const symbols = { PKR: "Rs.", USD: "$", EUR: "€" };
    const symbol = symbols[profile.currency] || "Rs.";
    return `${symbol} ${Number(amount).toLocaleString()}`;
  };

  return (
    <AppContext.Provider value={{ profile, setProfile, loadProfile, formatAmount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}