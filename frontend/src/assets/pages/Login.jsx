import { useState } from "react";
import { Link } from "react-router-dom";
export const Login = ({ onNavigate }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onNavigate) {
        onNavigate("home");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col justify-center items-center px-4 py-8 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/motorcycled-logo.png"
              alt="Motorcycled Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">
              Motorcycled
            </span>
          </div>
          <span className="text-xs text-zinc-500">Account Portal</span>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Enter your credentials to access your service logs and bookings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier input */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Email or contact number
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="rider@example.com or 09123456789"
                required
                className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
              />
            </div>

            {/* Password input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-700 mb-1"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10! w-full px-3 py-2 pr-10 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer flex items-center justify-center z-10"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password row below input */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer accent-emerald-600"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-xs text-zinc-600 cursor-pointer select-none"
                >
                  Remember me!
                </label>
              </div>
              <a
                href="#forgot-password"
                className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="!h-10 w-full px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Metadata */}
        <p className="text-center text-[11px] text-zinc-400 mt-4">
          Motorcycled Service & Account Management System
        </p>
      </div>
    </div>
  );
};
