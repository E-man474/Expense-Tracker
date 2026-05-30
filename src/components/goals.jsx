import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdMenu, MdClose } from "react-icons/md";
import { supabase } from "../supabase";

function Goals() {
  const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddSavings, setShowAddSavings] = useState(null); // goal id
  const [savingsAmount, setSavingsAmount] = useState("");
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    title: "", saved_amount: "", target_amount: "", deadline: "", icon: "",
  });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) { console.log(error); return; }
    setGoals(data || []);
    setLoading(false);
  };

  // Notifications — active goals jo 25%+ complete hain
  const allNotifications = goals
    .filter(g => g.status !== "completed")
    .filter(g => {
      const p = Number(g.target_amount) > 0
        ? (Number(g.saved_amount) / Number(g.target_amount)) * 100
        : 0;
      return p >= 25;
    })
    .map(g => {
      const p = Math.round(
        Number(g.target_amount) > 0
          ? (Number(g.saved_amount) / Number(g.target_amount)) * 100
          : 0
      );
      let msg = "";
      if (p >= 100) msg = `🎉 "${g.title}" is almost complete! Mark it as done!`;
      else if (p >= 70) msg = `🔥 "${g.title}" — 70% complete! Keep going!`;
      else if (p >= 50) msg = `💪 "${g.title}" — You are halfway there! 50% done!`;
      else if (p >= 25) msg = `📈 "${g.title}" — Great start! 25% complete!`;
      return { id: g.id, msg, progress: p };
    });

  // Dismissed notifications filter out karo
  const notifications = allNotifications.filter(n => !dismissedNotifications.has(n.id));
  // Unseen count — jinhe user ne abhi dekha nahi
  // unseenCount bell par calculate hota hai directly

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.target_amount || !newGoal.deadline || !newGoal.icon) {
      alert("Please fill all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("goals").insert([{
      user_id: user.id,
      title: newGoal.title,
      saved_amount: Number(newGoal.saved_amount) || 0,
      target_amount: Number(newGoal.target_amount),
      deadline: newGoal.deadline,
      icon: newGoal.icon,
      status: "active", // active | paused | completed
    }]);

    if (error) { alert(error.message); return; }

    setNewGoal({ title: "", saved_amount: "", target_amount: "", deadline: "", icon: "" });
    setShowModal(false);
    fetchGoals();
  };

  // Savings add karo — dashboard ki "This Month Savings" se connected
  const handleAddSavings = async (goalId) => {
    if (!savingsAmount || Number(savingsAmount) <= 0) {
      alert("Amount enter karo");
      return;
    }

    const goal = goals.find(g => g.id === goalId);
    const newSaved = Number(goal.saved_amount) + Number(savingsAmount);
    const isCompleted = newSaved >= Number(goal.target_amount);

    const { error } = await supabase.from("goals")
      .update({
        saved_amount: newSaved,
        status: isCompleted ? "completed" : goal.status,
      })
      .eq("id", goalId);

    if (error) { alert(error.message); return; }

    setSavingsAmount("");
    setShowAddSavings(null);
    fetchGoals();

    if (isCompleted) alert(`🎉 Mubarak! "${goal.title}" goal complete ho gaya!`);
  };

  // Pause / Resume
  const handlePauseResume = async (goal) => {
    const newStatus = goal.status === "paused" ? "active" : "paused";
    const { error } = await supabase.from("goals")
      .update({ status: newStatus })
      .eq("id", goal.id);
    if (error) { alert(error.message); return; }
    fetchGoals();
  };

  // Complete
  const handleComplete = async (goal) => {
    const { error } = await supabase.from("goals")
      .update({ status: "completed", saved_amount: goal.target_amount })
      .eq("id", goal.id);
    if (error) { alert(error.message); return; }
    fetchGoals();
  };

  // Delete
  const handleDelete = async (id) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    fetchGoals();
  };

  const activeGoals = goals.filter(g => g.status !== "completed");
  const completedGoals = goals.filter(g => g.status === "completed");

  const navLinks = [
    { to: "/", label: "📊 Dashboard" },
    { to: "/transactions", label: "📋 Transactions" },
    { to: "/add-expense", label: "➕ Add Expense" },
    { to: "/reports", label: "📈 Reports" },
    { to: "/goals", label: "🎯 Goals" },
    { to: "/settings", label: "⚙️ Settings" },
  ];

  const progressColor = (p) => {
    if (p >= 100) return "bg-green-500";
    if (p >= 70) return "bg-blue-500";
    if (p >= 50) return "bg-yellow-400";
    return "bg-orange-400";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

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

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 lg:hidden"><MdMenu size={24} /></button>
          <h2 className="text-lg font-bold text-gray-700">Goals</h2>

          <div className="flex items-center gap-3">
<button onClick={() => setShowModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
              + Add Goal
            </button>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-800">Savings Goals</h1>
            <p className="text-sm text-gray-400 mt-1">Track your financial goals. Savings dashboard se connect hain.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><p className="text-gray-400">Loading...</p></div>
          ) : goals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center h-60 text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-lg font-bold text-gray-700">No Goals Yet</h2>
              <p className="text-sm text-gray-400 mt-2 mb-4">Apna pehla savings goal set karo.</p>
              <button onClick={() => setShowModal(true)} className="bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">+ Add Goal</button>
            </div>
          ) : (
            <>
              {/* Active Goals */}
              {activeGoals.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-700 mb-4">Active Goals ({activeGoals.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {activeGoals.map((item) => {
                      const progress = Math.min((Number(item.saved_amount) / Number(item.target_amount)) * 100, 100);
                      const isPaused = item.status === "paused";

                      return (
                        <div key={item.id} className={`bg-white rounded-2xl p-5 border shadow-sm transition ${isPaused ? "border-yellow-200 opacity-75" : "border-gray-100"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl">
                                {item.icon}
                              </div>
                              <div>
                                <h2 className="text-lg font-bold text-gray-800">{item.title}</h2>
                                {isPaused && <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Paused</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => !isPaused && handleDelete(item.id)}
                              disabled={isPaused}
                              className={`text-xs ${isPaused ? "text-gray-300 cursor-not-allowed" : "text-red-400 hover:underline"}`}>
                              Delete
                            </button>
                          </div>

                          {/* Amounts */}
                          <div className="flex items-center justify-between text-sm mt-3">
                            <span className="text-gray-400">Saved</span>
                            <span className="font-bold text-green-500">Rs. {Number(item.saved_amount).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-400">Target</span>
                            <span className="font-bold text-gray-700">Rs. {Number(item.target_amount).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-400">Deadline</span>
                            <span className="font-semibold text-red-400">{item.deadline}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mt-4">
                            <div className={`h-full rounded-full transition-all ${progressColor(progress)}`} style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">Progress</span>
                            <span className="text-xs font-bold text-green-500">{Math.round(progress)}%</span>
                          </div>

                          {/* Add Savings — paused ho to disable */}
                          {showAddSavings === item.id ? (
                            <div className="mt-3 flex gap-2">
                              <input type="number" placeholder="Amount" value={savingsAmount}
                                onChange={(e) => setSavingsAmount(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-100" />
                              <button onClick={() => handleAddSavings(item.id)}
                                className="bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-semibold">Save</button>
                              <button onClick={() => { setShowAddSavings(null); setSavingsAmount(""); }}
                                className="text-gray-400 px-2 text-sm">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => !isPaused && setShowAddSavings(item.id)}
                              disabled={isPaused}
                              className={`w-full mt-3 border py-2 rounded-xl text-sm font-semibold transition ${isPaused ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50" : "border-green-500 text-green-500 hover:bg-green-50"}`}>
                              + Add Savings
                            </button>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-2">
                            {/* Pause / Resume */}
                            <button onClick={() => handlePauseResume(item)}
                              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition border ${isPaused ? "bg-green-50 border-green-400 text-green-600 hover:bg-green-100" : "bg-yellow-50 border-yellow-400 text-yellow-600 hover:bg-yellow-100"}`}>
                              {isPaused ? "▶ Resume" : "⏸ Pause"}
                            </button>

                            {/* Complete — paused ho to disable */}
                            <button
                              onClick={() => !isPaused && handleComplete(item)}
                              disabled={isPaused}
                              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${isPaused ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50" : "bg-blue-50 border-blue-400 text-blue-600 hover:bg-blue-100"}`}>
                              ✅ Complete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Goals */}
              {completedGoals.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-700 mb-4">Completed Goals 🎉 ({completedGoals.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {completedGoals.map((item) => (
                      <div key={item.id} className="bg-green-50 rounded-2xl p-5 border border-green-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">{item.icon}</div>
                            <div>
                              <h2 className="text-lg font-bold text-gray-800">{item.title}</h2>
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Completed ✅</span>
                            </div>
                          </div>
                          <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">Delete</button>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-500">Total Saved</span>
                          <span className="font-bold text-green-600">Rs. {Number(item.saved_amount).toLocaleString()}</span>
                        </div>
                        <div className="w-full h-3 bg-green-200 rounded-full overflow-hidden mt-3">
                          <div className="h-full bg-green-500 rounded-full w-full" />
                        </div>
                        <p className="text-xs text-green-600 font-semibold mt-2 text-right">100% Complete 🎉</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Add New Goal</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Goal Title (e.g New Laptop)"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />

              <input type="number" placeholder="Already Saved Amount (0 bhi ho sakta)"
                value={newGoal.saved_amount}
                onChange={(e) => setNewGoal({ ...newGoal, saved_amount: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />

              <input type="number" placeholder="Target Amount"
                value={newGoal.target_amount}
                onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />

              <input type="date" value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />

              <div>
                <label className="text-sm text-gray-600 block mb-3">Select Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {["💻", "✈️", "🏦", "🚗", "🏠", "📱", "🎓", "🛒", "🎮", "💍"].map((emoji) => (
                    <button key={emoji} onClick={() => setNewGoal({ ...newGoal, icon: emoji })}
                      className={`h-12 rounded-xl text-2xl border transition ${newGoal.icon === emoji ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleAddGoal}
                className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition">
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default Goals;