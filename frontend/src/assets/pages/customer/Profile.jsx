import { useState } from "react";
import { ScrollReveal } from "../../components/ScrollReveal";
import { Link } from "react-router-dom";
export const Profile = ({ activeTab = "all", onTabChange }) => {
  const [profileData, setProfileData] = useState({
    name: "Juan Dela Cruz",
    email: "juan.delacruz@example.com",
    contactNumber: "0917 123 4567",
    street: "Block 14 Lot 8 Emerald Avenue",
    city: "Pasig City",
    postalCode: "1600",
    country: "Philippines",
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePhotoUrl(url);
      setSaveNotice("Profile picture updated successfully.");
      setTimeout(() => setSaveNotice(""), 2500);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsEditingAddress(false);
    setSaveNotice("Profile and address updated successfully.");
    setTimeout(() => setSaveNotice(""), 2500);
  };

  const currentTab = activeTab || "all";

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Customer Profile & Screening
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-xl">
              Manage personal credentials, registered delivery destination, and
              installment credit review records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveNotice && (
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">
                ✓ {saveNotice}
              </span>
            )}

            {/* Sub-tab Switcher: Profile vs Address vs Verification */}
            <div className="flex items-center gap-1 border border-zinc-200 p-0.5 rounded bg-zinc-50 text-xs font-medium">
              <Link
                to="/profile"
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  currentTab === "all"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                All
              </Link>
              <Link
                to="/profile/personal-info"
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  currentTab === "profile"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Personal Profile
              </Link>
              <Link
                to="/profile/address"
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  currentTab === "address"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Delivery Addresses
              </Link>
              <Link
                to="/profile/verification"
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  currentTab === "verification"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Credit Verification
              </Link>
            </div>
          </div>
        </div>

        {/* Section 1: Customer Information - 2-Column Unboxed Settings Layout */}
        {(currentTab === "all" || currentTab === "profile") && (
          <ScrollReveal threshold={0.08} duration={600}>
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-zinc-200">
              <div className="md:col-span-4 space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Personal Information
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Primary account credentials and registered mobile contact used
                  for courier verification and dispatch.
                </p>
                <div className="pt-2">
                  <span className="inline-block text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Verified Customer
                  </span>
                </div>
              </div>

              <div className="md:col-span-8 space-y-6">
                {/* Profile Picture Upload & Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-zinc-200">
                  <div className="relative shrink-0 inline-block">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-lg ring-2 ring-zinc-200 overflow-hidden shadow-2xs">
                      {profilePhotoUrl ? (
                        <img
                          src={profilePhotoUrl}
                          alt="Juan Dela Cruz"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="tracking-tighter">JD</span>
                      )}
                    </div>
                    {/* Active indicator dot placed cleanly outside circular boundary, uncropped */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 ring-2 ring-white shadow-xs z-10 pointer-events-none"
                      title="Active Customer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 transition-colors shadow-2xs">
                        <svg
                          className="w-3.5 h-3.5 text-zinc-500"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>Upload new picture</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoChange}
                          className="hidden"
                        />
                      </label>

                      {profilePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhotoUrl(null);
                            setSaveNotice("Profile picture removed.");
                            setTimeout(() => setSaveNotice(""), 2500);
                          }}
                          className="px-2.5 py-1.5 rounded-md text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      JPG, PNG, or WebP. Displayed on official dealership quotes
                      and service logs.
                    </p>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="!h-9 w-full px-3 text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      readOnly
                      className="!h-9 w-full px-3 text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md cursor-not-allowed"
                    />
                    <span className="block text-[10px] text-zinc-400 mt-1">
                      Unique account identifier
                    </span>
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Mobile Contact Number
                    </label>
                    <input
                      type="text"
                      value={profileData.contactNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          contactNumber: e.target.value,
                        })
                      }
                      className="!h-9 w-full px-3 text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      System Account Role
                    </label>
                    <input
                      type="text"
                      value="Customer / Verified Rider"
                      readOnly
                      className="!h-9 w-full px-3 text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Section 2: Registered Delivery Address - 2-Column Unboxed Settings Layout */}
        {(currentTab === "all" || currentTab === "address") && (
          <ScrollReveal threshold={0.08} delay={50} duration={600}>
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-zinc-200">
              <div className="md:col-span-4 space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Default Delivery Address
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Designated residential or garage address for direct motorcycle
                  releasing and parts fulfillment.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    {isEditingAddress
                      ? "← Cancel Editing"
                      : "Modify Registered Address"}
                  </button>
                </div>
              </div>

              <div className="md:col-span-8">
                {isEditingAddress ? (
                  <form
                    onSubmit={handleSaveProfile}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">
                        House / Unit #, Street
                      </label>
                      <input
                        type="text"
                        value={profileData.street}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            street: e.target.value,
                          })
                        }
                        className="!h-9 w-full px-3 text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-zinc-700 font-semibold mb-1">
                          City / Municipality
                        </label>
                        <input
                          type="text"
                          value={profileData.city}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              city: e.target.value,
                            })
                          }
                          className="!h-9 w-full px-3 text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-700 font-semibold mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={profileData.postalCode}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              postalCode: e.target.value,
                            })
                          }
                          className="!h-9 w-full px-3 text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={profileData.country}
                        readOnly
                        className="!h-9 w-full px-3 text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md cursor-not-allowed"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-3 py-1.5 rounded border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200 bg-zinc-50/50 text-xs">
                    <div className="py-2.5 px-4 flex justify-between">
                      <span className="text-zinc-500">Street / Unit:</span>
                      <span className="font-semibold text-zinc-900">
                        {profileData.street}
                      </span>
                    </div>
                    <div className="py-2.5 px-4 flex justify-between">
                      <span className="text-zinc-500">
                        City / Municipality:
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {profileData.city}
                      </span>
                    </div>
                    <div className="py-2.5 px-4 flex justify-between">
                      <span className="text-zinc-500">Postal Code:</span>
                      <span className="font-mono text-zinc-900">
                        {profileData.postalCode}
                      </span>
                    </div>
                    <div className="py-2.5 px-4 flex justify-between">
                      <span className="text-zinc-500">Country:</span>
                      <span className="text-zinc-800">
                        {profileData.country}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Section 3: Installment Verification Documents - 2-Column Unboxed Settings Layout */}
        {(currentTab === "all" || currentTab === "verification") && (
          <ScrollReveal threshold={0.08} delay={70} duration={600}>
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10">
              <div className="md:col-span-4 space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Credit Verification Records
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Official identification and income screening documents
                  submitted for digital installment eligibility.
                </p>
                <div className="pt-2">
                  <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Financing Pre-Approved
                  </span>
                </div>
              </div>

              <div className="md:col-span-8 space-y-3">
                <div className="border border-zinc-200 rounded-md divide-y divide-zinc-200 bg-white">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-900">
                          Valid Primary Government ID
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Philippine Passport (Exp: 2031) — Encrypted File Storage
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">
                      ID-2026-PH
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-900">
                          Proof of Income & Employment
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Certificate of Employment & 3-Month Payslip Records
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 font-mono">
                      INC-REVIEW-OK
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 pt-1">
                  To update expired documentation or change employment status,
                  consult with your Motorcycled credit officer during the next
                  contract renewal.
                </p>
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>
    </div>
  );
};
