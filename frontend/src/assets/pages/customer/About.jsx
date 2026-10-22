import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "../../components/ScrollReveal";

const FAQ_DATA = [
  {
    id: "faq-fin-req",
    category: "Financing and Credit",
    question: "What are the required documents to apply for motorcycle financing?",
    answer:
      "To apply for in-house or partner financing, submit: (1) One valid primary Philippine government ID (Driver's License, UMID, Passport, or National ID), (2) Proof of monthly income (latest 2 months payslips, Certificate of Employment with compensation, or 3 months bank statements for business owners), and (3) Proof of billing address (utility bill, internet bill, or barangay certificate) issued within the last 60 days.",
  },
  {
    id: "faq-credit-time",
    category: "Financing and Credit",
    question: "How long does credit review take?",
    answer:
      "Our digital credit evaluation team reviews submissions within 24 to 48 business hours. You will receive an SMS and email notification once your profile is verified with the approved credit limit and downpayment options.",
  },
  {
    id: "faq-terms-interest",
    category: "Financing and Credit",
    question: "What financing terms are available, and are there hidden fees?",
    answer:
      "We offer flexible repayment terms of 3, 6, 12, 24, and 36 months. All contracts use fixed-rate amortization with transparent interest schedules. What you see during checkout is your exact total contractual amount. No hidden charges, account creation fees, or pre-termination penalties.",
  },
  {
    id: "faq-early-payoff",
    category: "Financing and Credit",
    question: "Can I pay off my remaining installment balance early?",
    answer:
      "Yes. You can settle your outstanding loan balance early at any time through our online payment portal or at our showroom without penalty. Early settlements receive an interest rebate on the unserved months.",
  },
  {
    id: "faq-lto-inclusion",
    category: "LTO and Documentation",
    question: "Does the motorcycle purchase include LTO registration and insurance?",
    answer:
      "Yes. Every brand-new motorcycle released through Motorcycled includes official 3-year Land Transportation Office (LTO) registration, Third-Party Liability (TPL) insurance, and an official emission compliance certificate.",
  },
  {
    id: "faq-or-cr-timeline",
    category: "LTO and Documentation",
    question: "How long does it take to receive the official receipt, certificate of registration, and license plate?",
    answer:
      "A digital copy of your official LTO Certificate of Registration (CR) and Official Receipt (OR) is uploaded to your customer portal within 14 to 21 business days after handover. Physical metal plates are released following regional LTO batch distributions, and our compliance liaison will notify you immediately once available for branch pickup or courier dispatch.",
  },
  {
    id: "faq-cash-purchase",
    category: "LTO and Documentation",
    question: "Can I purchase with full cash or credit card instead of installment?",
    answer:
      "Yes. Full cash purchases, real-time InstaPay and PesoNet online transfers, and major credit cards (Visa and Mastercard) are supported directly at checkout or at our showroom cashier counter.",
  },
  {
    id: "faq-oem-warranty",
    category: "Warranty and Servicing",
    question: "What is covered under the manufacturer warranty?",
    answer:
      "All motorcycles come with official manufacturer factory warranty (typically 1 to 2 years or 10,000 to 20,000 km, whichever comes first, depending on the brand). The warranty covers engine mechanicals, transmission, and factory electrical defects. Warranty claims are honored at our showroom service bay and any authorized brand service partner nationwide.",
  },
  {
    id: "faq-routine-pms",
    category: "Warranty and Servicing",
    question: "Where can I bring my motorcycle for Periodic Maintenance Service (PMS)?",
    answer:
      "You can book routine PMS appointments through your Motorcycled account dashboard for service at our certified dealership center, or visit any accredited OEM dealer service center in your city using your Motorcycled warranty booklet.",
  },
  {
    id: "faq-parts-authenticity",
    category: "Warranty and Servicing",
    question: "Are the spare parts and accessories genuine OEM?",
    answer:
      "Yes. Every part, gasket, sprocket, brake pad, and lubricant sold on our platform is sourced directly from certified Philippine distributors for Yamaha, Honda, Suzuki, Kawasaki, CFMOTO, and Motul. Each unit features verifiable factory barcodes and batch identifiers.",
  },
  {
    id: "faq-delivery-areas",
    category: "Orders and Delivery",
    question: "Do you offer doorstep delivery, and what areas are covered?",
    answer:
      "We provide direct white-glove doorstep delivery within Metro Manila, Cavite, Laguna, Rizal, and Bulacan via our enclosed motorcycle transport vans. For provincial orders in Luzon, Visayas, and Mindanao, we arrange crated insured freight to your nearest regional logistics hub.",
  },
  {
    id: "faq-inspection-handover",
    category: "Orders and Delivery",
    question: "What happens during vehicle handover and release?",
    answer:
      "Prior to vehicle release, our certified service technicians conduct a 24-point pre-delivery inspection (PDI), including fluid levels, tire pressure, battery load test, brake adjustment, and safety checks. During handover, our release coordinator walks you through the vehicle features, maintenance schedule, and documents.",
  },
];

const CATEGORIES = [
  "All Questions",
  "Financing and Credit",
  "LTO and Documentation",
  "Warranty and Servicing",
  "Orders and Delivery",
];

export const About = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Questions");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState("faq-fin-req");

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === "All Questions" || item.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleFaq = (id) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Page header */}
      <section
        style={{ marginTop: "calc(-1 * var(--nav-h, 56px))" }}
        className="bg-zinc-950 text-white pt-24 pb-16 sm:pt-28 sm:pb-20 border-b border-zinc-800"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
              Official Multi-Brand Dealership
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight uppercase text-balance">
              About Motorcycled
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              Verified multi-brand motorcycles, OEM parts, and transparent in-house financing.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs font-mono uppercase tracking-wider text-zinc-400">
              <span>Authorized OEM partner</span>
              <span>LTO liaison</span>
              <span>Nationwide warranty</span>
            </div>
          </div>
        </div>
      </section>

      {/* At a glance */}
      <section data-nav-hero-end className="bg-zinc-900 border-b border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-y-6 sm:gap-x-8">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">3 to 36 months</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Fixed-rate financing with no hidden charges</p>
          </div>
          <div className="space-y-1 sm:border-l sm:border-zinc-800 sm:pl-6">
            <p className="text-sm font-semibold text-white">24 to 48 hours</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Digital credit review and approval</p>
          </div>
          <div className="space-y-1 sm:border-l sm:border-zinc-800 sm:pl-6">
            <p className="text-sm font-semibold text-white">LTO and OEM warranty</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Registration, insurance, and manufacturer coverage</p>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16 flex-1 w-full">
        {/* How we operate */}
        <ScrollReveal threshold={0.08} duration={400}>
          <section className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-8 lg:gap-14">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-balance">How We Operate</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Every vehicle and component passes provenance screening, official LTO processing, and pre-delivery mechanical testing.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
              <div className="space-y-1.5 border-t-2 border-zinc-900 pt-3">
                <p className="font-bold text-zinc-900">Genuine OEM Parts</p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Sourced from certified Philippine distributors for Yamaha, Honda, Suzuki, Kawasaki, and CFMOTO.
                </p>
              </div>
              <div className="space-y-1.5 border-t-2 border-zinc-900 pt-3">
                <p className="font-bold text-zinc-900">LTO Official Processing</p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Expedited 3-year registration with digital OR and CR archiving.
                </p>
              </div>
              <div className="space-y-1.5 border-t-2 border-zinc-900 pt-3">
                <p className="font-bold text-zinc-900">Manufacturer Warranty</p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Engine, transmission, and electrical coverage honored nationwide.
                </p>
              </div>
              <div className="space-y-1.5 border-t-2 border-zinc-900 pt-3">
                <p className="font-bold text-zinc-900">Inspected Release</p>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  24-point pre-delivery inspection before every handover.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* FAQ */}
        <ScrollReveal threshold={0.08} duration={400}>
          <section id="faq" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-zinc-900">
              <div className="space-y-2 max-w-xl">
                <h2 className="text-2xl font-bold tracking-tight text-balance">Questions and Answers</h2>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Financing, required documents, LTO registration, warranty, and delivery.
                </p>
              </div>

              {/* Search Bar for Q and A */}
              <div className="w-full md:w-72">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search questions and answers"
                    className="w-full h-10 pl-9 pr-3 rounded border border-zinc-300 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === cat
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Q and A Accordion List */}
            <div className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden bg-white">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-zinc-800">No matching questions found</p>
                  <p className="text-xs text-zinc-500">
                    Try a different search or select "All Questions".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All Questions");
                    }}
                    className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:underline pt-2 cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div key={faq.id} className="transition-colors hover:bg-zinc-50/50">
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                        aria-expanded={isOpen}
                      >
                        <div className="space-y-1 pr-2">
                          <span className="text-[11px] font-medium text-zinc-500 block">
                            {faq.category}
                          </span>
                          <span className="text-sm font-bold text-zinc-900 block">
                            {faq.question}
                          </span>
                        </div>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-zinc-200 bg-white text-zinc-600 transition-transform duration-200 ${
                            isOpen ? "rotate-180 bg-zinc-100 text-zinc-900" : ""
                          }`}
                        >
                          <svg
                            aria-hidden="true"
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 bg-zinc-50/40">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* Showroom and contact */}
        <section id="contact" className="bg-zinc-900 text-white p-6 sm:p-8 rounded-lg border border-zinc-800 space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Visit Our Metro Manila Dealership
            </h3>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center h-10 px-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
            >
              Browse Catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-zinc-400">Location</p>
              <p className="text-sm font-semibold text-white">Showroom and Turnover Facility</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ortigas Avenue Extension, Pasig City, Metro Manila 1600, Philippines
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-zinc-400">Operating Hours</p>
              <p className="text-sm font-semibold text-white">Monday to Saturday</p>
              <p className="text-xs text-zinc-400 leading-relaxed">8:30 AM to 6:30 PM</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-zinc-400">Direct Inquiries</p>
              <p className="text-sm font-semibold text-white">Customer Support Desk</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                inquiries@motorcycled.ph
                <br />
                +63 (2) 8876-5432
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
export default About;
