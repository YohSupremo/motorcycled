import { useSelector } from "react-redux";
import { Navigate, Link, useLocation } from "react-router-dom";

// ProtectedRoute — Role-aware route guard
// Reference: itcp318-s3a-2026/frontend/src/Components/Route/ProtectedRoute.jsx
// UI design matches motorcycled customer-side scheme:
//   bg-zinc-50/60, white cards, border-zinc-200, emerald-600 accents

const Spinner = () => (
  <div className="min-h-screen bg-zinc-50/60 flex items-center justify-center antialiased">
    <div className="flex flex-col items-center gap-4">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-2">
        <img
          src="/motorcycled-logo.png"
          alt="Motorcycled"
          className="h-6 w-auto object-contain"
        />
        <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">
          Motorcycled
        </span>
      </div>

      {/* Spinner ring */}
      <svg
        className="animate-spin w-8 h-8 text-emerald-600"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      <span className="text-xs font-mono text-zinc-400 tracking-widest">
        Verifying session...
      </span>
    </div>
  </div>
);

const AccessDenied = () => (
  <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col justify-center items-center px-4 py-8 antialiased selection:bg-emerald-100 selection:text-emerald-900">
    <div className="w-full max-w-sm">
      {/* Brand Header — matches Login.jsx */}
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

      {/* Card — matches Login.jsx card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-6 text-center space-y-5">
        {/* Shield icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
        </div>

        {/* Badge */}
        <div>
          <span className="inline-block font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 tracking-widest uppercase font-semibold">
            403 — Access Denied
          </span>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Admin area restricted
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed">
            This section is reserved for dealership administrators. Your
            account does not have the required permissions.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-100" />

        {/* Actions */}
        <div className="space-y-2">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Storefront
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-medium transition-colors"
          >
            Sign in with a different account
          </Link>
        </div>

        <p className="text-[11px] text-zinc-400 font-mono">
          Contact your system administrator if you believe this is a mistake.
        </p>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, isAdmin = false }) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  // Still verifying session from cookie — don't redirect prematurely
  if (loading) return <Spinner />;

  // Not logged in → go to login preserving the attempted destination
  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Logged in but wrong role → show 403 page
  // Reference: itcp318-s3a-2026/frontend/src/Components/Route/ProtectedRoute.jsx line 20-22
  if (isAdmin && user?.role !== "admin") return <AccessDenied />;

  return children;
};

export default ProtectedRoute;
