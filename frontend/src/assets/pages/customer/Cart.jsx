import { useState } from "react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ScrollReveal } from "../../components/ScrollReveal";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";

export const Cart = ({ onNavigate }) => {
  // Initial realistic dealership cart items
  const [cartItems, setCartItems] = useState([
    {
      id: "cart-1",
      name: "Yamaha NMAX 155 ABS",
      category: "Motorcycles",
      brand: "Yamaha",
      unitPrice: 151900,
      quantity: 1,
      isVehicle: true,
      installmentEligible: true,
      monthlyEstimate: "₱11,340/mo (12 mos)",
      minDownpayment: 30380,
      inStock: 4,
    },
    {
      id: "cart-2",
      name: "Brembo 4-Piston Caliper Kit",
      category: "Brakes",
      brand: "Brembo",
      unitPrice: 8450,
      quantity: 2,
      isVehicle: false,
      installmentEligible: false,
      inStock: 12,
    },
    {
      id: "cart-3",
      name: "Motul 7100 4T 10W-40 Synthetic (1L)",
      category: "Lubricants",
      brand: "Motul",
      unitPrice: 780,
      quantity: 3,
      isVehicle: false,
      installmentEligible: false,
      inStock: 30,
    },
  ]);

  const [deliveryMethod, setDeliveryMethod] = useState("shipping"); // "shipping" | "pickup"
  const [selectedBranch, setSelectedBranch] = useState(
    "Pasig City - Central Dealership",
  );
  const [paymentOption, setPaymentOption] = useState("cash"); // "cash" | "installment" | "cod"
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  // Quantity Handlers
  const handleUpdateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(
            1,
            Math.min(item.inStock, item.quantity + delta),
          );
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to empty your cart?")) {
      setCartItems([]);
    }
  };

  // Financial Computations
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const shippingFee = deliveryMethod === "shipping" ? 350 : 0;
  const vatAmount = subtotal * 0.12; // 12% Philippine VAT included in computation
  const totalAmount = subtotal + shippingFee;

  // Check if any vehicle is in the cart
  const hasVehicle = cartItems.some((item) => item.isVehicle);

  const handleCheckout = (e) => {
    e.preventDefault();
    const newId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedOrderId(newId);
    setOrderConfirmed(true);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Breadcrumb / Meta */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Shopping Cart & Booking
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              Review certified motorcycle units, genuine replacement parts, and
              configure your preferred delivery destination or branch pickup.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("shop")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              ← Continue Shopping
            </button>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                Empty Cart
              </button>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <ScrollReveal threshold={0.1} duration={500}>
            <div className="border border-zinc-200 rounded-md p-16 text-center space-y-4 bg-zinc-50/50">
              <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900">
                  Your shopping cart is currently empty
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Explore showroom motorcycles, OEM engine assemblies, sintered
                  brakes, and certified riding safety gear.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("shop")}
                className="inline-flex items-center gap-2 !h-9 px-5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <span>Browse Inventory Catalog</span>
                <span>&rarr;</span>
              </button>
            </div>
          </ScrollReveal>
        ) : (
          /* Populated Cart Layout: Items Table on Left, Sticky Summary on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items List / Table */}
            <div className="lg:col-span-8 space-y-6">
              <ScrollReveal threshold={0.08} duration={600}>
                {/* Structured Items Table */}
                <div className="border border-zinc-200 rounded-md overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[11px] font-semibold">
                          <th className="py-3 px-4">Item Details</th>
                          <th className="py-3 px-4 font-mono">Unit Price</th>
                          <th className="py-3 px-4 text-center">Quantity</th>
                          <th className="py-3 px-4 font-mono text-right">
                            Subtotal
                          </th>
                          <th className="py-3 px-4 text-center w-10">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {cartItems.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-zinc-50/70 transition-colors"
                          >
                            {/* Item & Thumbnail */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 shrink-0 rounded bg-zinc-100 border border-zinc-200 overflow-hidden">
                                  <ProductImagePlaceholder
                                    category={item.category}
                                    name={item.name}
                                    brand={item.brand}
                                    compact
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="font-bold text-zinc-900 text-xs sm:text-sm">
                                      {item.name}
                                    </span>
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                      {item.brand}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                    <span>{item.category}</span>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-medium">
                                      {item.inStock} in showroom
                                    </span>
                                  </div>
                                  {item.installmentEligible && (
                                    <div className="pt-0.5">
                                      <span className="inline-block text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                        Financing: {item.monthlyEstimate}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Unit Price */}
                            <td className="py-3.5 px-4 font-mono text-zinc-900 font-semibold whitespace-nowrap">
                              ₱
                              {item.unitPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </td>

                            {/* Quantity Controls */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex items-center border border-zinc-300 rounded-md bg-white shadow-2xs">
                                <button
                                  type="button"
                                  disabled={item.quantity <= 1}
                                  onClick={() =>
                                    handleUpdateQuantity(item.id, -1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-mono font-semibold text-xs text-zinc-900 select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={item.quantity >= item.inStock}
                                  onClick={() =>
                                    handleUpdateQuantity(item.id, 1)
                                  }
                                  className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Line Subtotal */}
                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-right whitespace-nowrap">
                              ₱
                              {(item.unitPrice * item.quantity).toLocaleString(
                                "en-US",
                                { minimumFractionDigits: 2 },
                              )}
                            </td>

                            {/* Action Remove */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="w-7 h-7 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer text-xs"
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal>

              {/* Delivery Destination & Fulfillment Configuration */}
              <ScrollReveal threshold={0.08} delay={50} duration={600}>
                <div className="border border-zinc-200 rounded-md p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                    <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                      Fulfillment Method
                    </h2>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      STEP 02 OF 03
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Option 1: Door Delivery */}
                    <label
                      className={`border rounded-md p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                        deliveryMethod === "shipping"
                          ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                          : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="shipping"
                          checked={deliveryMethod === "shipping"}
                          onChange={() => setDeliveryMethod("shipping")}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <span className="font-bold text-zinc-900 block">
                            Inspected Door-to-Door Delivery
                          </span>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            Official transport carrier with mechanical
                            inspection before unloading.
                          </p>
                        </div>
                      </div>
                      <span className="mt-2 text-[11px] font-mono font-bold text-emerald-800 self-end">
                        ₱350.00 Freight
                      </span>
                    </label>

                    {/* Option 2: Branch Pickup */}
                    <label
                      className={`border rounded-md p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                        deliveryMethod === "pickup"
                          ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                          : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="pickup"
                          checked={deliveryMethod === "pickup"}
                          onChange={() => setDeliveryMethod("pickup")}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <span className="font-bold text-zinc-900 block">
                            Dealership Showroom Pickup
                          </span>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                            Pick up directly from service bay with complimentary
                            technician unboxing.
                          </p>
                        </div>
                      </div>
                      <span className="mt-2 text-[11px] font-mono font-bold text-emerald-800 self-end">
                        FREE (₱0.00)
                      </span>
                    </label>
                  </div>

                  {/* Destination Details */}
                  {deliveryMethod === "shipping" ? (
                    <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-zinc-700">
                          Dispatch Address:
                        </span>
                        <p className="text-zinc-900 font-medium">
                          Block 14 Lot 8 Emerald Avenue, Pasig City, 1600
                          Philippines
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate("profile", "address")}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer self-start sm:self-auto"
                      >
                        Change Address →
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-zinc-100 space-y-1.5 text-xs">
                      <label className="block font-semibold text-zinc-700">
                        Select Dealership Handover Branch:
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full !h-9 px-3 border border-zinc-300 rounded-md bg-white text-zinc-900 text-xs focus:outline-none focus:border-emerald-600 cursor-pointer"
                      >
                        <option value="Pasig City - Central Dealership">
                          Pasig City — Central Dealership & Service Bay
                        </option>
                        <option value="Quezon City - North Hub">
                          Quezon City — North Boulevard Showroom
                        </option>
                        <option value="Cebu City - Regional Hub">
                          Cebu City — Visayas Releasing Depot
                        </option>
                      </select>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Installment Financing Advisory if Vehicle in Cart */}
              {hasVehicle && (
                <ScrollReveal threshold={0.08} delay={70} duration={600}>
                  <div className="border border-emerald-200 rounded-md p-4 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>In-House Installment Financing Available</span>
                      </div>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">
                        Motorcycle units qualify for structured 12, 24, or
                        36-month repayment terms starting at 20% downpayment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate("orders")}
                      className="!h-8 px-4 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium whitespace-nowrap cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
                    >
                      Calculate Amortization →
                    </button>
                  </div>
                </ScrollReveal>
              )}
            </div>

            {/* Right Column: Sticky Order Summary Panel */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 self-start">
              <ScrollReveal threshold={0.1} duration={600}>
                <div className="border border-zinc-200 rounded-md p-5 bg-white space-y-5">
                  <div className="pb-3 border-b border-zinc-900">
                    <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                      Order Summary
                    </h2>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {cartItems.reduce((acc, item) => acc + item.quantity, 0)}{" "}
                      total line items
                    </span>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-2 text-xs divide-y divide-zinc-100">
                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>Items Subtotal:</span>
                      <span className="font-mono text-zinc-900 font-semibold">
                        ₱
                        {subtotal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>Delivery & Freight:</span>
                      <span className="font-mono text-zinc-900 font-semibold">
                        {shippingFee === 0
                          ? "FREE"
                          : `₱${shippingFee.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 text-zinc-600">
                      <span>VAT Inclusive (12%):</span>
                      <span className="font-mono text-zinc-500">
                        ₱
                        {vatAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between pt-3 pb-1 text-sm font-bold text-zinc-900">
                      <span>Total Amount:</span>
                      <span className="font-mono text-base text-zinc-900">
                        ₱
                        {totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="pt-2 border-t border-zinc-200 space-y-2 text-xs">
                    <label className="block font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                      Payment Settlement Method
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 p-2 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="cash"
                          checked={paymentOption === "cash"}
                          onChange={() => setPaymentOption("cash")}
                          className="accent-emerald-600"
                        />
                        <span className="text-zinc-800 font-medium">
                          Online Bank Deposit / GCash / Maya
                        </span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="cod"
                          checked={paymentOption === "cod"}
                          onChange={() => setPaymentOption("cod")}
                          className="accent-emerald-600"
                        />
                        <span className="text-zinc-800 font-medium">
                          Over-the-Counter Cash on Releasing
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="w-full !h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                  >
                    <span>Confirm Order & Booking</span>
                    <span>&rarr;</span>
                  </button>

                  {/* Dealer Security Guarantee */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center gap-2 text-[11px] text-zinc-500">
                    <svg
                      className="w-4 h-4 text-emerald-600 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>
                      LTO Registration assistance & genuine OEM warranty
                      included.
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}
      </main>

      {/* Order Confirmation Modal */}
      {orderConfirmed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Order Booking Confirmed
                </h3>
                <p className="text-xs font-mono text-zinc-500">
                  Reference: {confirmedOrderId}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Your official order voucher has been submitted to the Motorcycled
              fulfillment hub. An SMS notification and booking invoice have been
              dispatched to your registered contact number.
            </p>

            <div className="border border-zinc-200 rounded p-3 bg-zinc-50 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Fulfillment:</span>
                <span className="font-semibold text-zinc-900 capitalize">
                  {deliveryMethod === "shipping"
                    ? "Courier Dispatch"
                    : "Showroom Pickup"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Settlement Total:</span>
                <span className="font-mono font-bold text-zinc-900">
                  ₱
                  {totalAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrderConfirmed(false);
                  setCartItems([]);
                  onNavigate("orders");
                }}
                className="!h-9 px-4 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Track in My Orders &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
