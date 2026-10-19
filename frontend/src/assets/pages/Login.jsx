import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, clearErrors } from "../../actions/userActions";
import { LOGIN_SUCCESS, LOGIN_FAIL } from "../../constants/userConstants";
import axios from "axios";
import {
  auth,
  googleProvider,
  signInWithPopup,
  isFirebaseConfigured,
} from "../../firebase";

const API = import.meta.env.VITE_API;

export const Login = () => {
  const { isAuthenticated, user, error, loading } = useSelector(
    (state) => state.auth,
  );

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [socialError, setSocialError] = useState("");

  // useRef so it updates SYNCHRONOUSLY — unlike useState, changes to a ref
  // are visible immediately in the same render cycle (no batching delay).
  // This blocks the isAuthenticated redirect while the Google popup is open.
  const googleAuthInProgress = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirect = new URLSearchParams(location.search).get("redirect");

  // Redirect once login succeeds (supporting ?redirect=shipping or admin dashboard).
  // Guard: skip redirect while a Google auth popup is in progress.
  // We use a ref (not state) because refs update synchronously — state updates
  // are batched and may not be visible until the next render, which can cause
  // the redirect to fire before handleGoogleSignIn sets socialLoading.
  useEffect(() => {
    if (isAuthenticated && !googleAuthInProgress.current) {
      const defaultTarget = user?.role === "admin" ? "/admin/dashboard" : "/";
      const target =
        redirect && redirect !== ""
          ? redirect.startsWith("/")
            ? redirect
            : `/${redirect}`
          : defaultTarget;
      navigate(target);
    }
  }, [isAuthenticated, redirect, navigate, user]);

  const handleGoogleSignIn = async () => {
    setSocialError("");
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setSocialError(
        "Firebase is not configured yet. Please add your VITE_FIREBASE_API_KEY and credentials to frontend/.env.",
      );
      return;
    }

    // Block the isAuthenticated redirect SYNCHRONOUSLY before the popup opens.
    googleAuthInProgress.current = true;

    try {
      setSocialLoading("google");

      // 1. Authenticate with Firebase (opens Google account picker popup).
      const result = await signInWithPopup(auth, googleProvider);
      const socialUser = result.user;
      const email = socialUser.email;
      const fullName = (socialUser.displayName || "").trim();
      const [firstName = "", ...lastNameParts] = fullName.split(" ");
      const lastName = lastNameParts.join(" ");

      // 2. Ask OUR backend whether this email is registered.
      //    We call axios directly so we can read the raw response immediately,
      //    before any Redux state change has a chance to trigger a re-render
      //    and fire the isAuthenticated redirect.
      let data;
      try {
        const response = await axios.post(
          `${API}/firebase-login`,
          { email, provider: "google" },
          { withCredentials: true },
        );
        data = response.data;
      } catch (apiErr) {
        const msg =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          "Server error during Google sign-in.";
        setSocialError(msg);
        return;
      }

      // 3a. Not registered → go to registration with their Google info pre-filled.
      if (data.isRegistered === false) {
        navigate("/register", {
          state: { email, firstName, lastName, fromGoogle: true },
        });
        return;
      }

      // 3b. Registered → store session marker and update Redux store.
      try {
        localStorage.setItem("isLoggedIn", "1");
      } catch { /* ignore */ }

      dispatch({
        type: LOGIN_SUCCESS,
        payload: { ...data.user, address: data.address },
      });

      // Release the guard — isAuthenticated is now true, let the redirect fire.
      googleAuthInProgress.current = false;
    } catch (err) {
      console.error("Google Auth error:", err);
      dispatch({ type: LOGIN_FAIL, payload: null });
      if (err.code !== "auth/popup-closed-by-user") {
        setSocialError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setSocialLoading("");
      // Safety net: always release the guard when the function exits.
      googleAuthInProgress.current = false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(identifier, password));
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (error) dispatch(clearErrors());
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) dispatch(clearErrors());
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
            {/* Error message from the server / network */}
            {error && (
              <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 leading-relaxed">
                {error}
              </p>
            )}

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
                onChange={handleIdentifierChange}
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
                  onChange={handlePasswordChange}
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
                disabled={loading || Boolean(socialLoading)}
                className="h-10! w-full px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Social login divider (Quiz 4: 15pts) */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-zinc-400 uppercase tracking-wider text-[11px]">
                or continue with
              </span>
            </div>
          </div>

          {/* Social error notification */}
          {socialError && (
            <div className="mb-3 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-snug">
              {socialError}
            </div>
          )}

          {/* Social Auth Providers */}
          <div className="space-y-2">
            {/* Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || Boolean(socialLoading)}
              className="w-full h-10 px-4 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.87c2.26-2.09 3.675-5.17 3.675-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.12C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.12z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.27 6.61l4 3.12c.95-2.85 3.6-4.98 6.73-4.98z"
                />
              </svg>
              <span>
                {socialLoading === "google"
                  ? "Connecting to Google..."
                  : "Sign in with Google"}
              </span>
            </button>
          </div>

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
