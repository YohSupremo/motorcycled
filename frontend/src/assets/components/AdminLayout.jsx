import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
export const AdminLayout = ({ activeTab, onTabChange, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="w-4 h-4 shrink-0"
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
      ),
    },
    {
      id: "orders",
      label: "Orders & Financing",
      badge: "3",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: (
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: "products",
      label: "Catalog & Units",
      icon: (
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      id: "payments",
      label: "Payments & Ledger",
      icon: (
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      id: "inventory",
      label: "Inventory & Restock",
      badge: "2 low",
      badgeColor: "bg-red-50 text-red-800 border-red-200",
      icon: (
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
    },
    {
      id: "reviews",
      label: "Review Moderation",
      icon: (
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Dealership Settings",
      icon: (
        <svg
          className="w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const adminNotifications = [
    {
      id: "notif-1",
      title: "New Installment Application",
      detail:
        "ORD-2026-0891 · Juan Dela Cruz submitted valid ID & payslip for Yamaha NMAX 155",
      time: "10 mins ago",
      type: "application",
      unread: true,
    },
    {
      id: "notif-2",
      title: "Low Stock Alert",
      detail: "Motul 7100 10W-40 4T is at 4 units (Threshold: 5 units)",
      time: "1 hour ago",
      type: "stock",
      unread: true,
    },
    {
      id: "notif-3",
      title: "Downpayment Settled",
      detail: "ORD-2026-0885 · ₱32,000 confirmed via BDO Online Deposit",
      time: "3 hours ago",
      type: "payment",
      unread: false,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-100/60 text-zinc-900 flex antialiased font-sans">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-2xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Collapsible Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 bg-white border-r border-zinc-200 flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* Top Header / Brand - Click Header or Logo to Open/Close Sidebar */}
        <div>
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`h-14 border-b border-zinc-200 flex items-center px-3.5 cursor-pointer hover:bg-zinc-50 transition-colors select-none group ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
            title={
              isCollapsed
                ? "Click logo/header to expand sidebar"
                : "Click logo/header to collapse sidebar"
            }
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src="/motorcycled-logo.png"
                alt="Motorcycled Logo"
                className="h-7 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
              />
              {!isCollapsed && (
                <div className="text-left overflow-hidden">
                  <span className="text-xs font-extrabold tracking-wider text-zinc-900 uppercase block truncate">
                    Motorcycled
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold block leading-none">
                    Dealership Operations
                  </span>
                </div>
              )}
            </div>

            {/* Subtle collapse indicator chevron when expanded */}
            {!isCollapsed && (
              <span className="text-zinc-400 group-hover:text-zinc-700 transition-colors shrink-0">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
            {!isCollapsed && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Operations
              </div>
            )}

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  to={`/admin/${item.id}`}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer relative group ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-300/80 font-semibold shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span
                    className={
                      isActive
                        ? "text-emerald-700"
                        : "text-zinc-500 group-hover:text-zinc-800"
                    }
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span className="flex-1 text-left truncate">
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${item.badgeColor || "bg-zinc-100 text-zinc-700 border-zinc-200"}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Indicator Pip when active */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-600 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar: User Switcher & Storefront */}
        <div className="p-2 border-t border-zinc-200 bg-zinc-50/60 space-y-2">
          {/* Storefront Link */}
          <Link
            to="/"
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer border border-zinc-200/80 bg-white shadow-2xs ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title="Return to Customer Storefront"
          >
            <svg
              className="w-3.5 h-3.5 text-zinc-500 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {!isCollapsed && <span className="truncate">Storefront View</span>}
          </Link>

          {/* Staff User Card */}
          <div
            className={`flex items-center gap-2.5 p-1.5 ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                KL
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-zinc-900 truncate">
                  Kelly Laurence
                </p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">
                  Operations Lead
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Operational Header */}
        <header className="h-14 bg-white border-b border-zinc-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger (Mobile Only) */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden w-8 h-8 rounded border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
              title="Open Navigation"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Breadcrumb Info */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">
                Dealership
              </span>
              <span className="text-zinc-300">/</span>
              <span className="font-bold text-zinc-900 capitalize">
                {navItems.find((i) => i.id === activeTab)?.label || activeTab}
              </span>
            </div>
          </div>

          {/* Right Header Operations */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 rounded-md border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition-colors relative cursor-pointer"
                title="System Notifications"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  2
                </span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 p-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 px-2">
                    <span className="font-bold text-zinc-900 text-xs">
                      Dealership Alerts
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Mailtrap & In-App Log
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {adminNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-md border transition-colors ${
                          n.unread
                            ? "bg-emerald-50/40 border-emerald-200/80"
                            : "bg-zinc-50 border-zinc-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-zinc-900">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                          {n.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Switch to Customer View */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <span>Storefront</span>
              <span className="text-zinc-400">&rarr;</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
