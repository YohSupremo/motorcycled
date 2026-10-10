import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../actions/userActions";

export const Navbar = ({ currentPage }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "";
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "JD";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (subTab) => {
    setIsDropdownOpen(false);
    navigate(`/profile/${subTab}`);
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await dispatch(logout());
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Main Navigation */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 cursor-pointer focus:outline-none group"
          >
            <img
              src="/motorcycled-logo.png"
              alt="Motorcycled Logo"
              className="h-8 w-auto object-contain transition-transform duration-150 group-hover:scale-105"
            />
            <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">
              Motorcycled
            </span>
          </Link>

          {/* Navigation Links (Profile moved to user dropdown as requested) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentPage === "home"
                  ? "bg-zinc-100 text-zinc-900 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentPage === "shop"
                  ? "bg-zinc-100 text-zinc-900 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              Shop Catalog
            </Link>
            <Link
              to="/orders"
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                currentPage === "orders"
                  ? "bg-zinc-100 text-zinc-900 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              My Installments & Orders
            </Link>
          </nav>
        </div>

        {/* Right Section: Cart Button & User Account Menu */}
        <div className="flex items-center gap-2.5">
          {/* Cart Nav Button */}
          <Link
            to="/cart"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
              currentPage === "cart"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-2xs"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
            title="Shopping Cart"
          >
            <svg
              className="w-3.5 h-3.5 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              3
            </span>
          </Link>

          {/* Dealership Operations Quick Access */}
          <button
            type="button"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
              currentPage === "admin"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-2xs"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
            title="Dealership Operations"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Operations</span>
          </button>

          {isAuthenticated && user ? (
            /* User Account Menu with Avatar, Name & Separated Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-zinc-100/80 transition-colors cursor-pointer focus:outline-none border border-transparent hover:border-zinc-200"
                aria-expanded={isDropdownOpen}
              >
                {/* Profile Picture / Avatar */}
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs ring-1 ring-zinc-300 overflow-hidden">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="tracking-tighter">{initials}</span>
                    )}
                  </div>
                  {/* Active indicator dot placed outside circular photo, uncropped */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-white z-10 pointer-events-none" />
                </div>

                {/* User Name & Status */}
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-900 leading-tight">
                      {displayName}
                    </span>
                  </div>
                  <span className="block text-[10px] text-emerald-700 font-medium leading-none mt-0.5">
                    {user.role === "admin" ? "Administrator" : "Customer"}
                  </span>
                </div>

                {/* Dropdown Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-zinc-700" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Interactive Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 divide-y divide-zinc-100 animate-fadeIn">
                  {/* Dropdown Header: User Info */}
                  <div className="px-4 py-3 bg-zinc-50/70">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-zinc-300 overflow-hidden">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="tracking-tighter">{initials}</span>
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-white z-10 pointer-events-none" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Account Status:</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px]">
                        {user.role === "admin" ? "Administrator" : "Active"}
                      </span>
                    </div>
                  </div>

                  {/* Separated Items in Dropdown (Profile, Addresses, Verification) */}
                  <div className="p-1 space-y-0.5">
                    {/* 1. Profile Option */}
                    <button
                      type="button"
                      onClick={() => handleNavClick("personal-info")}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors cursor-pointer flex items-center gap-2.5 ${
                        currentPage === "profile"
                          ? "bg-zinc-100 text-zinc-900 font-semibold"
                          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      <div className="w-7 h-7 rounded bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-medium text-xs text-zinc-900">
                          Personal Profile
                        </span>
                        <span className="block text-[10px] text-zinc-500">
                          Legal name, email & contact phone
                        </span>
                      </div>
                    </button>

                    {/* 2. Addresses Option (Separated) */}
                    <button
                      type="button"
                      onClick={() => handleNavClick("address")}
                      className="w-full text-left px-3 py-2 rounded-md text-xs transition-colors cursor-pointer flex items-center gap-2.5 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <div className="w-7 h-7 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/50">
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-medium text-xs text-zinc-900">
                          Delivery Addresses
                        </span>
                        <span className="block text-[10px] text-zinc-500">
                          Shipping location & postal code
                        </span>
                      </div>
                    </button>

                    {/* 3. Verification Option (Separated) */}
                    <button
                      type="button"
                      onClick={() => handleNavClick("verification")}
                      className="w-full text-left px-3 py-2 rounded-md text-xs transition-colors cursor-pointer flex items-center gap-2.5 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/50">
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-xs text-zinc-900">
                            Credit Verification
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        </div>
                        <span className="block text-[10px] text-zinc-500">
                          Government ID & proof of income
                        </span>
                      </div>
                    </button>

                    {/* 4. Dealership Operations Portal */}
                    <Link
                      to="admin/dashboard"
                      className="w-full text-left px-3 py-2 rounded-md text-xs transition-colors cursor-pointer flex items-center gap-2.5 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-950"
                    >
                      <div className="w-7 h-7 rounded bg-zinc-900 text-white flex items-center justify-center shrink-0">
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-zinc-900">
                            Dealership Operations
                          </span>
                          <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Management
                          </span>
                        </div>
                        <span className="block text-[10px] text-zinc-500">
                          Inventory, orders & financing underwriting
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Dropdown Footer: Sign Out */}
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-md text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer flex items-center gap-2.5"
                    >
                      <div className="w-7 h-7 rounded bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </div>
                      <span className="font-semibold text-xs">
                        Sign out of account
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Signed-out state: login / register links */
            <div className="flex items-center gap-2">
              <Link
                to="/register"
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-zinc-100 bg-zinc-50 px-4 py-2 flex items-center justify-between text-xs font-medium overflow-x-auto gap-2">
        <Link
          to="/"
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            currentPage === "home"
              ? "bg-white text-zinc-900 font-semibold shadow-xs"
              : "text-zinc-600"
          }`}
        >
          Home
        </Link>
        <Link
          to="shop"
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            currentPage === "shop"
              ? "bg-white text-zinc-900 font-semibold shadow-xs"
              : "text-zinc-600"
          }`}
        >
          Shop
        </Link>
        <Link
          to="/cart"
          className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${
            currentPage === "cart"
              ? "bg-white text-zinc-900 font-semibold shadow-xs"
              : "text-zinc-600"
          }`}
        >
          <span>Cart</span>
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </Link>
        <Link
          to="/orders"
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            currentPage === "orders"
              ? "bg-white text-zinc-900 font-semibold shadow-xs"
              : "text-zinc-600"
          }`}
        >
          Installments & Orders
        </Link>
      </div>
    </header>
  );
};