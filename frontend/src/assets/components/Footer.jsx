import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { LegalModal } from "./LegalModal";

const CATALOG_LINKS = [
  { label: "Motorcycles and Scooters", category: "Motorcycles" },
  { label: "Engine and Transmission Parts", category: "Engine Parts" },
  { label: "Brakes and Suspensions", category: "Brakes" },
  { label: "Helmets", category: "Helmets" },
  { label: "Riding Gear", category: "Riding Gear" },
  { label: "Tires, Wheels and Rims", category: "Tires and Wheels" },
  { label: "Oils and Lubricants", category: "Lubricants" },
];

const FINANCING_LINKS = [
  { label: "12, 24 and 36-Month Plans", to: "/#financing" },
  { label: "Installment Terms and Fees", to: "/about#faq" },
  { label: "Loan Requirements (ID and Income)", to: "/profile/verification" },
  { label: "Monthly Dues and Payment History", to: "/orders" },
  { label: "Payment Channels (GCash, Maya, Bank)", to: "/about#faq" },
  { label: "Early Payoff and Settlement", to: "/about#faq" },
];

const SUPPORT_LINKS = [
  { label: "Order Tracking and Delivery", to: "/orders" },
  { label: "Warranty and Maintenance Policy", document: "warranty" },
  { label: "Cancellations and Refunds", document: "refunds" },
  { label: "Frequently Asked Questions", to: "/about#faq" },
  { label: "Privacy Policy", document: "privacy" },
  { label: "Terms and Conditions", document: "terms" },
];

const LINK_CLASS =
  "hover:text-emerald-700 transition-colors text-left cursor-pointer";

export const Footer = () => {
  const [legalDocument, setLegalDocument] = useState(null);

  const closeLegal = useCallback(() => setLegalDocument(null), []);

  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 text-xs mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2.5 w-fit">
              <img
                src="/motorcycled-logo.png"
                alt="Motorcycled Logo"
                className="h-7 w-auto object-contain"
              />
              <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">
                Motorcycled
              </span>
            </Link>
            <p className="text-zinc-500 leading-relaxed max-w-sm text-xs">
              Authorized dealership and online portal for certified motorcycles, OEM replacement parts, riding gear, and flexible installment financing across the Philippines.
            </p>
            <div className="pt-1 space-y-1 text-zinc-500 text-[11px]">
              <p className="flex items-center gap-2">
                <span className="font-medium text-zinc-700">Location:</span>
                <Link to="/about#contact" className={LINK_CLASS}>
                  Ortigas Avenue Extension, Pasig City
                </Link>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-zinc-700">Customer Hotline:</span>
                <a href="tel:+63289215500" className={LINK_CLASS}>
                  (02) 8921-5500
                </a>
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
              {CATALOG_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={`/shop?category=${encodeURIComponent(item.category)}`}
                    className={LINK_CLASS}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/#brands" className={LINK_CLASS}>
                  Authorized Brands
                </Link>
              </li>
            </ul>
          </div>

          {/* Financing and Installments */}
          <div>
            <h4 className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px] mb-3">
              Financing and Plans
            </h4>
            <ul className="space-y-2 text-zinc-500">
              {FINANCING_LINKS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className={LINK_CLASS}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-semibold text-zinc-900 uppercase tracking-wider text-[11px] mb-3">
              Customer Support
            </h4>
            <ul className="space-y-2 text-zinc-500">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  {item.document ? (
                    <button
                      type="button"
                      onClick={() => setLegalDocument(item.document)}
                      aria-haspopup="dialog"
                      className={LINK_CLASS}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link to={item.to} className={LINK_CLASS}>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <a href="mailto:inquiries@motorcycled.ph" className={LINK_CLASS}>
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
            <button
              type="button"
              onClick={() => setLegalDocument("terms")}
              aria-haspopup="dialog"
              className={LINK_CLASS}
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setLegalDocument("privacy")}
              aria-haspopup="dialog"
              className={LINK_CLASS}
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => setLegalDocument("warranty")}
              aria-haspopup="dialog"
              className={LINK_CLASS}
            >
              Warranty
            </button>
          </div>
        </div>
      </div>

      <LegalModal documentKey={legalDocument} onClose={closeLegal} />
    </footer>
  );
};
