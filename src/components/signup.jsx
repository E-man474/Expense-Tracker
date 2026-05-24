import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Signup() {

  const navigate = useNavigate();

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignup = async (e) => {

    e.preventDefault();

    if (
      !signupData.name ||
      !signupData.email ||
      !signupData.password ||
      !signupData.confirmPassword
    ) {
      alert("Please fill all fields");
      return;
    }

    if (
      signupData.password !==
      signupData.confirmPassword
    ) {
      alert("Passwords do not match");
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({

        email: signupData.email,

        password: signupData.password,

        options: {

          data: {
            full_name: signupData.name,
          },
        },
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account Created Successfully");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        <div className="hidden lg:flex flex-col justify-center bg-green-500 text-white p-10">

          <h1 className="text-5xl font-bold leading-tight">
            Create Account 🚀
          </h1>

          <p className="text-lg mt-5 text-green-100 leading-8">
            Start managing your income, expenses,
            and savings goals with Expense Tracker.
          </p>

          <div className="mt-10 flex flex-col gap-4">

            <div className="bg-white/10 rounded-2xl p-4">
              📊 Track Daily Expenses
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              💰 Manage Your Budget
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              🎯 Achieve Financial Goals
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 flex flex-col justify-center">

          <div className="mb-8 text-center">

            <h2 className="text-3xl font-bold text-gray-800">
              Create Account
            </h2>

            <p className="text-gray-400 mt-2">
              Register to continue
            </p>
          </div>

          <form
            onSubmit={handleSignup}
            className="flex flex-col gap-5"
          >

            <div>

              <label className="text-sm text-gray-600 block mb-2">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                value={signupData.name}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    name: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>

              <label className="text-sm text-gray-600 block mb-2">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
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
                placeholder="Enter password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    password: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>

              <label className="text-sm text-gray-600 block mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm password"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({
                    ...signupData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-100"
              />
            </div>

            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-semibold transition"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6">

            Already have an account?{" "}

            <Link
              to="/login"
              className="text-green-500 font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;