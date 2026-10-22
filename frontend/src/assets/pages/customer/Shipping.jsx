import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  buildShippingSchema,
  MONTHLY_INCOME_RANGES,
  shippingAddressSchema,
} from "../../schema/shippingSchema.js";
import { saveShippingInfo } from "../../../actions/cartActions";
import {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
} from "../../../actions/profileActions";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { CheckoutStepper } from "../../components/CheckoutStepper";
import { toast } from "react-toastify";

const BRANCHES = [
  {
    id: "pasig",
    name: "Pasig City — Central Dealership",
    address: "Eulogio Amang Rodriguez Ave, Rosario, Pasig City, Metro Manila",
    hours: "Mon-Sat 8:30 AM – 6:00 PM, Sun 9:00 AM – 4:00 PM",
    phone: "(02) 8642-9901 / 0917-882-3490",
  },
  {
    id: "qc",
    name: "Quezon City — North Boulevard Showroom",
    address: "North EDSA cor. Mindanao Ave, Project 7, Quezon City",
    hours: "Mon-Sat 9:00 AM – 6:30 PM",
    phone: "(02) 8928-4412 / 0918-902-1145",
  },
  {
    id: "cebu",
    name: "Cebu City — Visayas Releasing Depot",
    address: "Subangdaku National Highway, Mandaue City, Metro Cebu",
    hours: "Mon-Sat 8:30 AM – 5:30 PM",
    phone: "(032) 346-8800 / 0920-911-7723",
  },
];

const GOV_IDS = [
  "LTO Driver's License",
  "PhilSys National ID",
  "UMID",
  "Philippine Passport",
  "SSS ID",
  "PRC License",
];

const fmt = (n) =>
  `₱${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const Shipping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems = [], shippingInfo } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const {
    addresses = [],
    addressesLoading = false,
    addressesUpdating = false,
  } = useSelector((state) => state.profile);

  const selectedItems = useMemo(
    () => cartItems.filter((i) => i.selected),
    [cartItems]
  );

  const selectedMotorcycles = useMemo(
    () => selectedItems.filter((i) => i.isVehicle),
    [selectedItems]
  );

  const selectedParts = useMemo(
    () => selectedItems.filter((i) => !i.isVehicle),
    [selectedItems]
  );

  const hasMotorcycles = selectedMotorcycles.length > 0;
  const hasParts = selectedParts.length > 0;
  const hasInstallment = selectedMotorcycles.some(
    (m) => m.purchaseMethod === "installment"
  );

  // Address selection & inline management state
  const [explicitAddressId, setExplicitAddressId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const defaultAddress =
    addresses.find((a) => a.isDefault) || addresses[0] || null;
  const selectedAddressId = explicitAddressId ?? defaultAddress?._id ?? null;

  const shippingSchema = useMemo(
    () =>
      buildShippingSchema({
        hasMotorcycles,
        hasInstallment,
        requireAddress: hasParts && !isAddingNew && addresses.length > 0,
      }),
    [hasMotorcycles, hasInstallment, hasParts, isAddingNew, addresses.length],
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(shippingSchema),
    defaultValues: {
      recipientName:
        shippingInfo?.recipientName ||
        (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : ""),
      contactNumber: shippingInfo?.contactNumber || user?.contactNumber || "",
      email: shippingInfo?.email || user?.email || "",

      // Fulfillment
      fulfillmentMethod: hasMotorcycles
        ? "pickup"
        : shippingInfo?.fulfillmentMethod || "delivery",
      partsFulfillmentMethod:
        shippingInfo?.partsFulfillmentMethod ||
        (hasParts ? "delivery" : "pickup"),
      branch: shippingInfo?.branch || BRANCHES[0].name,

      // Courier delivery address (if parts delivery chosen)
      address: shippingInfo?.address || "",
      barangay: shippingInfo?.barangay || "",
      city: shippingInfo?.city || "",
      postalCode: shippingInfo?.postalCode || "",
      deliveryNotes: shippingInfo?.deliveryNotes || "",

      // Financing verification (only needed if installment chosen)
      governmentIdType: shippingInfo?.governmentIdType || GOV_IDS[0],
      governmentIdNumber: shippingInfo?.governmentIdNumber || "",
      employerName: shippingInfo?.employerName || "",
      monthlyIncome: MONTHLY_INCOME_RANGES.includes(
        shippingInfo?.monthlyIncome,
      )
        ? shippingInfo.monthlyIncome
        : "",
    },
  });

  const form = useWatch({ control });

  const {
    control: addressControl,
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddress,
    trigger: triggerAddress,
    formState: { errors: addressFormErrors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(shippingAddressSchema),
    defaultValues: {
      label: "Home",
      street: "",
      barangay: "",
      city: "",
      postalCode: "",
      isDefault: false,
    },
  });

  const addressForm = useWatch({ control: addressControl });

  // Fetch saved user addresses on mount
  useEffect(() => {
    if (user) {
      dispatch(getAddresses());
    }
  }, [dispatch, user]);

  const applyAddressToForm = (addr) => {
    setValue("address", addr.street || "");
    setValue("barangay", addr.barangay || "");
    setValue("city", addr.city || "");
    setValue("postalCode", addr.postalCode || "");
    clearErrors(["address", "barangay", "city", "postalCode"]);
  };

  // Synchronize saved addresses with the selected address (explicit or default)
  useEffect(() => {
    if (!addresses || addresses.length === 0) return;

    const activeAddress =
      addresses.find((a) => a._id === selectedAddressId) || defaultAddress;
    if (activeAddress) applyAddressToForm(activeAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  const selectAddress = (addr) => {
    setExplicitAddressId(addr._id);
    applyAddressToForm(addr);
    setIsAddingNew(false);
    setEditingAddressId(null);
  };

  const handleSetDefaultAddress = async (e, addressId) => {
    e.stopPropagation();
    const success = await dispatch(setDefaultAddress(addressId));
    if (success) {
      setExplicitAddressId(null);
      toast.success("Default address updated!");
    }
  };

  const startAddAddress = () => {
    setIsAddingNew(true);
    setEditingAddressId(null);
    resetAddress({
      label: "Home",
      street: "",
      barangay: "",
      city: "",
      postalCode: "",
      isDefault: addresses.length === 0,
    });
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setIsAddingNew(false);
    resetAddress({
      label: addr.label || "Home",
      street: addr.street || "",
      barangay: addr.barangay || "",
      city: addr.city || "",
      postalCode: addr.postalCode || "",
      isDefault: addr.isDefault || false,
    });
  };

  const cancelAddressForm = () => {
    setIsAddingNew(false);
    setEditingAddressId(null);
  };

  const handleSaveNewAddress = async (data) => {
    const res = await dispatch(addAddress(data));
    if (!res) return;

    toast.success("Delivery address saved!");
    const saved = typeof res === "object" ? res : null;
    const newId = saved?._id || null;

    if (newId) setExplicitAddressId(newId);
    setValue("address", saved?.street || data.street);
    setValue("barangay", saved?.barangay || data.barangay);
    setValue("city", saved?.city || data.city);
    setValue("postalCode", saved?.postalCode || data.postalCode);
    clearErrors(["address", "barangay", "city", "postalCode"]);

    setIsAddingNew(false);
    setEditingAddressId(null);
  };

  const handleUpdateAddress = async (data) => {
    const res = await dispatch(updateAddress(editingAddressId, data));
    if (!res) return;

    toast.success("Address updated successfully!");
    if (selectedAddressId === editingAddressId) {
      setValue("address", data.street);
      setValue("barangay", data.barangay);
      setValue("city", data.city);
      setValue("postalCode", data.postalCode);
      clearErrors(["address", "barangay", "city", "postalCode"]);
    }
    setIsAddingNew(false);
    setEditingAddressId(null);
  };

  // Calculations
  const partsTotal = selectedParts.reduce(
    (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
    0
  );
  const motoCashTotal = selectedMotorcycles
    .filter((m) => m.purchaseMethod !== "installment")
    .reduce((sum, m) => sum + (m.price || 0), 0);
  const installmentDownpayments = selectedMotorcycles
    .filter((m) => m.purchaseMethod === "installment")
    .reduce((sum, m) => sum + Math.round(m.price * 0.2) + 1500, 0);

  const shippingFee =
    hasParts && form.partsFulfillmentMethod === "delivery" ? 350 : 0;
  const grandTotal =
    partsTotal + motoCashTotal + installmentDownpayments + shippingFee;

  const handleContinue = async (data) => {
    const payload = {
      ...data,
      fulfillmentMethod: hasMotorcycles
        ? "pickup"
        : data.partsFulfillmentMethod,
    };

    // If adding a new address (or none saved yet), validate and save it first
    if (
      hasParts &&
      data.partsFulfillmentMethod === "delivery" &&
      (isAddingNew || addresses.length === 0)
    ) {
      const addressValid = await triggerAddress();
      if (!addressValid) {
        toast.error("Please fill in all required delivery address fields.");
        return;
      }

      const addressDraft = shippingAddressSchema.cast(addressForm);
      const res = await dispatch(addAddress(addressDraft));
      if (!res) {
        toast.error("Failed to save delivery address.");
        return;
      }

      const saved = typeof res === "object" ? res : null;
      payload.address = saved?.street || addressDraft.street;
      payload.barangay = saved?.barangay || addressDraft.barangay;
      payload.city = saved?.city || addressDraft.city;
      payload.postalCode = saved?.postalCode || addressDraft.postalCode;

      if (saved?._id) setExplicitAddressId(saved._id);
      setIsAddingNew(false);
      setEditingAddressId(null);
    }

    dispatch(saveShippingInfo(payload));
    navigate("/checkout/confirm");
  };

  if (selectedItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-zinc-50 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Your Checkout is Empty</h2>
          <p className="text-sm text-zinc-500">
            You don't have any items selected for checkout. Return to your shopping cart to select products.
          </p>
          <Link
            to="/cart"
            className="inline-block w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Progress Stepper Bar */}
        <CheckoutStepper activeStep={1} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (7 cols) */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit(handleContinue, () =>
                toast.error("Please fill in all required fields before proceeding."),
              )}
              className="bg-white border border-zinc-200 rounded-xl shadow-xs divide-y divide-zinc-100 overflow-hidden"
              noValidate
            >
              {/* Header */}
              <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                  Fulfillment & Contact Details
                </h1>
                <p className="text-xs text-zinc-500 mt-1">
                  Please provide your contact details and specify your delivery or showroom pickup preference.
                </p>
              </div>

              {/* Section 1: Customer Contact */}
              <div className="p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  1. Contact Information
                </h2>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Juan Dela Cruz"
                    {...register("recipientName")}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                      errors.recipientName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                    }`}
                  />
                  {errors.recipientName && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.recipientName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="09171234567"
                      {...register("contactNumber")}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                        errors.contactNumber
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                      }`}
                    />
                    {errors.contactNumber && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.contactNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="juan@example.com"
                      {...register("email")}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                        errors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Fulfillment & Logistics */}
              <div className="p-6 space-y-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  2. Fulfillment Preference
                </h2>

                {/* Showroom Pickup for Motorcycles */}
                {hasMotorcycles && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-900">
                        Motorcycle Releasing Showroom
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Includes PDI & LTO Registration
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Motorcycles must be claimed in person for Pre-Delivery Safety Inspection (PDI) and owner registration turnover.
                    </p>

                    <div className="space-y-2">
                      {BRANCHES.map((b) => (
                        <label
                          key={b.id}
                          className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
                            form.branch === b.name
                              ? "border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <input
                            type="radio"
                            value={b.name}
                            {...register("branch")}
                            className="mt-1 accent-zinc-900 cursor-pointer"
                          />
                          <div className="flex-1 text-xs">
                            <span className="font-semibold text-zinc-900 block">{b.name}</span>
                            <span className="text-zinc-500 block mt-0.5">{b.address}</span>
                            <span className="text-zinc-400 block mt-0.5 text-[11px]">
                              {b.hours} • Tel: {b.phone}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parts Delivery Options */}
                {hasParts && (
                  <div className="space-y-4 pt-2">
                    <span className="text-xs font-medium text-zinc-900 block">
                      Parts & Accessories Delivery Method
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
                          form.partsFulfillmentMethod === "delivery"
                            ? "border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          value="delivery"
                          {...register("partsFulfillmentMethod")}
                          className="mt-1 accent-zinc-900 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-zinc-900 block">Courier Delivery</span>
                          <span className="text-zinc-500 block mt-0.5">Door-to-door (₱350 fee)</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
                          form.partsFulfillmentMethod === "pickup"
                            ? "border-zinc-900 bg-zinc-50/80 ring-1 ring-zinc-900"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          value="pickup"
                          {...register("partsFulfillmentMethod")}
                          className="mt-1 accent-zinc-900 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-zinc-900 block">Showroom Pickup</span>
                          <span className="text-zinc-500 block mt-0.5">Collect at counter (Free)</span>
                        </div>
                      </label>
                    </div>

                    {/* Address Fields for Delivery */}
                    {form.partsFulfillmentMethod === "delivery" && (
                      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-4 mt-3">
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                          <div>
                            <span className="text-xs font-bold text-zinc-900 block">
                              Delivery Address
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {editingAddressId
                                ? "Modify the selected address details below."
                                : isAddingNew || addresses.length === 0
                                ? "Enter address details below to save and use for this order."
                                : "Select a delivery destination from your saved address book."}
                            </span>
                          </div>

                          {!editingAddressId && !isAddingNew && addresses.length > 0 && (
                            <button
                              type="button"
                              onClick={startAddAddress}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                              Add New Address
                            </button>
                          )}
                        </div>

                        {/* Loading State */}
                        {addressesLoading && (
                          <div className="p-4 border border-zinc-200 bg-white rounded-lg text-center text-xs text-zinc-500 animate-pulse">
                            Loading saved addresses...
                          </div>
                        )}

                        {/* Mode 1: Select saved addresses */}
                        {!addressesLoading && !editingAddressId && !isAddingNew && addresses.length > 0 && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {addresses.map((addr) => {
                                const isSelected =
                                  selectedAddressId === addr._id ||
                                  (form.address &&
                                    form.address.trim().toLowerCase() === addr.street?.trim().toLowerCase() &&
                                    form.city &&
                                    form.city.trim().toLowerCase() === addr.city?.trim().toLowerCase());

                                return (
                                  <div
                                    key={addr._id}
                                    onClick={() => selectAddress(addr)}
                                    className={`relative p-3.5 border rounded-lg cursor-pointer transition-all text-xs flex flex-col justify-between ${
                                      isSelected
                                        ? "border-emerald-600 bg-emerald-50/25 ring-1 ring-emerald-600 shadow-xs"
                                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name="selectedAddressCard"
                                            checked={Boolean(isSelected)}
                                            onChange={() => selectAddress(addr)}
                                            className="accent-emerald-600 cursor-pointer"
                                          />
                                          <span className="font-bold text-zinc-900 uppercase text-[11px] tracking-wide">
                                            {addr.label || "Address"}
                                          </span>
                                        </div>
                                        {addr.isDefault && (
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                                            DEFAULT
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-zinc-800 font-medium leading-snug pl-5">
                                        {addr.street}
                                      </p>
                                      <p className="text-zinc-500 text-[11px] mt-0.5 pl-5">
                                        {addr.barangay}, {addr.city} {addr.postalCode}
                                      </p>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between pl-5">
                                      <span className="text-[11px] text-zinc-400">
                                        {isSelected ? "Delivering here" : "Click to select"}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        {!addr.isDefault && (
                                          <button
                                            type="button"
                                            onClick={(e) => handleSetDefaultAddress(e, addr._id)}
                                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                                          >
                                            Set as default
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditAddress(addr);
                                          }}
                                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 hover:underline cursor-pointer"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                          </svg>
                                          Edit
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {errors.address && (
                              <p className="text-[11px] text-red-600">{errors.address.message}</p>
                            )}
                          </div>
                        )}

                        {/* Mode 2: Add New Address */}
                        {!addressesLoading && !editingAddressId && (isAddingNew || addresses.length === 0) && (
                          <div className="p-4 bg-white border border-zinc-200 rounded-lg space-y-3.5 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                              <span className="font-bold text-zinc-900 uppercase tracking-wide text-[11px]">
                                {addresses.length === 0 ? "Add Delivery Address" : "New Delivery Address"}
                              </span>
                              {addresses.length > 0 && (
                                <button
                                  type="button"
                                  onClick={cancelAddressForm}
                                  className="text-zinc-500 hover:text-zinc-800 font-medium cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>

                            {addresses.length === 0 && (
                              <p className="text-zinc-500 text-[11px] bg-zinc-50 p-2.5 rounded border border-zinc-200">
                                No delivery address on file. Please enter your address below — it will be saved to your address book and used for this shipment.
                              </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Address Label
                                </label>
                                <select
                                  {...registerAddress("label")}
                                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
                                >
                                  <option value="Home">Home</option>
                                  <option value="Work">Work / Office</option>
                                  <option value="Warehouse">Warehouse</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Street Address / House or Unit No. <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("street")}
                                  placeholder="Block 03 Lot 18, Palayan Village"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.street ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.street && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.street.message}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Barangay <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("barangay")}
                                  placeholder="e.g. Bagumbayan"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.barangay ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.barangay && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.barangay.message}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  City / Municipality <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("city")}
                                  placeholder="e.g. Taguig City"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.city ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.city && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.city.message}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Postal Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("postalCode")}
                                  placeholder="1630"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.postalCode ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.postalCode && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.postalCode.message}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  {...registerAddress("isDefault")}
                                  className="accent-emerald-600 rounded"
                                />
                                <span className="text-[11px] text-zinc-600">Save as default delivery address</span>
                              </label>

                              <div className="flex items-center gap-2">
                                {addresses.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={cancelAddressForm}
                                    className="px-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium text-xs cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={addressesUpdating}
                                  onClick={handleSubmitAddress(handleSaveNewAddress)}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {addressesUpdating && (
                                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                  )}
                                  Save & Use Address
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mode 3: Edit Existing Address */}
                        {!addressesLoading && Boolean(editingAddressId) && (
                          <div className="p-4 bg-white border border-emerald-600/40 rounded-lg space-y-3.5 text-xs ring-1 ring-emerald-600/20">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                <span className="font-bold text-zinc-900 uppercase tracking-wide text-[11px]">
                                  Edit Delivery Address
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={cancelAddressForm}
                                className="text-zinc-500 hover:text-zinc-800 font-medium cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Address Label
                                </label>
                                <select
                                  {...registerAddress("label")}
                                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
                                >
                                  <option value="Home">Home</option>
                                  <option value="Work">Work / Office</option>
                                  <option value="Warehouse">Warehouse</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Street Address / House or Unit No. <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("street")}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.street ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.street && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.street.message}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Barangay <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("barangay")}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.barangay ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.barangay && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.barangay.message}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  City / Municipality <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("city")}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.city ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.city && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.city.message}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Postal Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  {...registerAddress("postalCode")}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.postalCode ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.postalCode && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.postalCode.message}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={cancelAddressForm}
                                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={addressesUpdating}
                                onClick={handleSubmitAddress(handleUpdateAddress)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {addressesUpdating && (
                                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                  </svg>
                                )}
                                Save Changes
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Delivery Notes */}
                        <div className="pt-1">
                          <label className="block text-xs text-zinc-600 mb-1">
                            Delivery Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Landmark, gate access, or recipient instructions"
                            {...register("deliveryNotes")}
                            className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 3: Financing Verification (Only if installment motorcycle in cart) */}
              {hasInstallment && (
                <div className="p-6 space-y-4 bg-amber-50/40">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      3. Financing Pre-Qualification Details
                    </h2>
                    <span className="text-[11px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                      In-House Loan Requirement
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Government ID Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("governmentIdType")}
                        className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
                      >
                        {GOV_IDS.map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        ID Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. N01-12-345678"
                        {...register("governmentIdNumber")}
                        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                          errors.governmentIdNumber ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                        }`}
                      />
                      {errors.governmentIdNumber && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.governmentIdNumber.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Employer or Registered Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Company or Business Name"
                        {...register("employerName")}
                        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                          errors.employerName ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                        }`}
                      />
                      {errors.employerName && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.employerName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Approximate Monthly Income (₱) <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register("monthlyIncome")}
                        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                          errors.monthlyIncome ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                        }`}
                      >
                        <option value="">Select income range</option>
                        {MONTHLY_INCOME_RANGES.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                      {errors.monthlyIncome && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.monthlyIncome.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button & Back Action */}
              <div className="p-6 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Link
                  to="/cart"
                  className="w-full sm:w-auto px-4 py-2.5 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Cart
                </Link>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                >
                  Continue to Payment & Review →
                </button>
              </div>
            </form>
          </div>

          {/* Sticky Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sticky top-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-bold text-sm text-zinc-900">
                  Order Summary ({selectedItems.length} {selectedItems.length === 1 ? "item" : "items"})
                </h3>
                <Link to="/cart" className="text-xs text-emerald-700 hover:underline font-semibold">
                  Edit Cart
                </Link>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <div key={item.cartItemId || item.productId} className="py-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <ProductImagePlaceholder
                          name={item.name}
                          category={item.isVehicle ? "motorcycle" : "parts"}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {item.isVehicle
                          ? item.purchaseMethod === "installment"
                            ? `${item.termMonths || 12}-Mo Financing`
                            : "Full Cash SRP"
                          : `Qty: ${item.quantity}`}
                      </p>
                    </div>

                    <span className="text-xs font-mono font-semibold text-zinc-900 shrink-0">
                      {fmt(item.price * (item.isVehicle ? 1 : item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-zinc-100 pt-3 space-y-2 text-xs">
                {partsTotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Parts & Accessories Subtotal</span>
                    <span className="font-mono text-zinc-900">{fmt(partsTotal)}</span>
                  </div>
                )}

                {motoCashTotal > 0 && (
                  <div className="flex justify-between text-zinc-600">
                    <span>Motorcycle Cash Subtotal</span>
                    <span className="font-mono text-zinc-900">{fmt(motoCashTotal)}</span>
                  </div>
                )}

                {installmentDownpayments > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>Financing Downpayment Due</span>
                    <span className="font-mono">{fmt(installmentDownpayments)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-600">
                  <span>Logistics & Freight</span>
                  <span className="font-mono text-zinc-900">
                    {shippingFee > 0 ? fmt(shippingFee) : "Free (Pickup)"}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2 border-t border-zinc-100">
                  <span>Total Due</span>
                  <span className="font-mono text-emerald-700">{fmt(grandTotal)}</span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Official Dealership Sales Invoice & Receipts</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Pre-Delivery Safety Inspection (PDI) Certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
