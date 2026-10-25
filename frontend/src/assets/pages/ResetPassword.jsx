import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API = import.meta.env.VITE_API;

const schema = yup.object({
  password: yup.string().min(8, "Must be at least 8 characters").required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm your password"),
});

export const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

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
      const res = await axios.put(`${API}/password/reset/${token}`, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success(res.data.message);
      setTimeout(() => navigate("/login"), 1500);
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
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Set new password</h1>
            <p className="text-xs text-zinc-500 mt-1">Enter and confirm your new password.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={`h-10 w-full px-3 py-2 pr-10 text-sm text-zinc-900 bg-white border rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-1 ${
                    errors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    input.type = input.type === "password" ? "text" : "password";
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-zinc-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  className={`h-10 w-full px-3 py-2 pr-10 text-sm text-zinc-900 bg-white border rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-1 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling;
                    input.type = input.type === "password" ? "text" : "password";
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              <Link to="/login" className="font-medium text-emerald-700 hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
