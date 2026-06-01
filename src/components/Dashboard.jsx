import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdMenu, MdClose } from "react-icons/md";
import { supabase } from "../supabase";
import { useApp } from "../context/Appcontext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

function Dashboard() {
  const location = useLocation();
  const { profile, formatAmount } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  const [userName, setUserName] = useState("");
  const [allTransactions, setAllTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newExpense, setNewExpense] = useState({ title: "", amount: "", category: "Food" });
  const [salaryData, setSalaryData] = useState({ title: "Salary", amount: "", date: "" });

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { if (profile.name) setUserName(profile.name.split(" ")[0]); }, [profile.name]);

  const fetchAllData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profileData } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).single();
    if (profileData?.full_name) {
      setUserName(profileData.full_name.split(" ")[0]);
    } else if (user.user_metadata?.full_name) {
      const fullName = user.user_metadata.full_name;
      setUserName(fullName.split(" ")[0]);
      await supabase.from("profiles").upsert({ user_id: user.id, full_name: fullName, email: user.email, currency: "PKR", theme: "Light" });
    }

    const { data: txData } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("id", { ascending: false });
    setAllTransactions(txData || []);

    const { data: goalsData } = await supabase.from("goals").select("*").eq("user_id", user.id).limit(3);
    setGoals(goalsData || []);

    setLoading(false);
  };

  // now yahan define karo — sab jagah use hoga
  const now = new Date();

  // --- Stats Calculation ---
  // Total Balance — sab months ka (all time)
  const totalIncome = allTransactions.filter(t => t.type === "Income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = allTransactions.filter(t => t.type === "Expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalBalance = totalIncome - totalExpenses;

  // This Month Savings — sirf current month ki income - current month ke expenses
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const thisMonthTransactions = allTransactions.filter(t => {
    const d = new Date(t.transaction_date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const thisMonthIncome = thisMonthTransactions
    .filter(t => t.type === "Income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const thisMonthExpenses = thisMonthTransactions
    .filter(t => t.type === "Expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const thisMonthSavings = thisMonthIncome - thisMonthExpenses;

  const recentTransactions = allTransactions.slice(0, 5);

  // --- Pie Chart Data — sirf current month ke expenses ---
  const categoryTotals = {};
  thisMonthTransactions.filter(t => t.type === "Expense").forEach(t => {
    const cat = t.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
  });
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  // --- Monthly Trend (last 6 months) ---
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), num: d.getMonth() + 1, income: 0, expense: 0 });
  }
  allTransactions.forEach(t => {
    const d = new Date(t.transaction_date);
    const m = months.find(x => x.num === d.getMonth() + 1 && x.year === d.getFullYear());
    if (m) { if (t.type === "Income") m.income += Number(t.amount); else m.expense += Number(t.amount); }
  });


  // --- Add Expense Handler --- saves to transactions table
  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) { alert("Please fill all fields"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("transactions").insert([{
      user_id: user.id,
      title: newExpense.title,
      amount: Number(newExpense.amount),
      category: newExpense.category,
      transaction_date: today,
      type: "Expense",
    }]);
    if (error) { alert(error.message); return; }
    setNewExpense({ title: "", amount: "", category: "Food" });
    setShowExpenseModal(false);
    fetchAllData();
  };

  // --- Add Salary (Income Transaction) Handler ---
  const handleAddSalary = async () => {
    if (!salaryData.amount || !salaryData.date) { alert("Please fill all fields"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("transactions").insert([{ user_id: user.id, title: salaryData.title, amount: Number(salaryData.amount), type: "Income", category: "Salary", transaction_date: salaryData.date }]);
    if (error) { alert(error.message); return; }
    setSalaryData({ title: "Salary", amount: "", date: "" });
    setShowSalaryModal(false);
    fetchAllData();
  };

  const navLinks = [
    { to: "/", label: "📊 Dashboard" },
    { to: "/transactions", label: "📋 Transactions" },
    { to: "/add-expense", label: "➕ Add Expense" },
   
    { to: "/reports", label: "📈 Reports" },
    { to: "/goals", label: "🎯 Goals" },
    { to: "/settings", label: "⚙️ Settings" },
  ];

  const monthName = now.toLocaleString("default", { month: "long" });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-bold dark:text-white">📊 Expense <span className="text-green-500">Tracker</span></h1>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}><MdClose size={22} /></button>
        </div>
        <ul className="flex flex-col gap-1 mt-4 px-3 text-base">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${location.pathname === to ? "text-green-500 bg-green-50 dark:bg-green-900/20" : "text-gray-500 dark:text-gray-400 hover:text-green-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <nav className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 lg:hidden"><MdMenu size={24} /></button>
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-lg">
            📅 {monthName} 1 – {monthName} 31, {now.getFullYear()}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSalaryModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl transition">
              + Add Salary
            </button>
            <button onClick={() => setShowExpenseModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-xl transition">
              + Add Expense
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <p className="text-gray-400 text-lg">Loading...</p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-800">Welcome back, {userName}! 👋</h1>
                <p className="text-sm text-gray-400 mt-1">Here's what's happening with your finances today.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {/* Total Balance */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl">💳</div>
                    <p className="text-sm text-gray-500 font-medium">Total Balance</p>
                  </div>
                  <p className={`text-2xl font-bold ${totalBalance >= 0 ? "text-green-500" : "text-red-500"}`}>{formatAmount(totalBalance)}</p>
                  <p className="text-xs text-gray-400 mt-1">Income – Expenses</p>
                </div>

                {/* Total Income */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl">💼</div>
                      <p className="text-sm text-gray-500 font-medium">Total Income</p>
                    </div>
                    <button onClick={() => setShowSalaryModal(true)} className="text-xs text-blue-500 hover:underline font-medium">+ Add</button>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">
  {formatAmount(totalIncome)}
</p>
                  <p className="text-xs text-gray-400 mt-1">From salary & income</p>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xl">💸</div>
                    <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
                  </div>
                  <p className="text-2xl font-bold text-red-500">
  {formatAmount(totalExpenses)}
</p>
                  <p className="text-xs text-gray-400 mt-1">All spending combined</p>
                </div>

                {/* Savings */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-xl">🏦</div>
                    <p className="text-sm text-gray-500 font-medium">This Month Savings</p>
                  </div>
                  <p className={`text-2xl font-bold ${thisMonthSavings >= 0 ? "text-purple-500" : "text-red-500"}`}>
                    {formatAmount(thisMonthSavings)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {thisMonthIncome === 0 ? "No income added this month" : `Income - Expenses this month`}
                  </p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">

                {/* Expense Overview Pie */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Expense Overview</h2>
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">This Month</span>
                  </div>
                  {pieData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-52 text-gray-400 text-sm">No expense data yet</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatAmount(Number(v))} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {pieData.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="text-gray-600">{item.name}</span>
                            </div>
                            <span className="font-semibold text-gray-700">
  {formatAmount(Number(item.value))}
</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Monthly Trend Line Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Monthly Trend</h2>
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">Last 6 Months</span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs text-gray-500">Income</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-gray-500">Expense</span></div>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={months}>
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                      <Tooltip formatter={(v) => formatAmount(v)} />
                      <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: "#22c55e" }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Transactions + Goals */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Recent Transactions */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
                    <Link to="/transactions" className="text-sm text-green-500 hover:underline">View All</Link>
                  </div>
                  {recentTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-gray-400 text-sm">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {recentTransactions.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${item.type === "Income" ? "bg-green-50" : "bg-red-50"}`}>
                              {item.type === "Income" ? "💼" : "💸"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-700 text-sm">{item.title}</p>
                              <p className="text-xs text-gray-400">{item.transaction_date} · {item.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${item.type === "Income" ? "text-green-500" : "text-red-500"}`}>
                              {item.type === "Income" ? "+" : "-"} {formatAmount(item.amount)}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === "Income" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                              {item.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Goals */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Savings Goals</h2>
                    <Link to="/goals" className="text-sm text-green-500 hover:underline">View All</Link>
                  </div>
                  {goals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <div className="text-4xl mb-3">🎯</div>
                      <p className="text-gray-400 text-sm">No goals yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {goals.map((goal) => {
                        const progress = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
                        return (
                          <div key={goal.id}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{goal.icon}</span>
                                <span className="font-semibold text-gray-700 text-sm">{goal.title}</span>
                              </div>
                              <span className="text-xs text-green-500 font-semibold">{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{formatAmount(goal.saved_amount)} / {formatAmount(goal.target_amount)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">Add New Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Description (e.g Grocery)" value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
              <input type="number" placeholder="Amount" value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
              <select value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={handleAddExpense} className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition">+ Save Expense</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Salary Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">Add Salary / Income</h2>
              <button onClick={() => setShowSalaryModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Title (e.g Salary, Freelance)" value={salaryData.title}
                onChange={(e) => setSalaryData({ ...salaryData, title: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" />
              <input type="number" placeholder="Amount" value={salaryData.amount}
                onChange={(e) => setSalaryData({ ...salaryData, amount: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" />
              <input type="date" value={salaryData.date}
                onChange={(e) => setSalaryData({ ...salaryData, date: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" />
              <button onClick={handleAddSalary} className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition">+ Save Income</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;