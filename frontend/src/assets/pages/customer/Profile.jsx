import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ScrollReveal } from "../../components/ScrollReveal";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as yup from "yup";
import axios from "axios";
import {
  profileAddressSchema,
  profileInfoSchema,
} from "../../schema/profileSchema.js";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  getProfile,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} from "../../../actions/profileActions";

const API = import.meta.env.VITE_API;

export const Profile = ({ activeTab = "all" }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const {
    profile,
    addresses,
    loading: profileLoading,
    updating,
    addressesUpdating,
  } = useSelector((state) => state.profile);
  const dispatch = useDispatch();

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [creditVerification, setCreditVerification] = useState(null);
  const [creditFiles, setCreditFiles] = useState({
    governmentId: null,
    proofOfIncome: null,
  });
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const persistedProfilePhoto =
    profile?.profilePicture || user?.profilePicture || null;
  const displayedProfilePhoto =
    profilePhotoUrl === "" ? null : profilePhotoUrl || persistedProfilePhoto;

  const changePasswordSchema = yup.object({
    oldPassword: yup.string().required("Current password is required"),
    newPassword: yup
      .string()
      .min(8, "Must be at least 8 characters")
      .required("New password is required"),
    confirmNewPassword: yup
      .string()
      .oneOf([yup.ref("newPassword")], "Passwords must match")
      .required("Confirm your new password"),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(changePasswordSchema),
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(profileInfoSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      contactNumber: user?.contactNumber || "",
    },
  });

  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddress,
    formState: { errors: addressErrors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(profileAddressSchema),
    defaultValues: {
      label: "",
      street: "",
      barangay: "",
      city: "",
      postalCode: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getProfile());
      dispatch(getAddresses());
      if (user?.role === "customer") {
        axios
          .get(`${API}/credit-verification/me`, { withCredentials: true })
          .then(({ data }) => setCreditVerification(data.verification))
          .catch((error) => {
            if (error?.response?.status === 404) {
              setCreditVerification(null);
              return;
            }
            if (error?.response?.status === 401) {
              toast.error("Your session has expired. Please sign in again.");
              return;
            }
            toast.error(
              error?.response?.data?.message ||
                "Unable to load credit verification status.",
            );
          });
      }
    }
  }, [dispatch, isAuthenticated, user?.role]);

  useEffect(() => {
    if (!profile || isEditingProfile) return;
    resetProfile({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      contactNumber: profile.contactNumber ?? "",
    });
  }, [profile, isEditingProfile, resetProfile]);

  const showNotice = (message) => {
    toast.success(message);
  };

  const beginAddressEdit = (address) => {
    setSelectedAddressId(address?._id ?? null);
    resetAddress({
      label: address?.label ?? "",
      street: address?.street ?? "",
      barangay: address?.barangay ?? "",
      city: address?.city ?? "",
      postalCode: address?.postalCode ?? "",
    });
    setIsEditingAddress(true);
  };

  const handleSaveProfile = async (data) => {
    const saved = await dispatch(
      updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
      }),
    );
    if (saved) {
      resetProfile(data);
      setIsEditingProfile(false);
      showNotice("Profile updated successfully.");
    } else {
      toast.error("Unable to update profile.");
    }
  };

  const handleSaveAddress = async (data) => {
    const saved = selectedAddressId
      ? await dispatch(updateAddress(selectedAddressId, data))
      : await dispatch(addAddress(data));
    if (saved) {
      setIsEditingAddress(false);
      setSelectedAddressId(null);
      showNotice("Address saved successfully.");
    } else {
      toast.error("Unable to save address.");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    const deleted = await dispatch(deleteAddress(id));
    if (deleted) {
      showNotice("Address deleted successfully.");
    } else {
      toast.error("Unable to delete address.");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    const updated = await dispatch(setDefaultAddress(id));
    if (updated) {
      showNotice("Default address updated.");
    } else {
      toast.error("Unable to update default address.");
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller.");
      e.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setProfilePhotoUrl(url);
    setPendingProfilePhoto(file);
  };

  const handleApplyProfilePhoto = async () => {
    if (!pendingProfilePhoto) return;

    const saved = await dispatch(
      updateProfile({ profilePicture: pendingProfilePhoto }),
    );
    if (saved) {
      setPendingProfilePhoto(null);
      showNotice("Profile picture updated successfully.");
    } else {
      toast.error("Unable to update profile picture.");
    }
  };

  const handleChangePassword = async (data) => {
    setChangingPassword(true);
    try {
      const res = await axios.put(
        `${API}/password/change`,
        {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
          confirmNewPassword: data.confirmNewPassword,
        },
        { withCredentials: true },
      );
      toast.success(res.data.message || "Password changed successfully");
      resetPassword();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCreditVerificationSubmit = async (event) => {
    event.preventDefault();
    if (!creditFiles.governmentId || !creditFiles.proofOfIncome) {
      toast.error("Select both a government ID and proof of income.");
      return;
    }

    setCreditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("governmentId", creditFiles.governmentId);
      formData.append("proofOfIncome", creditFiles.proofOfIncome);
      const { data } = await axios.post(`${API}/credit-verification`, formData, {
        withCredentials: true,
      });
      setCreditVerification(data.verification);
      setCreditFiles({ governmentId: null, proofOfIncome: null });
      toast.success("Credit verification submitted for admin review.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to submit credit verification.",
      );
    } finally {
      setCreditSubmitting(false);
    }
  };

  const currentTab = activeTab || "all";

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500">
          {loading || profileLoading
            ? "Loading profile..."
            : "Please log in to view your profile."}
        </p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <main
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10"
        style={{ display: "flex", flexDirection: "column" }}
      >
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

          <div className="flex items-center gap-3 shrink-0">
            {/* Sub-tab Switcher: Profile vs Address vs Verification */}
            <div className="flex items-center gap-1 border border-zinc-200 p-0.5 rounded-lg bg-zinc-50 text-xs font-medium max-w-full overflow-x-auto">
              <Link
                to="/profile"
                className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  currentTab === "all"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                All
              </Link>
              <Link
                to="/profile/personal-info"
                className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  currentTab === "profile"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Personal Profile
              </Link>
              <Link
                to="/profile/security"
                className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  currentTab === "security"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Security
              </Link>
              <Link
                to="/profile/address"
                className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  currentTab === "address"
                    ? "bg-white text-zinc-900 font-semibold shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Delivery Addresses
              </Link>
              <Link
                to="/profile/verification"
                className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
          <ScrollReveal threshold={0.08} duration={600} style={{ order: 1 }}>
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

              <form
                className="md:col-span-8 space-y-6"
                onSubmit={handleSubmitProfile(handleSaveProfile)}
                noValidate
              >
                {/* Profile Picture Upload & Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-zinc-200">
                  <div className="relative shrink-0 inline-block">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-lg ring-2 ring-zinc-200 overflow-hidden shadow-2xs">
                      {displayedProfilePhoto ? (
                        <img
                          src={displayedProfilePhoto}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                          onError={() => {
                            setProfilePhotoUrl("");
                          }}
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

                      {pendingProfilePhoto && (
                        <button
                          type="button"
                          onClick={handleApplyProfilePhoto}
                          className="px-2.5 py-1.5 rounded-md text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      )}
                      {pendingProfilePhoto && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhotoUrl(null);
                            setPendingProfilePhoto(null);
                            toast.info("Profile picture change cancelled.");
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
                      First Name
                    </label>
                    <input
                      type="text"
                      readOnly={!isEditingProfile}
                      {...registerProfile("firstName")}
                      className={`h-9! w-full px-3 text-zinc-900 bg-zinc-50 border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                        profileErrors.firstName
                          ? "border-red-500"
                          : "border-zinc-300"
                      }`}
                    />
                    {profileErrors.firstName && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {profileErrors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      readOnly={!isEditingProfile}
                      {...registerProfile("lastName")}
                      className={`h-9! w-full px-3 text-zinc-900 bg-zinc-50 border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                        profileErrors.lastName
                          ? "border-red-500"
                          : "border-zinc-300"
                      }`}
                    />
                    {profileErrors.lastName && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {profileErrors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Registered Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="h-9! w-full px-3 text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md cursor-not-allowed"
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
                      inputMode="numeric"
                      readOnly={!isEditingProfile}
                      {...registerProfile("contactNumber")}
                      className={`h-9! w-full px-3 text-zinc-900 bg-zinc-50 border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                        profileErrors.contactNumber
                          ? "border-red-500"
                          : "border-zinc-300"
                      }`}
                    />
                    {profileErrors.contactNumber && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {profileErrors.contactNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      System Account Role
                    </label>
                    <input
                      type="text"
                      value={user.role === "admin" ? "Admin" : "Customer"}
                      readOnly
                      className="h-9! w-full px-3 text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={
                      isEditingProfile
                        ? handleSubmitProfile(handleSaveProfile)
                        : () => setIsEditingProfile(true)
                    }
                    disabled={updating}
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isEditingProfile ? (updating ? "Saving..." : "Save Profile") : "Edit Profile"}
                  </button>
                </div>
              </form>
            </section>
          </ScrollReveal>
        )}

        {/* Section 2: Registered Delivery Address - 2-Column Unboxed Settings Layout */}
        {(currentTab === "all" || currentTab === "address") && (
          <ScrollReveal threshold={0.08} delay={50} duration={600} style={{ order: 3 }}>
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
                    onClick={() => {
                      if (isEditingAddress) {
                        setIsEditingAddress(false);
                        setSelectedAddressId(null);
                      } else {
                        beginAddressEdit();
                      }
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    {isEditingAddress
                      ? "← Cancel Editing"
                      : "Add Address"}
                  </button>
                </div>
              </div>

              <div className="md:col-span-8">
                {isEditingAddress ? (
                  <form
                    onSubmit={handleSubmitAddress(handleSaveAddress)}
                    className="space-y-4 text-xs"
                    noValidate
                  >
                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">
                        Address Label
                      </label>
                      <input
                        type="text"
                        placeholder="Home, Work, etc."
                        {...registerAddress("label")}
                        className="h-9! w-full px-3 text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">
                        House / Unit #, Street
                      </label>
                      <input
                        type="text"
                        {...registerAddress("street")}
                        className={`h-9! w-full px-3 text-zinc-900 bg-white border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                          addressErrors.street
                            ? "border-red-500"
                            : "border-zinc-300"
                        }`}
                      />
                      {addressErrors.street && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {addressErrors.street.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-zinc-700 font-semibold mb-1">
                          City / Municipality
                        </label>
                        <input
                          type="text"
                          {...registerAddress("city")}
                          className={`h-9! w-full px-3 text-zinc-900 bg-white border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                            addressErrors.city
                              ? "border-red-500"
                              : "border-zinc-300"
                          }`}
                        />
                        {addressErrors.city && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {addressErrors.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-zinc-700 font-semibold mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          {...registerAddress("postalCode")}
                          className={`h-9! w-full px-3 text-zinc-900 bg-white border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                            addressErrors.postalCode
                              ? "border-red-500"
                              : "border-zinc-300"
                          }`}
                        />
                        {addressErrors.postalCode && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {addressErrors.postalCode.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-zinc-700 font-semibold mb-1">
                        Barangay
                      </label>
                      <input
                        type="text"
                        {...registerAddress("barangay")}
                        className={`h-9! w-full px-3 text-zinc-900 bg-white border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                          addressErrors.barangay
                            ? "border-red-500"
                            : "border-zinc-300"
                        }`}
                      />
                      {addressErrors.barangay && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {addressErrors.barangay.message}
                        </p>
                      )}
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
                        disabled={addressesUpdating}
                        className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {addressesUpdating ? "Saving..." : "Save Address"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className="border border-zinc-200 rounded-md p-4 bg-zinc-50/50 text-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-zinc-900">
                            {address.label || "Address"}
                          </span>
                          {address.isDefault && (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-zinc-700">
                          {address.street}, {address.barangay}, {address.city}{" "}
                          {address.postalCode}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!address.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(address._id)}
                              className="text-emerald-700 hover:underline cursor-pointer"
                            >
                              Set default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => beginAddressEdit(address)}
                            className="text-zinc-700 hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address._id)}
                            className="text-red-600 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {addresses.length === 0 && (
                      <p className="text-xs text-zinc-500">
                        No saved addresses yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Section 3: Credit verification - 2-Column Unboxed Settings Layout */}
        {(currentTab === "all" || currentTab === "verification") && (
          <ScrollReveal threshold={0.08} delay={70} duration={600} style={{ order: 4 }}>
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10">
              {/* Left: label + status badge */}
              <div className="md:col-span-4 space-y-2">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Credit Verification
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Required to qualify for installment financing. Submit a valid government-issued ID and a recent proof of income for admin review.
                </p>

                {/* Status pill */}
                <div className="pt-1">
                  {!creditVerification?.status && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
                      Not submitted
                    </span>
                  )}
                  {creditVerification?.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      Under review
                    </span>
                  )}
                  {creditVerification?.status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Approved
                    </span>
                  )}
                  {creditVerification?.status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Right: content area */}
              <div className="md:col-span-8 space-y-4">

                {/* Rejection reason banner */}
                {creditVerification?.status === "rejected" && (
                  <div className="flex gap-3 p-4 rounded-md border border-rose-200 bg-rose-50">
                    <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-rose-800 mb-0.5">Documents not accepted</p>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        {creditVerification.rejectionReason || "Your documents did not meet the verification requirements. Please upload updated documents and resubmit."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved state */}
                {creditVerification?.status === "approved" && (
                  <div className="flex gap-3 p-4 rounded-md border border-emerald-200 bg-emerald-50">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 mb-0.5">Verification approved</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Your identity and income have been verified. You are eligible for installment financing. Submitted documents have been securely purged.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending state */}
                {creditVerification?.status === "pending" && (
                  <div className="flex gap-3 p-4 rounded-md border border-amber-200 bg-amber-50">
                    <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">Awaiting admin review</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Your documents have been received and are being reviewed. You will be notified once a decision is made.
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload form — shown when not yet approved */}
                {creditVerification?.status !== "approved" && (
                  <form onSubmit={handleCreditVerificationSubmit} className="space-y-4" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          key: "governmentId",
                          label: "Government-issued ID",
                          hint: "Passport, driver's licence, or national ID",
                          icon: (
                            <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="6" y1="15" x2="10" y2="15" />
                            </svg>
                          ),
                        },
                        {
                          key: "proofOfIncome",
                          label: "Proof of income",
                          hint: "Payslip, COE, or bank statement",
                          icon: (
                            <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="12" y2="17" />
                            </svg>
                          ),
                        },
                      ].map(({ key, label, hint, icon }) => (
                        <div key={key}>
                          <p className="text-xs font-semibold text-zinc-700 mb-1.5">{label}</p>
                          <label
                            className={`group relative flex flex-col items-center justify-center gap-2 w-full rounded-md border-2 border-dashed transition-colors cursor-pointer min-h-[120px] p-4 text-center ${
                              creditFiles[key]
                                ? "border-emerald-400 bg-emerald-50/60"
                                : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100/60"
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file && file.size > 5 * 1024 * 1024) {
                                  toast.error("File must be 5 MB or smaller.");
                                  e.target.value = "";
                                  return;
                                }
                                setCreditFiles((cur) => ({ ...cur, [key]: file }));
                              }}
                            />

                            {creditFiles[key] ? (
                              <>
                                {/* File selected state */}
                                <svg className="w-6 h-6 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <span className="text-xs font-semibold text-emerald-700 truncate max-w-full px-1">
                                  {creditFiles[key].name}
                                </span>
                                <span className="text-[11px] text-emerald-600">
                                  {(creditFiles[key].size / 1024).toFixed(0)} KB
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCreditFiles((cur) => ({ ...cur, [key]: null }));
                                  }}
                                  className="absolute top-2 right-2 p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  aria-label="Remove file"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Empty state */}
                                {icon}
                                <span className="text-xs font-medium text-zinc-600">
                                  Click to upload
                                </span>
                                <span className="text-[11px] text-zinc-400 leading-snug">{hint}</span>
                                <span className="text-[11px] text-zinc-400">JPG, PNG or PDF · max 5 MB</span>
                              </>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs">
                        Documents are encrypted and only accessible to verified admins during the review period.
                      </p>
                      <button
                        type="submit"
                        disabled={creditSubmitting || (!creditFiles.governmentId && !creditFiles.proofOfIncome)}
                        className="shrink-0 px-4 py-2 rounded-md bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {creditSubmitting ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Submitting...
                          </span>
                        ) : "Submit for review"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Section 4: Security - Change Password & Deactivate Account */}
        {(currentTab === "all" || currentTab === "security") && (
          <ScrollReveal threshold={0.08} delay={90} duration={600} style={{ order: 2 }}>
            <section
              className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10"
              style={{ order: 2 }}
            >
              <div className="md:col-span-4 space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Security
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Update your account password to keep your Motorcycled account secure or manage account access.
                </p>
              </div>

              <div className="md:col-span-8 space-y-8">
                <form
                  onSubmit={handleSubmitPassword(handleChangePassword)}
                  noValidate
                  className="space-y-4 text-xs max-w-md"
                >
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">Change Password</h3>
                  </div>
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        {...registerPassword("oldPassword")}
                        className={`h-9 w-full px-3 pr-9 text-zinc-900 bg-white border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                          passwordErrors.oldPassword ? "border-red-500" : "border-zinc-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        aria-label={showOldPassword ? "Hide password" : "Show password"}
                      >
                        {showOldPassword ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordErrors.oldPassword && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {passwordErrors.oldPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        {...registerPassword("newPassword")}
                        className={`h-9 w-full px-3 pr-9 text-zinc-900 bg-white border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                          passwordErrors.newPassword ? "border-red-500" : "border-zinc-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {passwordErrors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? "text" : "password"}
                        {...registerPassword("confirmNewPassword")}
                        className={`h-9 w-full px-3 pr-9 text-zinc-900 bg-white border rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${
                          passwordErrors.confirmNewPassword ? "border-red-500" : "border-zinc-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmNewPassword ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" x2="22" y1="2" y2="22" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmNewPassword && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {passwordErrors.confirmNewPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </form>

                {user.role !== "admin" && (
                  <div className="border-t border-zinc-200 pt-6 max-w-md">
                    <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Danger Zone</h3>
                    <p className="text-xs text-zinc-500 mb-3">Deactivate your account. You won't be able to sign in after deactivation.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        const { value: confirmed } = await import("sweetalert2").then((m) => m.default.fire({
                          icon: "warning",
                          title: "Deactivate account?",
                          text: "This action cannot be undone. You will be logged out immediately.",
                          showCancelButton: true,
                          confirmButtonText: "Yes, deactivate",
                          cancelButtonText: "Cancel",
                          buttonsStyling: false,
                          customClass: {
                            popup: "rounded-xl border border-zinc-200 shadow-xl",
                            title: "text-base font-bold text-zinc-900",
                            htmlContainer: "text-sm text-zinc-600",
                            confirmButton: "rounded-md bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700",
                            cancelButton: "rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50",
                            actions: "gap-2",
                          },
                        }));
                        if (!confirmed) return;
                        try {
                          const res = await axios.patch(`${API}/profile/deactivate`, {}, { withCredentials: true });
                          toast.success(res.data.message || "Account deactivated");
                          setTimeout(() => {
                            window.location.assign("/login");
                          }, 1000);
                        } catch (err) {
                          toast.error(err?.response?.data?.message || "Unable to deactivate account");
                        }
                      }}
                      className="px-4 py-1.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium"
                    >
                      Deactivate My Account
                    </button>
                  </div>
                )}
              </div>
            </section>
          </ScrollReveal>
        )}
      </main>
    </div>
  );
};
