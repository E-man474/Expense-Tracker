import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdMenu, MdClose } from "react-icons/md";
import { supabase } from "../supabase";
import { useApp } from "../context/Appcontext";

function Transactions() {
  const location = useLocation();
  const { formatAmount } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newTransaction, setNewTransaction] = useState({
    title: "",
    category: "",
    date: "",
    amount: "",
    type: "Expense",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) {
      console.log(error.message);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.title || !newTransaction.category || !newTransaction.date || !newTransaction.amount) {
      alert("Please fill all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // transactions table mein hamesha save karo
    const { error } = await supabase.from("transactions").insert([{
      user_id: user.id,
      title: newTransaction.title,
      category: newTransaction.category,
      transaction_date: newTransaction.date,
      amount: Number(newTransaction.amount),
      type: newTransaction.type,
    }]);

    if (error) {
      alert(error.message);
      return;
    }

    // Agar Expense hai to expenses table mein bhi save karo
    // taake Add Expense history, Categories aur Reports mein bhi dikhe
    if (newTransaction.type === "Expense") {
      await supabase.from("expenses").insert([{
        user_id: user.id,
        title: newTransaction.title,
        amount: Number(newTransaction.amount),
        category: newTransaction.category,
        expense_date: newTransaction.date,
        note: "",
      }]);
    }

    setNewTransaction({ title: "", category: "", date: "", amount: "", type: "Expense" });
    setShowAddModal(false);
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    fetchTransactions();
  };

  const handleEdit = (item) => {
    setSelectedTransaction({ ...item });
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    const { error } = await supabase
      .from("transactions")
      .update({
        title: selectedTransaction.title,
        category: selectedTransaction.category,
        transaction_date: selectedTransaction.transaction_date,
        amount: Number(selectedTransaction.amount),
        type: selectedTransaction.type,
      })
      .eq("id", selectedTransaction.id);

    if (error) { alert(error.message); return; }
    setShowEditModal(false);
    setSelectedTransaction(null);
    fetchTransactions();
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
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-white border-r border-gray-100 flex flex-col z-50
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            📊 Expense <span className="text-green-500">Tracker</span>
          </h1>
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(false)}>
            <MdClose size={22} />
          </button>
        </div>

        <ul className="flex flex-col gap-2 mt-4 px-3 text-base">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  location.pathname === to
                    ? "text-green-500 bg-green-50"
                    : "text-gray-500 hover:text-green-500 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">

        <nav className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 lg:hidden">
            <MdMenu size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-700">Transactions</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            + Add Transaction
          </button>
        </nav>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">

          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
            <p className="text-sm text-gray-400 mt-1">Manage all your income and expenses.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center h-60 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-lg font-bold text-gray-700">No Transactions Yet</h2>
              <p className="text-sm text-gray-400 mt-2">Add your first transaction above.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-5 bg-gray-50 px-6 py-4 border-b border-gray-100 text-sm font-semibold text-gray-500">
                  <p>Description</p>
                  <p>Category</p>
                  <p>Date</p>
                  <p>Amount</p>
                  <p className="text-right">Actions</p>
                </div>

                {transactions.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-5 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        item.type === "Income" ? "bg-green-50" : "bg-red-50"
                      }`}>
                        {item.type === "Income" ? "💼" : "💸"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">{item.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === "Income"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-500"
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm">{item.category}</p>
                    <p className="text-gray-500 text-sm">{item.transaction_date}</p>
                    <p className={`font-bold text-sm ${
                      item.type === "Income" ? "text-green-500" : "text-red-500"
                    }`}>
                      {item.type === "Income" ? "+" : "-"} {formatAmount(item.amount)}
                    </p>

                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(item)} className="text-blue-500 hover:underline text-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Add Transaction</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Transaction Title" value={newTransaction.title}
                onChange={(e) => setNewTransaction({ ...newTransaction, title: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
              <input type="text" placeholder="Category (e.g Food, Salary)" value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
              <input type="date" value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
              <input type="number" placeholder="Amount" value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100" />
              <select value={newTransaction.type}
                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100">
                <option>Expense</option>
                <option>Income</option>
              </select>
              <button onClick={handleAddTransaction}
                className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition">
                Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Edit Transaction</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedTransaction(null); }}
                className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Title" value={selectedTransaction.title}
                onChange={(e) => setSelectedTransaction({ ...selectedTransaction, title: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" />
              <input type="text" placeholder="Category" value={selectedTransaction.category}
                onChange={(e) => setSelectedTransaction({ ...selectedTransaction, category: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" />
              <input type="date" value={selectedTransaction.transaction_date}
                onChange={(e) => setSelectedTransaction({ ...selectedTransaction, transaction_date: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" />
              <input type="number" placeholder="Amount" value={selectedTransaction.amount}
                onChange={(e) => setSelectedTransaction({ ...selectedTransaction, amount: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" />
              <select value={selectedTransaction.type}
                onChange={(e) => setSelectedTransaction({ ...selectedTransaction, type: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100">
                <option>Expense</option>
                <option>Income</option>
              </select>
              <button onClick={handleSaveChanges}
                className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;