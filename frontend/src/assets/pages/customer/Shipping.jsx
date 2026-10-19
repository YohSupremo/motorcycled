import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Stepper, Step, StepLabel, Box } from "@mui/material";
import { saveShippingInfo } from "../../../actions/cartActions";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { toast } from "react-toastify";

const CHECKOUT_STEPS = ["Cart", "Fulfillment & Verification", "Review & Terms", "Complete"];

const BRANCH_DETAILS = [
  {
    name: "Pasig City — Central Dealership & Service Bay",
    shortName: "Pasig Central Showroom & Service Bay",
    badge: "Flagship Showroom & PDI Depot",
    address: "Eulogio Amang Rodriguez Ave, Rosario, Pasig City, Metro Manila",
    hours: "Mon-Sat 8:30 AM-6:00 PM, Sun 9:00 AM-4:00 PM",
    phone: "(02) 8642-9901, 0917-882-3490",
  },
  {
    name: "Quezon City — North Boulevard Showroom",
    shortName: "QC North Boulevard Showroom",
    badge: "North Metro Releasing Hub",
    address: "North EDSA Cor. Mindanao Ave, Project 7, Quezon City",
    hours: "Mon-Sat 9:00 AM-6:30 PM",
    phone: "(02) 8928-4412, 0918-902-1145",
  },
  {
    name: "Cebu City — Visayas Releasing Depot",
    shortName: "Cebu Central Releasing Depot",
    badge: "Visayas Regional Center",
    address: "Subangdaku National Highway, Mandaue City, Metro Cebu",
    hours: "Mon-Sat 8:30 AM-5:30 PM",
    phone: "(032) 346-8800, 0920-911-7723",
  },
];

const GOVERNMENT_IDS = [
  "Land Transportation Office (LTO) Driver's License",
  "PhilSys National ID (Philippine Identification System)",
  "Unified Multi-Purpose ID (UMID)",
  "Philippine Passport",
  "Social Security System (SSS) ID",
  "Professional Regulation Commission (PRC) License",
  "Postal ID (Digital / High Security)",
];

const EMPLOYMENT_STATUSES = [
  "Employed — Private Corporation",
  "Employed — Government / Public Sector",
  "Self-Employed / Business Owner (DTI / SEC)",
  "Overseas Filipino Worker (OFW / Seafarer)",
  "Freelancer / Digital Contractor / VA",
  "Transport / TNVS / Delivery Driver (Grab, Angkas, etc.)",
  "Pensioner / Retired",
  "Remittance Dependent / Family Supported",
  "Other Livelihood Source",
];

const TENURE_OPTIONS = [
  "Less than 1 year",
  "1 to 2 years",
  "3 to 5 years",
  "Over 5 years",
];

const INCOME_RANGES = [
  "Below ₱20,000 / month",
  "₱20,000 – ₱34,999 / month",
  "₱35,000 – ₱49,999 / month",
  "₱50,000 – ₱79,999 / month",
  "₱80,000 – ₱119,999 / month",
  "₱120,000+ / month",
];

const SECONDARY_INCOME_SOURCES = [
  "None / Single Primary Source",
  "Freelance / Online Gig Work",
  "Small Business / Sari-Sari Store / E-Commerce",
  "Remittance from Family / OFW Support",
  "Rental Properties / Real Estate",
  "Spouse / Co-Earner Household Income",
  "Agricultural / Farm Produce",
  "Other Supplementary Income",
];

const SECONDARY_INCOME_RANGES = [
  "Below ₱10,000 / month",
  "₱10,000 – ₱24,999 / month",
  "₱25,000 – ₱49,999 / month",
  "₱50,000+ / month",
];

const PROOF_OF_INCOME_TYPES = [
  "Latest 3 Months Payslips (Digital or Printed)",
  "Certificate of Employment with Compensation (COEC)",
  "Bank Statements / Passbook (Latest 3 Months)",
  "Income Tax Return (BIR Form 2316 or 1701)",
  "DTI / SEC Business Registration & Permits",
  "Remittance Claim Receipts / Bank Receipts (OFW)",
  "E-Wallet Platform Earnings Statements (Grab / Angkas / Upwork)",
];

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const Shipping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems = [], shippingInfo } = useSelector((state) => state.cart || {});
  const { user } = useSelector((state) => state.auth || {});

  const selectedItems = useMemo(
    () => (cartItems || []).filter((i) => i.selected),
    [cartItems]
  );

  const hasMotorcycles = useMemo(
    () => selectedItems.some((i) => i.isVehicle),
    [selectedItems]
  );
  const hasParts = useMemo(
    () => selectedItems.some((i) => !i.isVehicle),
    [selectedItems]
  );
  const hasInstallment = useMemo(
    () => selectedItems.some((i) => i.isVehicle && i.purchaseMethod === "installment"),
    [selectedItems]
  );
  const hasCashItems = useMemo(
    () => selectedItems.some((i) => !i.isVehicle || i.purchaseMethod !== "installment"),
    [selectedItems]
  );

  // Initial parts fulfillment: if mixed order, default parts to "delivery" so they can ship to home
  const initialPartsFulfillment =
    shippingInfo?.partsFulfillmentMethod ||
    (hasParts && hasMotorcycles ? "delivery" : shippingInfo?.fulfillmentMethod || "delivery");

  const [form, setForm] = useState({
    recipientName:
      shippingInfo?.recipientName ||
      (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : ""),
    contactNumber: shippingInfo?.contactNumber || user?.contactNumber || "",
    email: shippingInfo?.email || user?.email || "",

    // Parts delivery shipping address
    address: shippingInfo?.address || "",
    barangay: shippingInfo?.barangay || "",
    city: shippingInfo?.city || "",
    postalCode: shippingInfo?.postalCode || "",
    deliveryNotes: shippingInfo?.deliveryNotes || "",

    // Parts fulfillment method ('delivery' | 'pickup')
    partsFulfillmentMethod: initialPartsFulfillment,

    // Vehicle showroom releasing depot (motorcycles always release at showroom)
    branch: shippingInfo?.branch || BRANCH_DETAILS[0].name,

    // Vehicle KYC Registration Credentials
    governmentIdType: shippingInfo?.governmentIdType || GOVERNMENT_IDS[0],
    governmentIdNumber: shippingInfo?.governmentIdNumber || "",
    emergencyContactName: shippingInfo?.emergencyContactName || "",
    emergencyContactNumber: shippingInfo?.emergencyContactNumber || "",

    // Financing KYC Pre-qualification
    employmentStatus: shippingInfo?.employmentStatus || EMPLOYMENT_STATUSES[0],
    employerName: shippingInfo?.employerName || "",
    yearsEmployed: shippingInfo?.yearsEmployed || TENURE_OPTIONS[1],
    workplaceLocation: shippingInfo?.workplaceLocation || "",
    monthlyIncome: shippingInfo?.monthlyIncome || INCOME_RANGES[2],
    secondaryIncomeSource: shippingInfo?.secondaryIncomeSource || SECONDARY_INCOME_SOURCES[0],
    secondaryIncomeAmount: shippingInfo?.secondaryIncomeAmount || SECONDARY_INCOME_RANGES[0],
    proofOfIncomeType: shippingInfo?.proofOfIncomeType || PROOF_OF_INCOME_TYPES[0],
    verificationMethod: shippingInfo?.verificationMethod || "showroom_physical",
    idCardPreview: shippingInfo?.idCardPreview || null,
    proofOfIncomePreview: shippingInfo?.proofOfIncomePreview || null,
  });

  // Pre-fill user details when auth completes loading
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setForm((prev) => ({
          ...prev,
          recipientName: prev.recipientName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          contactNumber: prev.contactNumber || user.contactNumber || "",
          email: prev.email || user.email || "",
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Financial calculations
  const partsCashTotal = selectedItems
    .filter((i) => !i.isVehicle)
    .reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);

  const motoCashTotal = selectedItems
    .filter((i) => i.isVehicle && i.purchaseMethod !== "installment")
    .reduce((acc, i) => acc + (i.price || 0), 0);

  // Shipping fee applies when parts are being delivered to home address
  const shippingFee = hasParts && form.partsFulfillmentMethod === "delivery" ? 350 : 0;
  const immediateCashTotal = partsCashTotal + motoCashTotal + shippingFee;

  const validate = () => {
    const errs = {};
    if (!form.recipientName.trim()) errs.recipientName = "Full legal name is required";
    if (!form.contactNumber.trim()) errs.contactNumber = "Active contact number is required";
    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Please enter a valid email address";
    }

    // Vehicle Releasing branch check
    if (hasMotorcycles || (!hasMotorcycles && form.partsFulfillmentMethod === "pickup")) {
      if (!form.branch) errs.branch = "Please choose an authorized showroom branch";
    }

    // Financing Pre-qualification check
    if (hasInstallment) {
      if (!form.employerName.trim()) {
        errs.employerName = "Employer or registered business name is required for credit evaluation";
      }
    }

    // Parts delivery shipping address check
    if (hasParts && form.partsFulfillmentMethod === "delivery") {
      if (!form.address.trim()) errs.address = "Street address is required for courier delivery";
      if (!form.barangay.trim()) errs.barangay = "Barangay is required";
      if (!form.city.trim()) errs.city = "City / Municipality is required";
      if (!form.postalCode.trim()) errs.postalCode = "Postal code is required";
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning("Please complete all required fields before proceeding");
      return;
    }

    dispatch(
      saveShippingInfo({
        ...form,
        fulfillmentMethod: hasMotorcycles ? "pickup" : form.partsFulfillmentMethod,
        partsFulfillmentMethod: form.partsFulfillmentMethod,
      })
    );
    navigate("/checkout/confirm");
  };

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-900">No Items Selected</h2>
          <p className="text-xs text-zinc-500">
            Please return to your cart and choose the items you want to purchase.
          </p>
          <Link
            to="/cart"
            className="inline-block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased flex flex-col font-sans">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* MUI Stepper (Step 2: Fulfillment & Verification) */}
        <Box sx={{ width: "100%", pb: 1 }}>
          <Stepper activeStep={1} alternativeLabel>
            {CHECKOUT_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    },
                    "& .Mui-active": {
                      color: "#059669 !important",
                      fontWeight: 700,
                    },
                    "& .Mui-completed": {
                      color: "#059669 !important",
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Page Sub-header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Fulfillment & Customer Verification
              </h1>
              <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Step 2 of 3
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">
              {hasMotorcycles && hasParts
                ? "Vehicle releasing bay and parts delivery preference."
                : hasMotorcycles
                  ? "Choose your authorized showroom releasing bay and verification details."
                  : "Choose parts delivery or pickup."}
            </p>
          </div>

          <Link
            to="/cart"
            className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold self-start sm:self-auto transition-colors"
          >
            ← Return to Cart
          </Link>
        </div>

        {/* 2-Column Main Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Clear Operational Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ─────────────────────────────────────────────────────────── */}
              {/* CHANNEL 1: MOTORCYCLE SHOWROOM RELEASING DEPOT              */}
              {/* ─────────────────────────────────────────────────────────── */}
              {hasMotorcycles && (
                <section className="border-b border-zinc-200 pb-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          1
                        </span>
                        <h2 className="text-base font-extrabold text-zinc-900">
                          Motorcycle Showroom Releasing Depot
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 pl-7">
                        Motorcycles require PDI, conduction release, and registration turnover.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide block">
                      Select Authorized Dealership Showroom:
                    </span>

                    <div className="space-y-2.5">
                      {BRANCH_DETAILS.map((branch) => {
                        const isSelected = form.branch === branch.name;
                        return (
                          <div
                            key={branch.name}
                            onClick={() => handleChange("branch", branch.name)}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3.5 ${isSelected
                              ? "border-emerald-600 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-600/30"
                              : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
                              }`}
                          >
                            <input
                              type="radio"
                              name="motorcycleBranch"
                              checked={isSelected}
                              onChange={() => handleChange("branch", branch.name)}
                              className="mt-1 accent-emerald-600 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-extrabold text-zinc-900 text-sm">
                                  {branch.shortName}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                                  {branch.badge}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-600 mt-1">
                                {branch.address}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-zinc-500 font-mono">
                                <span>{branch.hours}</span>
                                <span>•</span>
                                <span className="text-emerald-800 font-semibold">{branch.phone}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {errors.branch && (
                      <p className="text-xs text-red-600 font-semibold mt-1">{errors.branch}</p>
                    )}
                  </div>
                </section>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* CHANNEL 2: PARTS & ACCESSORIES DISPATCH                     */}
              {/* ─────────────────────────────────────────────────────────── */}
              {hasParts && (
                <section className="border-b border-zinc-200 pb-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {hasMotorcycles ? "2" : "1"}
                        </span>
                        <h2 className="text-base font-extrabold text-zinc-900">
                          Parts & Accessories Logistics
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 pl-7">
                        {hasMotorcycles
                          ? "Deliver parts to home or bundle with your motorcycle pickup."
                          : "Choose delivery or pickup at our parts counter."}
                      </p>
                    </div>
                  </div>

                  {/* Tactile 2-Option Selector for Parts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleChange("partsFulfillmentMethod", "delivery")}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${form.partsFulfillmentMethod === "delivery"
                        ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600/30 shadow-xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/40"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                          EXP
                        </div>
                        <div>
                          <span className="font-extrabold text-zinc-900 text-xs block">
                            Door-to-Door Courier Delivery
                          </span>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            Shipped directly to your doorstep with certified motorcycle courier parcel tracking.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] font-mono">
                        <span className="text-zinc-500">Freight Fee</span>
                        <span className="font-bold text-emerald-800">₱350.00 Freight</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange("partsFulfillmentMethod", "pickup")}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${form.partsFulfillmentMethod === "pickup"
                        ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600/30 shadow-xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/40"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                          BAY
                        </div>
                        <div>
                          <span className="font-extrabold text-zinc-900 text-xs block">
                            {hasMotorcycles ? "Collect with Motorcycle" : "Showroom Counter Pickup"}
                          </span>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            {hasMotorcycles
                              ? "Bundled and ready at your selected showroom counter during vehicle turnover."
                              : "Pick up directly at the dealership parts releasing desk."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] font-mono">
                        <span className="text-zinc-500">Collection Fee</span>
                        <span className="font-bold text-emerald-800">FREE (₱0.00)</span>
                      </div>
                    </button>
                  </div>

                  {/* IF PARTS DELIVERY: Clean Courier Address Fields */}
                  {form.partsFulfillmentMethod === "delivery" && (
                    <div className="pt-4 border-t border-zinc-100 space-y-3.5 bg-zinc-50/60 p-4 sm:p-5 rounded-xl border border-zinc-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                          Parts Delivery Shipping Address
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">Door-to-Door Courier</span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-700 block mb-1">
                          Street Address / Unit / Building / House No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.address}
                          onChange={(e) => handleChange("address", e.target.value)}
                          placeholder="e.g. Unit 4B, 24 Ruby St., San Antonio Village"
                          className="w-full h-11 px-3.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        />
                        {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-700 block mb-1">
                            Barangay *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.barangay}
                            onChange={(e) => handleChange("barangay", e.target.value)}
                            placeholder="e.g. San Antonio"
                            className="w-full h-11 px-3.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                          {errors.barangay && <p className="text-xs text-red-600 mt-1">{errors.barangay}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-700 block mb-1">
                            City / Municipality *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            placeholder="e.g. Pasig City"
                            className="w-full h-11 px-3.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                          {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-700 block mb-1">
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.postalCode}
                            onChange={(e) => handleChange("postalCode", e.target.value)}
                            placeholder="e.g. 1600"
                            className="w-full h-11 px-3.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 font-mono"
                          />
                          {errors.postalCode && <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-zinc-600 block mb-1">
                          Delivery Instructions / Landmarks (Optional)
                        </label>
                        <input
                          type="text"
                          value={form.deliveryNotes}
                          onChange={(e) => handleChange("deliveryNotes", e.target.value)}
                          placeholder="e.g. Leave with guard at lobby, beside Shell gas station"
                          className="w-full h-10 px-3.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* IF PARTS PICKUP & NO MOTORCYCLE IN CART: Pick Showroom Branch */}
                  {form.partsFulfillmentMethod === "pickup" && !hasMotorcycles && (
                    <div className="pt-3 border-t border-zinc-100 space-y-2.5">
                      <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide block">
                        Choose Pickup Showroom Branch:
                      </span>
                      <div className="space-y-2">
                        {BRANCH_DETAILS.map((branch) => (
                          <div
                            key={branch.name}
                            onClick={() => handleChange("branch", branch.name)}
                            className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs ${form.branch === branch.name
                              ? "border-emerald-600 bg-emerald-50/20 font-bold text-zinc-900"
                              : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
                              }`}
                          >
                            <span>{branch.shortName}</span>
                            <span className="text-zinc-500 font-mono text-[11px]">{branch.hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ─────────────────────────────────────────────────────────── */}
              {/* SECTION 3: PURCHASER IDENTIFICATION & KYC DOSSIER            */}
              {/* ─────────────────────────────────────────────────────────── */}
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {hasMotorcycles && hasParts ? "3" : "2"}
                      </span>
                      <h2 className="text-base font-extrabold text-zinc-900">
                        Purchaser Identity & Legal Credentials
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 pl-7">
                      Credentials for invoicing, permits, and warranty records.
                    </p>
                  </div>
                </div>

                {/* Primary Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-800 block mb-1">
                      Full Legal Name (as shown on Government ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.recipientName}
                      onChange={(e) => handleChange("recipientName", e.target.value)}
                      placeholder="e.g. Juan Carlos Dela Cruz"
                      className="w-full h-11 px-3.5 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    {errors.recipientName && <p className="text-xs text-red-600 mt-1">{errors.recipientName}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-800 block mb-1">
                      Mobile Contact Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.contactNumber}
                      onChange={(e) => handleChange("contactNumber", e.target.value)}
                      placeholder="0917 123 4567"
                      className="w-full h-11 px-3.5 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 font-mono"
                    />
                    {errors.contactNumber && <p className="text-xs text-red-600 mt-1">{errors.contactNumber}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-800 block mb-1">
                      Email Address (for Official Invoices & Notices) *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="juandelacruz@gmail.com"
                      className="w-full h-11 px-3.5 border border-zinc-300 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Financing Pre-Qualification (When Installment is chosen) */}
                {hasInstallment && (
                  <div className="pt-4 border-t border-zinc-100 space-y-5 bg-amber-50/40 p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-950 uppercase tracking-wide block">
                          In-House Financing Pre-Qualification
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                          24-Hour Review SLA
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                        These credentials enable our credit investigation (CI) underwriters to evaluate and pre-approve your installment loan application.
                      </p>
                    </div>

                    {/* Part 1: Primary Livelihood & Income */}
                    <div className="space-y-3 pt-1">
                      <span className="text-[11px] font-mono font-bold text-amber-900 uppercase tracking-wider block">
                        1. Primary Source of Income
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-800 block mb-1">
                            Primary Livelihood / Income Type *
                          </label>
                          <select
                            value={form.employmentStatus}
                            onChange={(e) => handleChange("employmentStatus", e.target.value)}
                            className="w-full h-11 px-3 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
                          >
                            {EMPLOYMENT_STATUSES.map((emp) => (
                              <option key={emp} value={emp}>
                                {emp}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-800 block mb-1">
                            Employer, Business or Company Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={form.employerName}
                            onChange={(e) => handleChange("employerName", e.target.value)}
                            placeholder="e.g. San Miguel Corp, BDO, Upwork, Grab"
                            className="w-full h-11 px-3.5 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-900 shadow-2xs"
                          />
                          {errors.employerName && (
                            <p className="text-xs text-red-600 mt-1 font-semibold">{errors.employerName}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-800 block mb-1">
                            Employment / Business Tenure *
                          </label>
                          <select
                            value={form.yearsEmployed}
                            onChange={(e) => handleChange("yearsEmployed", e.target.value)}
                            className="w-full h-11 px-3 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
                          >
                            {TENURE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-800 block mb-1">
                            Gross Monthly Income Bracket *
                          </label>
                          <select
                            value={form.monthlyIncome}
                            onChange={(e) => handleChange("monthlyIncome", e.target.value)}
                            className="w-full h-11 px-3 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
                          >
                            {INCOME_RANGES.map((inc) => (
                              <option key={inc} value={inc}>
                                {inc}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Supplementary Income Sources */}
                    <div className="space-y-3 pt-3 border-t border-amber-200/80">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-amber-900 uppercase tracking-wider block">
                          2. Supplementary & Secondary Income (Optional)
                        </span>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          Side hustles, remittances, or spousal income can significantly increase your loan approval limit.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-800 block mb-1">
                            Additional Income Source
                          </label>
                          <select
                            value={form.secondaryIncomeSource}
                            onChange={(e) => handleChange("secondaryIncomeSource", e.target.value)}
                            className="w-full h-11 px-3 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
                          >
                            {SECONDARY_INCOME_SOURCES.map((src) => (
                              <option key={src} value={src}>
                                {src}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-800 block mb-1">
                            Estimated Secondary Monthly Earnings
                          </label>
                          <select
                            disabled={form.secondaryIncomeSource.startsWith("None")}
                            value={form.secondaryIncomeAmount}
                            onChange={(e) => handleChange("secondaryIncomeAmount", e.target.value)}
                            className="w-full h-11 px-3 border border-zinc-300 rounded-xl text-xs text-zinc-900 bg-white disabled:bg-zinc-100 disabled:text-zinc-400 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
                          >
                            {SECONDARY_INCOME_RANGES.map((rng) => (
                              <option key={rng} value={rng}>
                                {rng}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Part 3: Verification Documents & Optional Upload */}
                    <div className="space-y-4 pt-3 border-t border-amber-200/80">
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-amber-900 uppercase tracking-wider block">
                            3. Identity & Income Verification Documents
                          </span>
                          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-bold">
                            RA 10173 DPA Compliant
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          Specify the credentials you will present. You can upload photos now for rapid pre-approval or simply bring them to the showroom later.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Valid ID Selector & Upload */}
                        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                          <div>
                            <label className="text-xs font-semibold text-zinc-800 block mb-1">
                              Valid Government ID Type
                            </label>
                            <select
                              value={form.governmentIdType}
                              onChange={(e) => handleChange("governmentIdType", e.target.value)}
                              className="w-full h-10 px-3 border border-zinc-300 rounded-lg text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
                            >
                              {GOVERNMENT_IDS.map((idType) => (
                                <option key={idType} value={idType}>
                                  {idType}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-zinc-600">
                                Upload Photo of ID (Optional)
                              </label>
                              {form.idCardPreview && (
                                <span className="text-[10px] font-mono text-emerald-700 font-bold">Photo Attached</span>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    handleChange("idCardPreview", reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-xs text-zinc-600 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-900 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Proof of Income Selector & Upload */}
                        <div className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                          <div>
                            <label className="text-xs font-semibold text-zinc-800 block mb-1">
                              Proof of Income Document
                            </label>
                            <select
                              value={form.proofOfIncomeType}
                              onChange={(e) => handleChange("proofOfIncomeType", e.target.value)}
                              className="w-full h-10 px-3 border border-zinc-300 rounded-lg text-xs text-zinc-900 bg-white focus:outline-none focus:border-zinc-900 cursor-pointer"
                            >
                              {PROOF_OF_INCOME_TYPES.map((doc) => (
                                <option key={doc} value={doc}>
                                  {doc}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-zinc-600">
                                Upload Income Proof (Optional)
                              </label>
                              {form.proofOfIncomePreview && (
                                <span className="text-[10px] font-mono text-emerald-700 font-bold">File Attached</span>
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    handleChange("proofOfIncomePreview", reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-xs text-zinc-600 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-900 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Auto-Purge Privacy Guarantee Notice */}
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          <strong>Ephemeral Document Protection:</strong> If you attach document photos, our system automatically purges and permanently destroys them from our storage servers immediately after underwriting review. Physical verification is completed at your assigned showroom bay.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/cart"
                  className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Return to Cart
                </Link>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Continue to Review & Terms →
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-5">

              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <h3 className="font-extrabold text-zinc-900 text-base">
                  Order Summary
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  {selectedItems.length} selected item{selectedItems.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Item Previews */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <div key={item.cartItemId} className="flex items-center gap-3 text-xs">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ProductImagePlaceholder category={item.category} name={item.name} brand={item.brand} compact />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-zinc-900 block truncate">{item.name}</span>
                      <span className="text-zinc-500 text-[11px]">
                        {item.isVehicle
                          ? item.purchaseMethod === "installment"
                            ? `Financing (${item.termMonths || 12} mo)`
                            : "Outright Cash"
                          : `Qty: ${item.quantity}`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 shrink-0">
                      {fmt(item.price * (item.isVehicle ? 1 : item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Logistics Routing Summary */}
              <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                  Logistics Routing:
                </span>

                {hasMotorcycles && (
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900">Vehicle Releasing:</span>
                      <span className="font-mono font-bold text-emerald-800">Showroom Turnover</span>
                    </div>
                    <p className="text-zinc-600">{form.branch}</p>
                    <p className="text-[10px] text-zinc-400">Includes PDI inspection & registration turnover</p>
                  </div>
                )}

                {hasParts && (
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900">Parts & Gear:</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {form.partsFulfillmentMethod === "delivery" ? "Door-to-Door Courier" : "Showroom Collection"}
                      </span>
                    </div>
                    <p className="text-zinc-600">
                      {form.partsFulfillmentMethod === "delivery"
                        ? form.city
                          ? `Delivering to: ${form.city}, ${form.barangay || ""}`
                          : "Express courier delivery to your address"
                        : `Ready at counter: ${form.branch}`}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {form.partsFulfillmentMethod === "delivery" ? "Freight Fee: ₱350.00" : "Collection Fee: FREE"}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Tally */}
              <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs">
                {partsCashTotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Parts & Accessories:</span>
                    <span className="font-mono font-semibold text-zinc-900">{fmt(partsCashTotal)}</span>
                  </div>
                )}
                {motoCashTotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Motorcycles (Cash):</span>
                    <span className="font-mono font-semibold text-zinc-900">{fmt(motoCashTotal)}</span>
                  </div>
                )}
                {shippingFee > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Parts Courier Freight:</span>
                    <span className="font-mono font-semibold text-zinc-900">{fmt(shippingFee)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100">
                  {hasInstallment && !hasCashItems ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Upfront Due Today:</span>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ₱0.00 (Due Upon Approval)
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-700 leading-tight">
                        Downpayment is settled directly at showroom counter upon credit release.
                      </p>
                    </div>
                  ) : hasInstallment && hasCashItems ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm font-bold text-zinc-900">
                        <span>Immediate Cash Due:</span>
                        <span className="font-mono text-base font-extrabold text-zinc-900">
                          {fmt(immediateCashTotal)}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-700">
                        Includes parts + freight. Financing application submitted for credit review.
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm font-bold text-zinc-900">
                      <span>Total Cash Payable:</span>
                      <span className="font-mono text-lg font-extrabold text-zinc-900">
                        {fmt(immediateCashTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dealership Trust Assurances */}
              <div className="pt-4 border-t border-zinc-100 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-zinc-600">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>LTO Registration Liaison Assistance</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Certified Dealership OEM Warranty</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>Pre-Delivery Inspection (PDI) at Releasing Bay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
