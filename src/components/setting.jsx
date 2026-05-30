import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdMenu, MdClose } from "react-icons/md";
import { supabase } from "../supabase";
import { useApp } from "../context/Appcontext";

function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, setProfile, loadProfile } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    currency: "PKR",
    theme: "Light",
  });

  // Load profile into form
  useEffect(() => {
    if (profile.name) {
      setUserData({
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
        theme: profile.theme,
      });
    }
  }, [profile]);

  // Theme apply
  useEffect(() => {
    if (userData.theme === "Dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [userData.theme]);

  // ✅ FIXED SAVE FUNCTION
  const handleSaveProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: userData.name,
        email: user.email,
        currency: userData.currency,
        theme: userData.theme,
      })
      .eq("user_id", user.id);

    if (error) {
      alert(error.message);
    } else {
      await loadProfile(); // 🔥 important refresh

      setProfile({
        name: userData.name,
        email: user.email,
        currency: userData.currency,
        theme: userData.theme,
      });

      alert("Profile Updated Successfully");
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    document.documentElement.classList.remove("dark");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "📊 Dashboard" },
    { to: "/transactions", label: "📋 Transactions" },
    { to: "/add-expense", label: "➕ Add Expense" },
    { to: "/reports", label: "📈 Reports" },
    { to: "/goals", label: "🎯 Goals" },
    { to: "/settings", label: "⚙️ Settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-white dark:bg-gray-800 border-r flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="px-4 py-4 border-b flex justify-between">
          <h1 className="font-bold">Expense Tracker</h1>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <MdClose />
          </button>
        </div>

        <ul className="mt-4 px-3 flex flex-col gap-2">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-2 rounded-lg ${
                location.pathname === to
                  ? "bg-green-100 text-green-600"
                  : "text-gray-500"
              }`}
            >
              {label}
            </Link>
          ))}
        </ul>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <nav className="flex justify-between p-4 border-b bg-white dark:bg-gray-800">
          <button onClick={() => setSidebarOpen(true)}>
            <MdMenu size={22} />
          </button>
          <h2 className="font-bold">Settings</h2>
        </nav>

        <div className="p-6 space-y-6">
          {/* Profile */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
            <h2 className="font-bold mb-4">Profile</h2>

            <input
              className="w-full p-2 border mb-3"
              placeholder="Name"
              value={userData.name}
              onChange={(e) =>
                setUserData({ ...userData, name: e.target.value })
              }
            />

            <input
              className="w-full p-2 border mb-3"
              placeholder="Email"
              value={userData.email}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
            />

            <button
              onClick={handleSaveProfile}
              className="bg-green-500 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
            <h2 className="font-bold mb-4">Preferences</h2>

            <select
              value={userData.currency}
              onChange={(e) =>
                setUserData({ ...userData, currency: e.target.value })
              }
              className="w-full p-2 border mb-3"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setUserData({ ...userData, theme: "Light" })
                }
                className="px-3 py-2 border"
              >
                Light
              </button>

              <button
                onClick={() =>
                  setUserData({ ...userData, theme: "Dark" })
                }
                className="px-3 py-2 border"
              >
                Dark
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;