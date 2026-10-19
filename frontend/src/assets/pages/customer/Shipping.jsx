import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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

  // Form state — focused & streamlined
  const [form, setForm] = useState(() => ({
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
    monthlyIncome: shippingInfo?.monthlyIncome || "",
  }));

  const [errors, setErrors] = useState({});

  // Address selection & inline management state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const userSelectedAddressRef = useRef(false);

  const [addressForm, setAddressForm] = useState({
    label: "Home",
    street: "",
    barangay: "",
    city: "",
    postalCode: "",
    isDefault: false,
  });
  const [addressFormErrors, setAddressFormErrors] = useState({});

  // Fetch saved user addresses on mount
  useEffect(() => {
    if (user) {
      dispatch(getAddresses());
    }
  }, [dispatch, user]);

  // Synchronize saved addresses with form and selection
  useEffect(() => {
    if (!addresses || addresses.length === 0) return;

    // If the customer explicitly selected an address during this checkout session, preserve that selection
    if (userSelectedAddressRef.current && selectedAddressId) {
      const currentSelected = addresses.find((a) => a._id === selectedAddressId);
      if (currentSelected) {
        setForm((prev) => ({
          ...prev,
          address: currentSelected.street || "",
          barangay: currentSelected.barangay || "",
          city: currentSelected.city || "",
          postalCode: currentSelected.postalCode || "",
        }));
        return;
      }
    }

    // Always prioritize the user's active DEFAULT address (or first address if none marked default)
    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr._id);
      setForm((prev) => ({
        ...prev,
        address: defaultAddr.street || "",
        barangay: defaultAddr.barangay || "",
        city: defaultAddr.city || "",
        postalCode: defaultAddr.postalCode || "",
      }));
    }
  }, [addresses]);

  const selectAddress = (addr) => {
    userSelectedAddressRef.current = true;
    setSelectedAddressId(addr._id);
    setForm((prev) => ({
      ...prev,
      address: addr.street || "",
      barangay: addr.barangay || "",
      city: addr.city || "",
      postalCode: addr.postalCode || "",
    }));
    setErrors((prev) => ({
      ...prev,
      address: "",
      barangay: "",
      city: "",
      postalCode: "",
    }));
    setIsAddingNew(false);
    setEditingAddressId(null);
  };

  const handleSetDefaultAddress = async (e, addressId) => {
    e.stopPropagation();
    const success = await dispatch(setDefaultAddress(addressId));
    if (success) {
      userSelectedAddressRef.current = false;
      toast.success("Default address updated!");
    }
  };

  const startAddAddress = () => {
    setIsAddingNew(true);
    setEditingAddressId(null);
    setAddressForm({
      label: "Home",
      street: "",
      barangay: "",
      city: "",
      postalCode: "",
      isDefault: addresses.length === 0,
    });
    setAddressFormErrors({});
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setIsAddingNew(false);
    setAddressForm({
      label: addr.label || "Home",
      street: addr.street || "",
      barangay: addr.barangay || "",
      city: addr.city || "",
      postalCode: addr.postalCode || "",
      isDefault: addr.isDefault || false,
    });
    setAddressFormErrors({});
  };

  const cancelAddressForm = () => {
    setIsAddingNew(false);
    setEditingAddressId(null);
    setAddressFormErrors({});
  };

  const handleSaveNewAddress = async (e) => {
    if (e) e.preventDefault();
    const errs = {};
    if (!addressForm.street.trim()) errs.street = "Street address is required";
    if (!addressForm.barangay.trim()) errs.barangay = "Barangay is required";
    if (!addressForm.city.trim()) errs.city = "City / Municipality is required";
    if (!addressForm.postalCode.trim()) errs.postalCode = "Postal code is required";

    if (Object.keys(errs).length > 0) {
      setAddressFormErrors(errs);
      return;
    }

    const res = await dispatch(addAddress(addressForm));
    if (res) {
      toast.success("Delivery address saved!");
      const saved = typeof res === "object" ? res : null;
      const newStreet = saved?.street || addressForm.street;
      const newBarangay = saved?.barangay || addressForm.barangay;
      const newCity = saved?.city || addressForm.city;
      const newPostalCode = saved?.postalCode || addressForm.postalCode;
      const newId = saved?._id || null;

      if (newId) setSelectedAddressId(newId);
      setForm((prev) => ({
        ...prev,
        address: newStreet,
        barangay: newBarangay,
        city: newCity,
        postalCode: newPostalCode,
      }));
      setErrors((prev) => ({
        ...prev,
        address: "",
        barangay: "",
        city: "",
        postalCode: "",
      }));

      setIsAddingNew(false);
      setEditingAddressId(null);
      setAddressFormErrors({});
    }
  };

  const handleUpdateAddress = async (e) => {
    if (e) e.preventDefault();
    const errs = {};
    if (!addressForm.street.trim()) errs.street = "Street address is required";
    if (!addressForm.barangay.trim()) errs.barangay = "Barangay is required";
    if (!addressForm.city.trim()) errs.city = "City / Municipality is required";
    if (!addressForm.postalCode.trim()) errs.postalCode = "Postal code is required";

    if (Object.keys(errs).length > 0) {
      setAddressFormErrors(errs);
      return;
    }

    const res = await dispatch(updateAddress(editingAddressId, addressForm));
    if (res) {
      toast.success("Address updated successfully!");
      if (selectedAddressId === editingAddressId) {
        setForm((prev) => ({
          ...prev,
          address: addressForm.street,
          barangay: addressForm.barangay,
          city: addressForm.city,
          postalCode: addressForm.postalCode,
        }));
      }
      setIsAddingNew(false);
      setEditingAddressId(null);
      setAddressFormErrors({});
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

  const validate = () => {
    const errs = {};
    if (!form.recipientName.trim()) {
      errs.recipientName = "Full name is required";
    }
    if (!form.contactNumber.trim()) {
      errs.contactNumber = "Mobile number is required";
    } else if (!/^09\d{9}$/.test(form.contactNumber.replace(/[\s-]/g, ""))) {
      errs.contactNumber = "Enter a valid 11-digit mobile number (e.g. 09171234567)";
    }
    if (!form.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Enter a valid email address";
    }

    if (hasMotorcycles || form.partsFulfillmentMethod === "pickup") {
      if (!form.branch) {
        errs.branch = "Please select an authorized showroom";
      }
    }

    if (hasParts && form.partsFulfillmentMethod === "delivery") {
      if (!form.address.trim()) errs.address = "Street address is required";
      if (!form.barangay.trim()) errs.barangay = "Barangay is required";
      if (!form.city.trim()) errs.city = "City / Municipality is required";
      if (!form.postalCode.trim()) errs.postalCode = "Postal code is required";
    }

    if (hasInstallment) {
      if (!form.governmentIdNumber.trim()) {
        errs.governmentIdNumber = "Valid ID number is required for credit evaluation";
      }
      if (!form.employerName.trim()) {
        errs.employerName = "Employer or business name is required";
      }
      if (!form.monthlyIncome.trim()) {
        errs.monthlyIncome = "Approximate monthly income is required";
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let currentForm = { ...form };

    // If currently in add mode with address fields filled, auto-save before proceeding
    if (
      hasParts &&
      form.partsFulfillmentMethod === "delivery" &&
      (isAddingNew || addresses.length === 0) &&
      addressForm.street.trim() &&
      addressForm.city.trim()
    ) {
      const addrErrs = {};
      if (!addressForm.street.trim()) addrErrs.street = "Street address is required";
      if (!addressForm.barangay.trim()) addrErrs.barangay = "Barangay is required";
      if (!addressForm.city.trim()) addrErrs.city = "City / Municipality is required";
      if (!addressForm.postalCode.trim()) addrErrs.postalCode = "Postal code is required";

      if (Object.keys(addrErrs).length > 0) {
        setAddressFormErrors(addrErrs);
        toast.error("Please fill in all required delivery address fields.");
        return;
      }

      const res = await dispatch(addAddress(addressForm));
      if (!res) {
        toast.error("Failed to save delivery address.");
        return;
      }
      const saved = typeof res === "object" ? res : null;
      const newStreet = saved?.street || addressForm.street;
      const newBarangay = saved?.barangay || addressForm.barangay;
      const newCity = saved?.city || addressForm.city;
      const newPostalCode = saved?.postalCode || addressForm.postalCode;

      currentForm.address = newStreet;
      currentForm.barangay = newBarangay;
      currentForm.city = newCity;
      currentForm.postalCode = newPostalCode;

      setForm((prev) => ({
        ...prev,
        address: newStreet,
        barangay: newBarangay,
        city: newCity,
        postalCode: newPostalCode,
      }));
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fill in all required fields before proceeding.");
      return;
    }

    const payload = {
      ...currentForm,
      fulfillmentMethod: hasMotorcycles ? "pickup" : currentForm.partsFulfillmentMethod,
    };

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
            <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-xl shadow-xs divide-y divide-zinc-100 overflow-hidden">
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
                    value={form.recipientName}
                    onChange={(e) => handleChange("recipientName", e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                      errors.recipientName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                    }`}
                  />
                  {errors.recipientName && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.recipientName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.contactNumber}
                      onChange={(e) => handleChange("contactNumber", e.target.value)}
                      placeholder="0917 123 4567"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                        errors.contactNumber
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                      }`}
                    />
                    {errors.contactNumber && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="juan@example.com"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                        errors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>
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
                            name="branch"
                            checked={form.branch === b.name}
                            onChange={() => handleChange("branch", b.name)}
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
                          name="partsFulfillmentMethod"
                          checked={form.partsFulfillmentMethod === "delivery"}
                          onChange={() => handleChange("partsFulfillmentMethod", "delivery")}
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
                          name="partsFulfillmentMethod"
                          checked={form.partsFulfillmentMethod === "pickup"}
                          onChange={() => handleChange("partsFulfillmentMethod", "pickup")}
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
                              <p className="text-[11px] text-red-600">{errors.address}</p>
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
                                  value={addressForm.label}
                                  onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
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
                                  value={addressForm.street}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, street: e.target.value }));
                                    if (addressFormErrors.street) {
                                      setAddressFormErrors((prev) => ({ ...prev, street: "" }));
                                    }
                                  }}
                                  placeholder="Block 03 Lot 18, Palayan Village"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.street ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.street && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.street}</p>
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
                                  value={addressForm.barangay}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, barangay: e.target.value }));
                                    if (addressFormErrors.barangay) {
                                      setAddressFormErrors((prev) => ({ ...prev, barangay: "" }));
                                    }
                                  }}
                                  placeholder="e.g. Bagumbayan"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.barangay ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.barangay && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.barangay}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  City / Municipality <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={addressForm.city}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, city: e.target.value }));
                                    if (addressFormErrors.city) {
                                      setAddressFormErrors((prev) => ({ ...prev, city: "" }));
                                    }
                                  }}
                                  placeholder="e.g. Taguig City"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.city ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.city && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.city}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Postal Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={addressForm.postalCode}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }));
                                    if (addressFormErrors.postalCode) {
                                      setAddressFormErrors((prev) => ({ ...prev, postalCode: "" }));
                                    }
                                  }}
                                  placeholder="1630"
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.postalCode ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.postalCode && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.postalCode}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={addressForm.isDefault}
                                  onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
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
                                  onClick={handleSaveNewAddress}
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
                                  value={addressForm.label}
                                  onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
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
                                  value={addressForm.street}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, street: e.target.value }));
                                    if (addressFormErrors.street) {
                                      setAddressFormErrors((prev) => ({ ...prev, street: "" }));
                                    }
                                  }}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.street ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.street && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.street}</p>
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
                                  value={addressForm.barangay}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, barangay: e.target.value }));
                                    if (addressFormErrors.barangay) {
                                      setAddressFormErrors((prev) => ({ ...prev, barangay: "" }));
                                    }
                                  }}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.barangay ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.barangay && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.barangay}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  City / Municipality <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={addressForm.city}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, city: e.target.value }));
                                    if (addressFormErrors.city) {
                                      setAddressFormErrors((prev) => ({ ...prev, city: "" }));
                                    }
                                  }}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.city ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.city && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.city}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-zinc-600 font-medium mb-1">
                                  Postal Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={addressForm.postalCode}
                                  onChange={(e) => {
                                    setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }));
                                    if (addressFormErrors.postalCode) {
                                      setAddressFormErrors((prev) => ({ ...prev, postalCode: "" }));
                                    }
                                  }}
                                  className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none ${
                                    addressFormErrors.postalCode ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                                  }`}
                                />
                                {addressFormErrors.postalCode && (
                                  <p className="text-[11px] text-red-600 mt-1">{addressFormErrors.postalCode}</p>
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
                                onClick={handleUpdateAddress}
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
                            value={form.deliveryNotes}
                            onChange={(e) => handleChange("deliveryNotes", e.target.value)}
                            placeholder="Landmark, gate access, or recipient instructions"
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
                        value={form.governmentIdType}
                        onChange={(e) => handleChange("governmentIdType", e.target.value)}
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
                        value={form.governmentIdNumber}
                        onChange={(e) => handleChange("governmentIdNumber", e.target.value)}
                        placeholder="e.g. N01-12-345678"
                        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                          errors.governmentIdNumber ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                        }`}
                      />
                      {errors.governmentIdNumber && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.governmentIdNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Employer or Registered Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.employerName}
                        onChange={(e) => handleChange("employerName", e.target.value)}
                        placeholder="Company or Business Name"
                        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                          errors.employerName ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                        }`}
                      />
                      {errors.employerName && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.employerName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Approximate Monthly Income (₱) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.monthlyIncome}
                        onChange={(e) => handleChange("monthlyIncome", e.target.value)}
                        placeholder="e.g. 45,000"
                        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-1 ${
                          errors.monthlyIncome ? "border-red-500" : "border-zinc-300 focus:border-zinc-900"
                        }`}
                      />
                      {errors.monthlyIncome && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.monthlyIncome}</p>
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
