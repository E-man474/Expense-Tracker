import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdMenu, MdClose } from "react-icons/md";
import { supabase } from "../supabase";
import { useApp } from "../context/Appcontext";

function Reports() {
  const location = useLocation();
  const { formatAmount } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    setAllTransactions(data || []);
    setLoading(false);
  };

  const expenses = allTransactions.filter(t => t.type === "Expense");
  const incomes = allTransactions.filter(t => t.type === "Income");

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);

  // Category wise group
  const categoryMap = {};
  expenses.forEach((e) => {
    const cat = e.category || "Other";
    if (!categoryMap[cat]) categoryMap[cat] = { name: cat, amount: 0 };
    categoryMap[cat].amount += Number(e.amount);
  });
  const reportData = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

  const highestExpense = reportData.length > 0 ? reportData[0] : null;
  const lowestExpense = reportData.length > 0 ? reportData[reportData.length - 1] : null;

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];
  const catIcons = { Food: "🍔", Transport: "🚕", Shopping: "🛍️", Bills: "💡", Entertainment: "🎬", Other: "📦" };

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

      <div className="flex-1 overflow-y-auto">
        <nav className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 lg:hidden"><MdMenu size={24} /></button>
          <h2 className="text-lg font-bold text-gray-700">Reports</h2>
        </nav>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <p className="text-gray-400 text-lg">Loading Reports...</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Expense Overview</h2>
                      <p className="text-sm text-gray-400 mt-1">Category wise expense summary</p>
                    </div>
                    <div className="bg-green-50 px-4 py-3 rounded-2xl text-center">
                      <p className="text-sm text-gray-500">Total Expense</p>
                      <h3 className="text-2xl font-bold text-green-500">{formatAmount(totalExpense)}</h3>
                    </div>
                  </div>

                  {reportData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <div className="text-5xl mb-3">📊</div>
                      <p className="text-gray-400 text-sm">No expense data yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {reportData.map((item, i) => (
                        <div key={item.name}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl">
                                {catIcons[item.name] || "📦"}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-700">{item.name}</h3>
                                <p className="text-sm text-gray-400">{formatAmount(item.amount)}</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-500">
                              {totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0}%
                            </p>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0}%`,
                              background: COLORS[i % COLORS.length]
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-[300px] flex flex-col gap-5">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h2>
                  <div className="flex flex-col gap-3">
                    <div className="bg-green-50 rounded-2xl p-4">
                      <p className="text-sm text-gray-400">Total Income</p>
                      <h3 className="text-xl font-bold text-green-500 mt-1">{formatAmount(totalIncome)}</h3>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-4">
                      <p className="text-sm text-gray-400">Highest Category</p>
                      <h3 className="text-xl font-bold text-red-500 mt-1">{highestExpense?.name || "No Data"}</h3>
                      {highestExpense && <p className="text-sm text-gray-500 mt-1">{formatAmount(highestExpense.amount)}</p>}
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4">
                      <p className="text-sm text-gray-400">Lowest Category</p>
                      <h3 className="text-xl font-bold text-blue-500 mt-1">{lowestExpense?.name || "No Data"}</h3>
                      {lowestExpense && <p className="text-sm text-gray-500 mt-1">{formatAmount(lowestExpense.amount)}</p>}
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-4">
                      <p className="text-sm text-gray-400">Total Transactions</p>
                      <h3 className="text-xl font-bold text-purple-500 mt-1">{allTransactions.length}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;