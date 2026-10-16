import { Link } from "react-router-dom";

export const Footer = ({ onNavigate }) => {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 text-xs mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-3">
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
            <p className="text-zinc-500 leading-relaxed max-w-sm text-xs">
              Authorized dealership and online portal for certified motorcycles, OEM replacement parts, riding gear, and flexible installment financing across the Philippines.
            </p>
            <div className="pt-1 space-y-1 text-zinc-500 text-[11px]">
              <p className="flex items-center gap-2">
                <span className="font-medium text-zinc-700">Location:</span> Metro Manila, Philippines
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-zinc-700">Customer Hotline:</span> (02) 8921-5500
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-zinc-700">Support Hours:</span> Monday to Saturday, 8:00 AM to 6:00 PM
              </p>
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h4 className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px] mb-3">
              Products and Catalog
            </h4>
            <ul className="space-y-2 text-zinc-500">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Motorcycles and Scooters
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Engine and Transmission Parts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Brakes and Suspensions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Helmets and Riding Gear
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Tires, Wheels and Rims
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Oils and Lubricants
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Authorized Brands
                </button>
              </li>
            </ul>
          </div>

          {/* Financing and Installments */}
          <div>
            <h4 className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px] mb-3">
              Financing and Plans
            </h4>
            <ul className="space-y-2 text-zinc-500">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("orders") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  12, 24 and 36-Month Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("shop") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Downpayment Calculator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("profile") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Loan Requirements (ID and Income)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("orders") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Monthly Dues and Schedules
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("orders") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Payment Channels (GCash, Maya, Bank)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("orders") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Early Payoff Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px] mb-3">
              Customer Support
            </h4>
            <ul className="space-y-2 text-zinc-500">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate("orders") : null}
                  className="hover:text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  Order Tracking and Delivery
                </button>
              </li>
              <li>
                <a href="#warranty" className="hover:text-emerald-700 transition-colors">
                  Warranty and Maintenance Policy
                </a>
              </li>
              <li>
                <a href="#cancellation" className="hover:text-emerald-700 transition-colors">
                  Cancellations and Refunds
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-700 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <a href="#privacy" className="hover:text-emerald-700 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-emerald-700 transition-colors">
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a href="#help" className="hover:text-emerald-700 transition-colors">
                  Contact Service Desk
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Sub-Footer */}
        <div className="mt-10 pt-6 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <span>© 2026 Motorcycled. All rights reserved.</span>

          <div className="flex items-center gap-4 text-zinc-500">
            <a href="#terms" className="hover:text-zinc-700 transition-colors">Terms</a>
            <a href="#privacy" className="hover:text-zinc-700 transition-colors">Privacy</a>
            <a href="#cookies" className="hover:text-zinc-700 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
