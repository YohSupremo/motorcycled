import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../actions/userActions";
import axios from "axios";

const API = import.meta.env.VITE_API || "http://localhost:4001/api/v1";

// ── Inline NavSearch component ────────────────────────────────────────────────
const NavSearch = ({ overDark }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch suggestions debounced
  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/products?keyword=${encodeURIComponent(q.trim())}&limit=6&page=1`
      );
      const products = data.products || [];
      setSuggestions(products);
      setOpen(products.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIdx(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 220);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/shop?keyword=${encodeURIComponent(query.trim())}`);
  };

  const handleSelect = (product) => {
    setQuery(product.name);
    setOpen(false);
    navigate(`/shop?keyword=${encodeURIComponent(product.name)}`);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const inputBase = overDark
    ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/60 focus:bg-white/15"
    : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-emerald-400 focus:bg-white";

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs hidden md:block">
      <form onSubmit={handleSubmit} role="search" aria-label="Search shop catalog">
        <div className="relative flex items-center">
          {/* Search icon */}
          <svg
            className={`absolute left-2.5 w-3.5 h-3.5 pointer-events-none ${
              overDark ? "text-white/50" : "text-zinc-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>

          <input
            ref={inputRef}
            id="navbar-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim().length >= 2 && suggestions.length > 0 && setOpen(true)}
            placeholder="Search motorcycles & parts…"
            className={`w-full h-8 pl-8 pr-8 text-xs rounded-lg border transition-all duration-150 outline-none ${inputBase}`}
            aria-label="Search shop"
            aria-autocomplete="list"
            aria-controls={open ? "navbar-search-suggestions" : undefined}
            aria-activedescendant={
              activeIdx >= 0 ? `suggestion-${activeIdx}` : undefined
            }
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); inputRef.current?.focus(); }}
              className={`absolute right-2.5 w-3.5 h-3.5 flex items-center justify-center rounded-full transition-colors ${
                overDark ? "text-white/50 hover:text-white/80" : "text-zinc-400 hover:text-zinc-600"
              }`}
              aria-label="Clear search"
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* Spinner */}
          {loading && !query === "" && (
            <div className="absolute right-2.5">
              <svg className="w-3 h-3 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          id="navbar-search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden"
        >
          {suggestions.map((product, idx) => {
            const isActive = idx === activeIdx;
            const imgSrc = product.images?.[0]?.url;
            const price = `₱${Number(product.price || 0).toLocaleString("en-US")}`;

            return (
              <button
                key={product._id}
                id={`suggestion-${idx}`}
                role="option"
                aria-selected={isActive}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(product)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer text-xs border-b border-zinc-100 last:border-b-0 ${
                  isActive ? "bg-emerald-50" : "hover:bg-zinc-50"
                }`}
              >
                {/* Product thumbnail */}
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0 flex items-center justify-center">
                  {imgSrc ? (
                    <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9l4-4 4 4 4-4 4 4" />
                    </svg>
                  )}
                </div>

                {/* Name + price */}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 truncate">{product.name}</p>
                  <p className="text-zinc-500 text-[11px] truncate">
                    {product.category?.name || product.itemType || "Product"}
                    {" · "}
                    <span className="font-mono font-semibold text-emerald-700">{price}</span>
                    {product.installmentEligible && (
                      <span className="ml-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded">
                        Installment
                      </span>
                    )}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive ? "text-emerald-600" : "text-zinc-300"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}

          {/* View all results footer */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen(false);
              navigate(`/shop?keyword=${encodeURIComponent(query.trim())}`);
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-zinc-50/80 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors border-t border-zinc-200 cursor-pointer"
          >
            <span>View all results for "{query}"</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────────
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
  const profileTab = location.pathname.startsWith("/profile")
    ? location.pathname.split("/")[2] || "personal-info"
    : null;

  // Show search bar on every page EXCEPT home
  const showSearch = activePage !== "home";

  const darkHeroPage = activePage === "home" || activePage === "about";
  const overDark = darkHeroPage && !isScrolled;

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-6 shrink-0">
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

          {/* Navigation Links */}
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
              My Installments &amp; Orders
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

        {/* ── Search Bar (hidden on homepage) ── */}
        {showSearch && <NavSearch overDark={overDark} />}

        {/* Spacer when search is hidden */}
        {!showSearch && <div className="flex-1" />}

        {/* Right Section */}
        <div className="flex items-center gap-2.5 shrink-0">
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


          {isAuthenticated && user ? (
            /* User Account Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                id="account-menu-button"
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2.5 px-2 py-1 rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 border border-transparent ${
                  overDark ? "hover:bg-white/10 hover:border-white/20" : "hover:bg-zinc-100/80 hover:border-zinc-200"
                }`}
                aria-expanded={isDropdownOpen}
                aria-controls={isDropdownOpen ? "account-menu" : undefined}
              >
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
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 z-10 pointer-events-none ${
                      overDark ? "ring-zinc-950" : "ring-white"
                    }`}
                  />
                </div>

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

              {/* Account menu dropdown */}
              {isDropdownOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg animate-fadeIn"
                >
                  <div className="border-b border-emerald-100/80 bg-emerald-50/50 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-bold text-white ring-2 ring-emerald-200/70">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="tracking-tighter">{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-zinc-900">
                          {displayName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-600">
                          {user.email}
                        </p>
                      </div>
                      {user.role === "admin" && (
                        <span className="shrink-0 rounded border border-emerald-200 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-1.5">
                    {[
                      {
                        tab: "personal-info",
                        label: "Personal profile",
                        icon: (
                          <>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </>
                        ),
                      },
                      {
                        tab: "address",
                        label: "Delivery addresses",
                        icon: (
                          <>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </>
                        ),
                      },
                      {
                        tab: "verification",
                        label: "Credit verification",
                        icon: (
                          <>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                          </>
                        ),
                      },
                    ].map((item) => {
                      const isActive = profileTab === item.tab;
                      return (
                        <button
                          key={item.tab}
                          type="button"
                          onClick={() => handleNavClick(item.tab)}
                          className={`group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-950"
                              : "text-zinc-700 hover:bg-emerald-50/60 hover:text-emerald-950"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors ${
                              isActive
                                ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                                : "bg-emerald-50 text-emerald-700 ring-emerald-100 group-hover:bg-emerald-100/80"
                            }`}
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              {item.icon}
                            </svg>
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {isActive && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}

                    {user?.role === "admin" && (
                      <>
                        <div className="my-1.5 border-t border-zinc-100" />
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-zinc-700 transition-colors cursor-pointer hover:bg-emerald-50 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white ring-1 ring-inset ring-emerald-800/20">
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                            </svg>
                          </span>
                          <span className="flex-1">Dealership operations</span>
                          <svg
                            className="h-4 w-4 shrink-0 text-emerald-600/70 group-hover:text-emerald-700"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="border-t border-zinc-100 bg-zinc-50/50 p-1.5">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-zinc-600 transition-colors cursor-pointer hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-zinc-500 ring-1 ring-inset ring-zinc-200 transition-colors group-hover:bg-red-50 group-hover:text-red-600 group-hover:ring-red-200">
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </span>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Signed-out state */
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
          Installments &amp; Orders
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
