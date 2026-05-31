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
  });

  useEffect(() => {
    if (profile.name) {
      setUserData({
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

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
      })
      .eq("user_id", user.id);

    if (error) {
      alert(error.message);
    } else {
      await loadProfile();
      setProfile({
        name: userData.name,
        email: user.email,
        currency: userData.currency,
      });
      alert("Profile Updated Successfully");
    }

    setLoading(false);
  };

  const handleLogout = async () => {
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
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold">📊 Expense <span className="text-green-500">Tracker</span></h1>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}><MdClose size={22} /></button>
        </div>
        <ul className="flex flex-col gap-1 mt-4 px-3 text-base">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${location.pathname === to ? "text-green-500 bg-green-50" : "text-gray-500 hover:text-green-500 hover:bg-gray-50"}`}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <nav className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 lg:hidden"><MdMenu size={24} /></button>
          <h2 className="text-lg font-bold text-gray-700">Settings</h2>
        </nav>

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left */}
            <div className="xl:col-span-2 flex flex-col gap-6">

              {/* Profile */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-5">Profile Settings</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Full Name</label>
                    <input type="text" value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Email Address</label>
                    <input type="email" value={userData.email} readOnly
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none bg-gray-50 text-gray-400 cursor-not-allowed" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60">
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-5">App Preferences</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Currency</label>
                    <select value={userData.currency}
                      onChange={(e) => setUserData({ ...userData, currency: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100">
                      <option value="PKR">🇵🇰 PKR — Rs.</option>
                      <option value="USD">🇺🇸 USD — $</option>
                      <option value="EUR">🇪🇺 EUR — €</option>
                    </select>
                  </div>
                  <button onClick={handleSaveProfile}
                    className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition">
                    Update Preferences
                  </button>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-4xl">
                    👤
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mt-4">
                    {userData.name || "User"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">{userData.email}</p>
                  <div className="mt-3 px-3 py-1 bg-green-50 rounded-full">
                    <p className="text-xs text-green-600 font-medium">
                      Currency: {userData.currency === "PKR" ? "Rs. PKR" : userData.currency === "USD" ? "$ USD" : "€ EUR"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Account</h2>
                <p className="text-sm text-gray-400 mb-5">Logout from your account</p>
                <button onClick={handleLogout}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;