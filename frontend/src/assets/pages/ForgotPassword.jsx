import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API;

const schema = yup.object({
  email: yup.string().trim().email("Enter a valid email").required("Email is required"),
});

export const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/password/forgot`, { email: data.email });
      toast.success(res.data.message);
      setSent(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/motorcycled-logo.png" alt="Motorcycled Logo" className="h-7 w-auto object-contain" />
            <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">Motorcycled</span>
          </div>
          <span className="text-xs text-zinc-500">Account Portal</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Reset your password</h1>
            <p className="text-xs text-zinc-500 mt-1">
              {sent
                ? "If an account exists, we've sent you a reset link."
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-zinc-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="rider@example.com"
                  className={`h-10 w-full px-3 py-2 text-sm text-zinc-900 bg-white border rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-1 ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600"
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-10 w-full px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-600 mb-4">Check your email for the reset link.</p>
              <Link to="/login" className="text-sm text-emerald-700 hover:underline">
                Back to login
              </Link>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              Remember your password?{" "}
              <Link to="/login" className="font-medium text-emerald-700 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
