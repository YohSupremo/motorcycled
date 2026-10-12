import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { saveShippingInfo } from "../../../actions/cartActions";
import { ScrollReveal } from "../../components/ScrollReveal";

const BRANCHES = [
  "Pasig City — Central Dealership & Service Bay",
  "Quezon City — North Boulevard Showroom",
  "Cebu City — Visayas Releasing Depot",
];

export const Shipping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { shippingInfo } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    recipientName:
      shippingInfo?.recipientName ||
      (user ? `${user.firstName} ${user.lastName}` : ""),
    contactNumber: shippingInfo?.contactNumber || user?.contactNumber || "",
    address: shippingInfo?.address || "",
    barangay: shippingInfo?.barangay || "",
    city: shippingInfo?.city || "",
    postalCode: shippingInfo?.postalCode || "",
    fulfillmentMethod: shippingInfo?.fulfillmentMethod || "delivery",
    branch: shippingInfo?.branch || BRANCHES[0],
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = {};
    if (!form.recipientName.trim()) errs.recipientName = "Recipient name is required";
    if (!form.contactNumber.trim()) errs.contactNumber = "Contact number is required";
    if (form.fulfillmentMethod === "delivery") {
      if (!form.address.trim()) errs.address = "Address is required";
      if (!form.barangay.trim()) errs.barangay = "Barangay is required";
      if (!form.city.trim()) errs.city = "City is required";
      if (!form.postalCode.trim()) errs.postalCode = "Postal code is required";
    }
    if (form.fulfillmentMethod === "pickup" && !form.branch) {
      errs.branch = "Please select a branch";
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch(saveShippingInfo(form));
    navigate("/checkout/confirm");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-zinc-900">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-2">
            <span className="text-emerald-600 font-semibold">Cart</span>
            <span>→</span>
            <span className="text-zinc-900 font-semibold">Shipping</span>
            <span>→</span>
            <span>Confirm</span>
            <span>→</span>
            <span>Payment</span>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Fulfillment Details
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Provide your delivery address or select a pickup branch.
          </p>
        </div>

        <ScrollReveal threshold={0.05} duration={400}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient */}
            <div className="border border-zinc-200 rounded-md p-5 space-y-4 bg-white">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Recipient Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.recipientName}
                    onChange={(e) => handleChange("recipientName", e.target.value)}
                    className={`w-full h-9 px-3 border rounded-md text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 ${
                      errors.recipientName ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                    }`}
                    placeholder="Juan Dela Cruz"
                  />
                  {errors.recipientName && (
                    <p className="text-[11px] text-red-600 mt-0.5">{errors.recipientName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    value={form.contactNumber}
                    onChange={(e) => handleChange("contactNumber", e.target.value)}
                    className={`w-full h-9 px-3 border rounded-md text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 ${
                      errors.contactNumber ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                    }`}
                    placeholder="09XX XXX XXXX"
                  />
                  {errors.contactNumber && (
                    <p className="text-[11px] text-red-600 mt-0.5">{errors.contactNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Fulfillment Method */}
            <div className="border border-zinc-200 rounded-md p-5 space-y-4 bg-white">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Fulfillment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  className={`border rounded-md p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                    form.fulfillmentMethod === "delivery"
                      ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="fulfillmentMethod"
                      value="delivery"
                      checked={form.fulfillmentMethod === "delivery"}
                      onChange={() => handleChange("fulfillmentMethod", "delivery")}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-zinc-900 block">
                        Door-to-Door Delivery
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                        Official transport carrier with inspection before delivery.
                      </p>
                    </div>
                  </div>
                  <span className="mt-2 text-[11px] font-mono font-bold text-emerald-800 self-end">
                    ₱350.00 Freight (parts only)
                  </span>
                </label>

                <label
                  className={`border rounded-md p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                    form.fulfillmentMethod === "pickup"
                      ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="fulfillmentMethod"
                      value="pickup"
                      checked={form.fulfillmentMethod === "pickup"}
                      onChange={() => handleChange("fulfillmentMethod", "pickup")}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-zinc-900 block">
                        Dealership Pickup
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                        Pick up directly from the showroom with technician walkthrough.
                      </p>
                    </div>
                  </div>
                  <span className="mt-2 text-[11px] font-mono font-bold text-emerald-800 self-end">
                    FREE (₱0.00)
                  </span>
                </label>
              </div>

              {/* Delivery address fields */}
              {form.fulfillmentMethod === "delivery" && (
                <div className="pt-3 border-t border-zinc-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className={`w-full h-9 px-3 border rounded-md text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 ${
                        errors.address ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                      }`}
                      placeholder="Block 14 Lot 8 Emerald Avenue"
                    />
                    {errors.address && (
                      <p className="text-[11px] text-red-600 mt-0.5">{errors.address}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Barangay *
                      </label>
                      <input
                        type="text"
                        value={form.barangay}
                        onChange={(e) => handleChange("barangay", e.target.value)}
                        className={`w-full h-9 px-3 border rounded-md text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 ${
                          errors.barangay ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                        }`}
                        placeholder="Barangay"
                      />
                      {errors.barangay && (
                        <p className="text-[11px] text-red-600 mt-0.5">{errors.barangay}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        City / Municipality *
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        className={`w-full h-9 px-3 border rounded-md text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 ${
                          errors.city ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                        }`}
                        placeholder="Pasig City"
                      />
                      {errors.city && (
                        <p className="text-[11px] text-red-600 mt-0.5">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => handleChange("postalCode", e.target.value)}
                        className={`w-full h-9 px-3 border rounded-md text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 ${
                          errors.postalCode ? "border-red-400 bg-red-50" : "border-zinc-300 bg-white"
                        }`}
                        placeholder="1600"
                      />
                      {errors.postalCode && (
                        <p className="text-[11px] text-red-600 mt-0.5">{errors.postalCode}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Branch picker */}
              {form.fulfillmentMethod === "pickup" && (
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <label className="block text-xs font-semibold text-zinc-700">
                    Select Dealership Branch *
                  </label>
                  <select
                    value={form.branch}
                    onChange={(e) => handleChange("branch", e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-300 rounded-md bg-white text-zinc-900 text-xs focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {errors.branch && (
                    <p className="text-[11px] text-red-600">{errors.branch}</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                ← Back to Cart
              </button>
              <button
                type="submit"
                className="h-10 px-8 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Continue to Review →
              </button>
            </div>
          </form>
        </ScrollReveal>
      </main>
    </div>
  );
};
