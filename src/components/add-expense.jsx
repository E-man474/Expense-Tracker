import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdMenu, MdClose } from "react-icons/md";
import { supabase } from "../supabase";
import { useApp } from "../context/AppContext";

function AddExpense() {
  const location = useLocation();
  const { formatAmount } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [expenseData, setExpenseData] = useState({
    title: "", amount: "", category: "", date: "", note: "",
  });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // transactions table se sirf Expense type
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "Expense")
      .order("id", { ascending: false });

    if (error) { console.log(error.message); return; }
    setExpenses(data || []);
  };

  const handleAddExpense = async () => {
    if (!expenseData.title || !expenseData.amount || !expenseData.category || !expenseData.date) {
      alert("Please fill all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // sirf transactions table mein save
    const { error } = await supabase.from("transactions").insert([{
      user_id: user.id,
      title: expenseData.title,
      amount: Number(expenseData.amount),
      category: expenseData.category,
      transaction_date: expenseData.date,
      type: "Expense",
    }]);

    if (error) { alert(error.message); return; }

    setExpenseData({ title: "", amount: "", category: "", date: "", note: "" });
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    fetchExpenses();
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
        <nav className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 lg:hidden"><MdMenu size={24} /></button>
          <h2 className="text-lg font-bold text-gray-700">Add Expense</h2>
        </nav>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Add Expense</h1>
              <p className="text-sm text-gray-400 mt-1">Track your daily expenses easily.</p>
            </div>
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <h2 className="text-2xl font-bold text-red-500 mt-1">
                {formatAmount(expenses.reduce((t, i) => t + Number(i.amount), 0))}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Form */}
            <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-xl font-bold text-gray-800 mb-5">Expense Form</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Expense Title</label>
                  <input type="text" placeholder="e.g Food" value={expenseData.title}
                    onChange={(e) => setExpenseData({ ...expenseData, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Amount</label>
                  <input type="number" placeholder="e.g 2000" value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Category</label>
                  <select value={expenseData.category}
                    onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100">
                    <option value="">Select Category</option>
                    <option>Food</option>
                    <option>Shopping</option>
                    <option>Transport</option>
                    <option>Bills</option>
                    <option>Entertainment</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Date</label>
                  <input type="date" value={expenseData.date}
                    onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
                </div>
                <button onClick={handleAddExpense}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition">
                  + Save Expense
                </button>
              </div>
            </div>

            {/* History */}
            <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800">Expense History</h2>
                <span className="text-sm text-gray-400">{expenses.length} Expenses</span>
              </div>

              {expenses.length === 0 ? (
                <div className="h-72 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">📂</div>
                  <h2 className="text-xl font-bold text-gray-700">No Expenses Yet</h2>
                  <p className="text-sm text-gray-400 mt-2">Add your first expense to see history here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {expenses.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">💸</div>
                        <div>
                          <h3 className="font-semibold text-gray-700">{item.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{item.category}</p>
                          <p className="text-xs text-gray-400 mt-1">{item.transaction_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <h2 className="text-lg font-bold text-red-500">- {formatAmount(item.amount)}</h2>
                          <p className="text-xs text-gray-400 mt-1">Expense</p>
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 text-sm font-medium">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddExpense;