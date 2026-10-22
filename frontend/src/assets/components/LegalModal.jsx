import { useEffect, useRef } from "react";

const SUPPORT_EMAIL = "inquiries@motorcycled.ph";
const HOTLINE_DISPLAY = "(02) 8921-5500";
const HOTLINE_HREF = "tel:+63289215500";

const LEGAL_DOCUMENTS = {
  terms: {
    title: "Terms and Conditions",
    summary:
      "These terms apply to purchases made on the Motorcycled website and at our Pasig City showroom.",
    sections: [
      {
        heading: "Scope",
        body: [
          "By placing an order you confirm that you are at least 18 years old and that the details you provide are complete and correct. These terms cover the unit, parts, gear, delivery, and financing involved in that order.",
        ],
      },
      {
        heading: "Products and prices",
        body: [
          "All prices are in Philippine pesos. Photos are for reference; colors, decals, and included accessories can vary between production batches. The processing fee and delivery fee appear on the checkout summary before you confirm an order.",
        ],
      },
      {
        heading: "Orders and acceptance",
        body: [
          "An order confirmation means we received your request. The sale is accepted once stock is reserved and, for financed units, the application is approved.",
          "We may cancel an order when an item is unavailable, when payment cannot be verified, or when buyer details are incomplete. Amounts already paid for a cancelled order are returned in full.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "We accept cash on release, cash on delivery, bank deposit, GCash, and Maya. For wallet payments, enter the account name and mobile number registered to the wallet. Keep the reference number issued after payment; our team verifies it before the unit is released.",
        ],
      },
      {
        heading: "Installment plans",
        body: [
          "Motorcycles tagged as installment eligible can be financed over 12, 24, or 36 months. A minimum downpayment of 20 percent applies, and interest is fixed for the selected term:",
        ],
        list: [
          "12 months at 7 percent",
          "24 months at 8 percent",
          "36 months at 9 percent",
        ],
        after: [
          "A processing fee applies to each financed unit and is shown on your quotation.",
          "Credit review takes 24 to 48 business hours. We may request a government ID, proof of income, and proof of billing address. The approved downpayment and monthly amortization are confirmed in writing before release.",
          "Early settlement is allowed. The financing desk issues a written payoff quote before you pay.",
        ],
      },
      {
        heading: "Delivery and release",
        body: [
          "We deliver within Metro Manila, Cavite, Laguna, Rizal, and Bulacan using enclosed transport. Provincial orders ship crated through insured freight to the nearest regional hub. A delivery fee is added at checkout.",
          "Every unit passes a 24-point pre-delivery inspection before handover. The release coordinator explains the controls, documents, and maintenance schedule.",
        ],
      },
      {
        heading: "Registration and insurance",
        body: [
          "Every brand-new motorcycle includes three-year LTO registration, third-party liability insurance, and an emission compliance certificate. A digital copy of the OR and CR is uploaded to your account within 14 to 21 business days after handover. Metal plates follow regional LTO batch releases, and we notify you when yours is ready.",
        ],
      },
      {
        heading: "Warranty",
        body: [
          "Units carry the manufacturer factory warranty, typically one to two years or 10,000 to 20,000 kilometers, whichever comes first, depending on the brand. Coverage includes engine mechanicals, transmission, and factory electrical defects. Consumables and damage from misuse are excluded. Full details are in the Warranty Policy.",
        ],
      },
      {
        heading: "Cancellation and refunds",
        body: [
          "Orders may be cancelled before release. The downpayment is forfeited unless the dealership approves a refund after review. Approved refunds are issued to the original payment method after the unit or item is returned and inspected. Full details are in the Refunds Policy.",
        ],
      },
      {
        heading: "Personal information",
        body: [
          "We collect and use personal information to process orders, assess financing, and arrange registration. The Privacy Policy explains what we collect, who we share it with, and how to exercise your rights.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by Philippine law. Nothing here removes rights granted to you under the Consumer Act of the Philippines.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    summary:
      "How Motorcycled collects, uses, and protects your personal information.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "We collect the details you give when you create an account or place an order: name, email, contact number, and delivery addresses. Order, payment, and financing records are linked to your account.",
          "For installment applications we also collect a government ID, proof of income, and proof of billing address. Basic technical data, such as IP address and pages visited, is logged when you use the site.",
        ],
      },
      {
        heading: "Why we use it",
        body: [
          "To create and secure your account, process orders, payments, deliveries, and returns, assess installment applications, arrange LTO registration and insurance, send order updates, and meet tax and accounting requirements. Offers are sent only when you opt in.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "LTO and insurers for registration, payment providers and banks for payments, logistics partners for delivery, credit review partners for financing, and government authorities when the law requires it. We do not sell personal information.",
        ],
      },
      {
        heading: "How we protect it",
        body: [
          "Passwords are stored as salted hashes and are never shown back to you in full. Sign-in sessions use httpOnly cookies that scripts cannot read. Access to customer records is limited to authorized staff.",
          "No system is completely secure. Keep your password private and contact us if you notice unusual account activity.",
        ],
      },
      {
        heading: "Cookies and local storage",
        body: [
          "A session cookie keeps you signed in. Your browser also stores your cart locally so it survives a page refresh. Clearing site data signs you out and empties the cart.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Order and financing records are kept while your account is active and for the period required by tax and consumer rules. Credit documents are kept only as long as needed for the application and any active contract.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Under the Data Privacy Act of 2012 you may request a copy of your data, correct errors, object to processing, or ask for deletion.",
          `Email ${SUPPORT_EMAIL} to make a request. You may also raise concerns with the National Privacy Commission.`,
        ],
      },
    ],
  },
  warranty: {
    title: "Warranty and Maintenance Policy",
    summary: "What the manufacturer warranty covers, and how to file a claim.",
    sections: [
      {
        heading: "Coverage",
        body: [
          "Factory warranty typically runs one to two years or 10,000 to 20,000 kilometers, whichever comes first, depending on the brand. It covers engine mechanicals, transmission, and factory electrical defects.",
        ],
      },
      {
        heading: "Not covered",
        list: [
          "Engine oil, filters, spark plugs, brake pads, tires, bulbs, and batteries",
          "Normal wear and tear",
          "Damage from accidents, flood, or fire",
          "Unauthorized modifications or repairs outside authorized service centers",
          "Racing, overloading, or missed periodic maintenance",
        ],
      },
      {
        heading: "How to claim",
        body: [
          "Bring the unit, warranty booklet, and order reference to our service bay or any authorized brand service partner. Technicians inspect the unit and confirm coverage with the manufacturer. Approved repairs are scheduled with parts and labor covered by the warranty.",
        ],
      },
      {
        heading: "Keeping coverage valid",
        body: [
          "Follow the maintenance schedule in the owner manual, use genuine parts, and keep service records. Coverage transfers to the next owner for the remaining period if you sell the unit.",
        ],
      },
      {
        heading: "Genuine parts",
        body: [
          "Parts and riding gear sold on the site come from certified Philippine distributors and carry factory batch or barcode markings. If a delivered part does not match the listing, contact the service desk for a replacement.",
        ],
      },
    ],
  },
  refunds: {
    title: "Cancellations and Refunds",
    summary: "How cancellations, returns, and refunds are handled.",
    sections: [
      {
        heading: "Cancelling an order",
        body: [
          "Cancel from your account or call the hotline before the unit is released. The downpayment is forfeited unless the dealership approves a refund after review. Amounts paid in full are returned to the original payment method.",
        ],
      },
      {
        heading: "Returning parts and gear",
        body: [
          "Returns are accepted when the item is unused, undamaged, and complete with original packaging, tags, and manuals. Bring the order reference or receipt. Installed, filled, or used items cannot be returned.",
        ],
      },
      {
        heading: "Wrong or damaged items",
        body: [
          "Report the issue as soon as the delivery arrives and include photos of the item and packaging. We arrange a replacement or refund after the item is checked.",
        ],
      },
      {
        heading: "Warranty claims",
        body: [
          "Defects covered by the manufacturer warranty are repaired or replaced under the Warranty Policy at no charge. Warranty claims are not refunds.",
        ],
      },
      {
        heading: "How refunds are issued",
        body: [
          "Refunds go to the original payment method or, for cash purchases, by bank transfer or showroom pickup. Processing starts after inspection. Wallet and bank reversals appear once the provider posts them.",
        ],
      },
    ],
  },
};

export const LegalModal = ({ documentKey, onClose }) => {
  const dialogRef = useRef(null);
  const doc = LEGAL_DOCUMENTS[documentKey];

  useEffect(() => {
    if (!doc) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [doc, onClose]);

  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-heading"
        aria-describedby="legal-modal-summary"
        tabIndex={-1}
        className="animate-fade-in-subtle flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-zinc-300 bg-white focus:outline-none sm:max-h-[85vh] sm:rounded"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2
              id="legal-modal-heading"
              className="text-sm font-bold uppercase tracking-wider text-zinc-900"
            >
              {doc.title}
            </h2>
            <p id="legal-modal-summary" className="text-[11px] leading-relaxed text-zinc-500">
              {doc.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-700"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 text-xs leading-relaxed text-zinc-600 sm:px-6">
          <div className="space-y-6">
            {doc.sections.map((section) => (
              <section key={section.heading} className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-900">
                  {section.heading}
                </h3>
                {section.body?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list && (
                  <ul className="list-disc space-y-1 pl-4 marker:text-zinc-400">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.after?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 text-[11px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Questions? Email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            or call{" "}
            <a
              href={HOTLINE_HREF}
              className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              {HOTLINE_DISPLAY}
            </a>
            .
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded bg-emerald-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
