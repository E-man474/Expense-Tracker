import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Login() {

  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {

    e.preventDefault();

    if (
      !loginData.email ||
      !loginData.password
    ) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({

        email: loginData.email,

        password: loginData.password,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Login Successful");

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        <div className="hidden lg:flex flex-col justify-center bg-green-500 text-white p-10">

          <h1 className="text-5xl font-bold leading-tight">
            Welcome Back 👋
          </h1>

          <p className="text-lg mt-5 text-green-100 leading-8">
            Track your expenses, manage your budget,
            and achieve your financial goals easily
            with Expense Tracker.
          </p>

          <div className="mt-10 flex flex-col gap-4">

            <div className="bg-white/10 rounded-2xl p-4">
              📊 Smart Expense Tracking
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              💰 Budget Management
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              🎯 Financial Goals
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 flex flex-col justify-center">

          <div className="mb-8 text-center">

            <h2 className="text-3xl font-bold text-gray-800">
              Login Account
            </h2>

            <p className="text-gray-400 mt-2">
              Please login to continue
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-5"
          >

            <div>

              <label className="text-sm text-gray-600 block mb-2">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    email: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>

              <label className="text-sm text-gray-600 block mb-2">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({
                    ...loginData,
                    password: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="flex items-center justify-between text-sm">

              <label className="flex items-center gap-2 text-gray-500">

                <input type="checkbox" />

                Remember me
              </label>

              <button
                type="button"
                className="text-green-500 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-semibold transition"
            >
              {
                loading
                  ? "Loading..."
                  : "Login"
              }
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6">

            Don’t have an account?{" "}

            <Link
              to="/signup"
              className="text-green-500 font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;