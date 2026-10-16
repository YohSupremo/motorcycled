import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../actions/userActions";

export const Navbar = ({ currentPage }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const activePage =
    currentPage ||
    (location.pathname === "/"
      ? "home"
      : location.pathname.startsWith("/shop")
      ? "shop"
      : location.pathname.startsWith("/orders")
      ? "orders"
      : location.pathname.startsWith("/cart")
      ? "cart"
      : location.pathname.startsWith("/about")
      ? "about"
      : "");

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart || { cartItems: [] });
  const cartCount = cartItems?.length || 0;


  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "";
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "JD";

  // Pages whose first section is a dark full-bleed hero. The bar blends into
  // the hero (dark, light text) at the top and turns into a flat translucent
  // light bar once the hero has scrolled past.
  const darkHeroPage = activePage === "home" || activePage === "about";
  const overDark = darkHeroPage && !isScrolled;

  // Dark-hero pages (home, about) place their hero directly under the bar, so
  // the bar goes fully transparent there and the hero shows through. Other
  // dark-hero pages keep a flat dark scrim so text stays legible.
  const headerTone = !overDark
    ? "bg-white/90 border-zinc-200"
    : activePage === "home" || activePage === "about"
    ? "bg-transparent border-transparent"
    : "bg-zinc-950/70 border-white/10";
  const subnavTone = !overDark
    ? "border-zinc-100 bg-zinc-50"
    : activePage === "home" || activePage === "about"
    ? "border-transparent bg-transparent"
    : "border-white/10 bg-zinc-950/70";

  const navIdle = overDark
    ? "text-white/75 hover:text-white hover:bg-white/10"
    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50";
  const navActive = overDark
    ? "bg-white/20 text-white font-semibold"
    : "bg-zinc-100 text-zinc-900 font-semibold";
  const chipIdle = overDark
    ? "border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900";
  const chipActive = overDark
    ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30 font-semibold"
    : "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-2xs";

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

  // Track how far the page hero has scrolled under the bar.
  useEffect(() => {
    const handleScroll = () => {
      const hero =
        document.querySelector("[data-nav-hero-end]") ||
        document.querySelector("main section");
      const navHeight = headerRef.current?.offsetHeight || 56;
      document.documentElement.style.setProperty("--nav-h", `${navHeight}px`);
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      setIsScrolled(heroBottom <= navHeight);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
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
    <header
      ref={headerRef}
      className={`sticky top-0 z-30 border-b transition-colors duration-300 ${headerTone}`}
    >
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
              className={`h-8 w-auto object-contain transition-transform duration-150 group-hover:scale-105 ${
                overDark ? "brightness-0 invert" : ""
              }`}
            />
            <span
              className={`text-sm font-bold tracking-wider uppercase ${
                overDark ? "text-white" : "text-zinc-900"
              }`}
            >
              Motorcycled
            </span>
          </Link>

          {/* Navigation Links (Profile moved to user dropdown as requested) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activePage === "home" ? navActive : navIdle
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activePage === "shop" ? navActive : navIdle
              }`}
            >
              Shop Catalog
            </Link>
            <Link
              to="/orders"
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activePage === "orders" ? navActive : navIdle
              }`}
            >
              My Installments & Orders
            </Link>
            <Link
              to="/about"
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activePage === "about" ? navActive : navIdle
              }`}
            >
              About
            </Link>
          </nav>
        </div>

        {/* Right Section: Cart Button & User Account Menu */}
        <div className="flex items-center gap-2.5">
          {/* Cart Nav Button */}
          <Link
            to="/cart"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
              currentPage === "cart" ? chipActive : chipIdle
            }`}
            title="Shopping Cart"
          >
            <svg
              className={`w-3.5 h-3.5 ${overDark ? "text-emerald-400" : "text-emerald-600"}`}
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
            {cartCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
                  overDark
                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {cartCount}
              </span>
            )}
          </Link>

          {/* Dealership Operations Quick Access (Admins Only) */}
          {isAuthenticated && user?.role === "admin" && (
            <Link
              to="/admin/dashboard"
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                currentPage === "admin" ? chipActive : chipIdle
              }`}
              title="Dealership Operations (Admin Dashboard)"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  overDark ? "bg-emerald-400" : "bg-emerald-600"
                }`}
              />
              <span>Operations</span>
            </Link>
          )}

          {isAuthenticated && user ? (
            /* User Account Menu with Avatar, Name & Separated Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2.5 px-2 py-1 rounded-md transition-colors cursor-pointer focus:outline-none border border-transparent ${
                  overDark ? "hover:bg-white/10 hover:border-white/20" : "hover:bg-zinc-100/80 hover:border-zinc-200"
                }`}
                aria-expanded={isDropdownOpen}
              >
                {/* Profile Picture / Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ring-1 overflow-hidden ${
                      overDark
                        ? "bg-white text-zinc-900 ring-white/40"
                        : "bg-zinc-900 text-white ring-zinc-300"
                    }`}
                  >
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
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 z-10 pointer-events-none ${
                      overDark ? "ring-zinc-950" : "ring-white"
                    }`}
                  />
                </div>

                {/* User Name & Status */}
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold leading-tight ${
                        overDark ? "text-white" : "text-zinc-900"
                      }`}
                    >
                      {displayName}
                    </span>
                  </div>
                  <span
                    className={`block text-[10px] font-medium leading-none mt-0.5 ${
                      overDark ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    {user.role === "admin" ? "Administrator" : "Customer"}
                  </span>
                </div>

                {/* Dropdown Chevron */}
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDropdownOpen
                      ? overDark
                        ? "rotate-180 text-white"
                        : "rotate-180 text-zinc-700"
                      : overDark
                      ? "text-white/60"
                      : "text-zinc-400"
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

                    {user?.role === "admin" && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
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
                      </Link>)}
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
                className={`hidden sm:inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  overDark ? "text-white/75 hover:text-white" : "text-zinc-700 hover:text-zinc-900"
                }`}
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
      <div
        className={`md:hidden border-t px-4 py-2 flex items-center justify-between text-xs font-medium overflow-x-auto gap-2 ${subnavTone}`}
      >
        <Link
          to="/"
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activePage === "home"
              ? overDark
                ? "bg-white/20 text-white font-semibold"
                : "bg-white text-zinc-900 font-semibold shadow-xs"
              : overDark
              ? "text-white/70"
              : "text-zinc-600"
          }`}
        >
          Home
        </Link>
        <Link
          to="/shop"
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activePage === "shop"
              ? overDark
                ? "bg-white/20 text-white font-semibold"
                : "bg-white text-zinc-900 font-semibold shadow-xs"
              : overDark
              ? "text-white/70"
              : "text-zinc-600"
          }`}
        >
          Shop
        </Link>
        <Link
          to="/cart"
          className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${
            activePage === "cart"
              ? overDark
                ? "bg-white/20 text-white font-semibold"
                : "bg-white text-zinc-900 font-semibold shadow-xs"
              : overDark
              ? "text-white/70"
              : "text-zinc-600"
          }`}
        >
          <span>Cart</span>
          {cartCount > 0 && (
            <span
              className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                overDark ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {cartCount}
            </span>
          )}
        </Link>
        <Link
          to="/orders"
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activePage === "orders"
              ? overDark
                ? "bg-white/20 text-white font-semibold"
                : "bg-white text-zinc-900 font-semibold shadow-xs"
              : overDark
              ? "text-white/70"
              : "text-zinc-600"
          }`}
        >
          Installments & Orders
        </Link>
        <Link
          to="/about"
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activePage === "about"
              ? overDark
                ? "bg-white/20 text-white font-semibold"
                : "bg-white text-zinc-900 font-semibold shadow-xs"
              : overDark
              ? "text-white/70"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          About
        </Link>
      </div>
    </header>
  );
};
