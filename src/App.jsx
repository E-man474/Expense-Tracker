import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/Appcontext";

import Login from "./components/login";
import Signup from "./components/signup";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/transaction";
import AddExpense from "./components/add-expense";
import Reports from "./components/reports";
import Goals from "./components/goals";
import Settings from "./components/setting";
import ProtectedRoute from "./components/Protectedroute";

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;