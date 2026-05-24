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
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile.theme === "Dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [profile.theme]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    } else if (user.user_metadata?.full_name) {
      const newProfile = {
        name: user.user_metadata.full_name,
        email: user.email,
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