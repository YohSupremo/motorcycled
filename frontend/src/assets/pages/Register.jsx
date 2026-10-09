import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import registerSchema from "../schema/registerSchema.js";
import axios from "axios";
export const Register = () => {
  const [step, setStep] = useState(0);

  const {
    handleSubmit,
    register,
    clearErrors,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", data.profilePicture);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("contactNumber", data.contactNumber);
      formData.append("validId", data.validId);
      formData.append("proofOfIncome", data.proofOfIncome);
      formData.append("street", data.street);
      formData.append("barangay", data.barangay);
      formData.append("city", data.city);
      formData.append("postalCode", data.postalCode);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);
      const response = await axios.post(
        "http://localhost:4001/api/v1/register",
        formData,
      );

      console.log(response.data);
      setSubmitted(true);
    } catch (error) {
      console.log(error);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function increment() {
    const currentFields = stepFields[step];
    if (currentFields) {
      const isValid = await trigger(currentFields);
      if (!isValid) {
        return;
      }
    }

    if (step < 4) {
      setStep((prev) => prev + 1);
    }
  }

  function decrement() {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  }

  const stepMeta = [
    {
      title: "Personal details",
      subtitle: "Enter your contact and profile information",
    },
    {
      title: "Verification",
      subtitle: "Upload identification documents for verification",
    },
    { title: "Address", subtitle: "Provide your primary residential address" },
    {
      title: "Account credentials",
      subtitle: "Set up your login email and secure password",
    },
    {
      title: "Review & confirm",
      subtitle: "Verify your information before completing registration",
    },
  ];

  const stepFields = {
    0: ["profilePicture", "firstName", "lastName", "contactNumber"],
    1: ["validId", "proofOfIncome"],
    2: ["street", "barangay", "city", "postalCode"],
    3: ["email", "password", "confirmPassword"],
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900 flex flex-col justify-center items-center px-4 py-8 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/motorcycled-logo.png"
              alt="Motorcycled Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="text-sm font-bold tracking-wider text-zinc-900 uppercase">
              Motorcycled
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {submitted ? "Completed" : `Step ${step + 1} of 5`}
          </span>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5 sm:p-6">
          {submitted ? (
            /* Submission Success State */
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Registration submitted
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Your application has been received and is currently under
                  verification.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Step Title & Description */}
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
                  {stepMeta[step].title}
                </h1>
                <p className="text-xs text-zinc-500 mt-1">
                  {stepMeta[step].subtitle}
                </p>

                {/* Segmented Step Progress Bar */}
                <div
                  className="grid grid-cols-5 gap-1.5 mt-4"
                  aria-hidden="true"
                >
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-xs transition-colors duration-150 ${
                        step >= idx ? "bg-emerald-600" : "bg-zinc-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {/* STEP 0: Personal Details */}
                {step === 0 && (
                  <>
                    <div className="mb-0">
                      <label
                        htmlFor="profile_pic"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Profile picture
                      </label>
                      <input
                        id="profile_pic"
                        type="file"
                        accept="image/*"
                        {...register("profilePicture", {
                          onChange: () => clearErrors("profilePicture"),
                        })}
                        className="block w-full text-xs text-zinc-600 border border-zinc-300 rounded-md cursor-pointer bg-zinc-50/50 p-2 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border file:border-zinc-300 file:text-xs file:font-medium file:bg-white file:text-zinc-700 hover:file:bg-zinc-100 hover:file:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                      <span className="block text-[11px] text-zinc-400 mt-1">
                        {/* formData.profilePicName
                          ? `Selected: ${formData.profilePicName}`
                          : "JPG or PNG, up to 5MB" */}
                        JPG or PNG, up to 5MB
                      </span>
                    </div>
                    {errors.profilePicture && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.profilePicture.message}
                      </span>
                    )}

                    <div className="mb-0">
                      <label
                        htmlFor="firstName"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        First name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        {...register("firstName", {
                          onChange: () => clearErrors("firstName"),
                        })}
                        placeholder="Juan"
                        className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                      />
                    </div>
                    {errors.firstName && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.firstName.message}
                      </span>
                    )}
                    <div className="mb-0">
                      <label
                        htmlFor="lastName"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Last name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        {...register("lastName", {
                          onChange: () => clearErrors("lastName"),
                        })}
                        placeholder="Dela Cruz"
                        className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                      />
                    </div>
                    {errors.lastName && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.lastName.message}
                      </span>
                    )}
                    <div className="mb-0">
                      <label
                        htmlFor="contactNumber"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Contact number
                      </label>
                      <input
                        id="contactNumber"
                        type="text"
                        {...register("contactNumber", {
                          onChange: () => clearErrors("contactNumber"),
                        })}
                        placeholder="0912 345 6789"
                        className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                      />
                    </div>
                    {errors.contactNumber && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.contactNumber.message}
                      </span>
                    )}
                  </>
                )}

                {/* STEP 1: Verification Documents */}
                {step === 1 && (
                  <>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-600 leading-relaxed">
                      Required for motorcycle installment plans and credit
                      evaluation. Valid government ID and proof of income are
                      verified by our loan team.
                    </div>

                    <div className="mb-0">
                      <label
                        htmlFor="valid_id"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Valid government ID
                      </label>
                      <input
                        id="valid_id"
                        type="file"
                        accept="image/*"
                        {...register("validId", {
                          onChange: () => clearErrors("validId"),
                        })}
                        className="block w-full text-xs text-zinc-600 border border-zinc-300 rounded-md cursor-pointer bg-zinc-50/50 p-2 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border file:border-zinc-300 file:text-xs file:font-medium file:bg-white file:text-zinc-700 hover:file:bg-zinc-100 hover:file:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                      <span className="block text-[11px] text-zinc-400 mt-1">
                        {/* formData.validIdName
                          ? `Selected: ${formData.validIdName}`
                          : "Driver’s license, Passport, UMID, or National ID" */}
                        Driver’s license, Passport, UMID, or National ID
                      </span>
                    </div>
                    {errors.validId && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.validId.message}
                      </span>
                    )}

                    <div className="mb-0">
                      <label
                        htmlFor="proof_income"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Proof of income
                      </label>
                      <input
                        id="proof_income"
                        type="file"
                        accept="image/*"
                        {...register("proofOfIncome", {
                          onChange: () => clearErrors("proofOfIncome"),
                        })}
                        className="block w-full text-xs text-zinc-600 border border-zinc-300 rounded-md cursor-pointer bg-zinc-50/50 p-2 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border file:border-zinc-300 file:text-xs file:font-medium file:bg-white file:text-zinc-700 hover:file:bg-zinc-100 hover:file:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                      <span className="block text-[11px] text-zinc-400 mt-1">
                        {/* formData.proofIncomeName
                          ? `Selected: ${formData.proofIncomeName}`
                          : "Latest payslip, certificate of employment, or bank statement" */}
                        Latest payslip, certificate of employment, or bank
                        statement
                      </span>
                    </div>
                    {errors.proofOfIncome && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.proofOfIncome.message}
                      </span>
                    )}
                  </>
                )}

                {/* STEP 2: Address */}
                {step === 2 && (
                  <>
                    <div className="mb-0">
                      <label
                        htmlFor="addressStreet"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        House / Unit #, Street, Village
                      </label>
                      <input
                        id="addressStreet"
                        type="text"
                        // value={formData.street}
                        {...register("street", {
                          onChange: () => clearErrors("street"),
                        })}
                        placeholder="123 Rizal Street"
                        className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                      />
                    </div>
                    {errors.street && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.street.message}
                      </span>
                    )}

                    <div className="mb-0">
                      <label
                        htmlFor="addressBarangay"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Barangay
                      </label>
                      <input
                        id="addressBarangay"
                        type="text"
                        // value={formData.barangay}
                        {...register("barangay", {
                          onChange: () => clearErrors("barangay"),
                        })}
                        placeholder="San Antonio"
                        className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                      />
                    </div>
                    {errors.barangay && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.barangay.message}
                      </span>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="col-span-2 mb-0 ">
                          <label
                            htmlFor="addressCity"
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            City / Municipality
                          </label>
                          <input
                            id="addressCity"
                            type="text"
                            // value={formData.city}
                            {...register("city", {
                              onChange: () => clearErrors("city"),
                            })}
                            placeholder="Pasig City"
                            className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                          />
                        </div>
                        {errors.city && (
                          <span className="text-red-500 text-sm mt-0">
                            {errors.city.message}
                          </span>
                        )}
                      </div>

                      <div className="">
                        <div className="mb-0">
                          <label
                            htmlFor="addressPostal"
                            className="block text-xs font-medium text-zinc-700 mb-1"
                          >
                            Postal Code
                          </label>
                          <input
                            id="addressPostal"
                            type="text"
                            maxLength={4}
                            minLength={4}
                            // value={formData.postalCode}
                            {...register("postalCode", {
                              onChange: () => clearErrors("postalCode"),
                            })}
                            placeholder="1600"
                            className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                          />
                        </div>
                        {errors.postalCode && (
                          <span className="text-red-500 text-sm mt-0">
                            {errors.postalCode.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 3: Email & Password Credentials */}
                {step === 3 && (
                  <>
                    <div className="mb-0">
                      <label
                        htmlFor="accountEmail"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Email address
                      </label>
                      <input
                        id="accountEmail"
                        type="email"
                        // value={formData.email}
                        {...register("email", {
                          onChange: () => clearErrors("email"),
                        })}
                        placeholder="rider@example.com"
                        className="h-10! w-full px-3 py-2 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                      />
                    </div>
                    {errors.email && (
                      <span className="text-red-500 text-sm mt-0">
                        {errors.email.message}
                      </span>
                    )}
                    <div>
                      <label
                        htmlFor="account_password"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="account_password"
                          type={showPassword ? "text" : "password"}
                          // value={formData.password}
                          {...register("password", {
                            onChange: () => clearErrors("password"),
                          })}
                          placeholder="••••••••"
                          className="h-10! w-full px-3 py-2 pr-10 text-sm text-zinc-900 bg-white border border-zinc-300 rounded-md placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer flex items-center justify-center z-10"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                              <line x1="2" x2="22" y1="2" y2="22" />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-red-500 text-sm mt-0">
                          {errors.password.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-xs font-medium text-zinc-700 mb-1"
                      >
                        Confirm password
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          // value={formData.confirmPassword}
                          {...register("confirmPassword", {
                            onChange: () => clearErrors("confirmPassword"),
                          })}
                          placeholder="••••••••"
                          className={`h-10! w-full px-3 py-2 pr-10 text-sm text-zinc-900 bg-white border rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-1 transition-colors ${
                            errors.confirmPassword
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 focus:outline-none cursor-pointer flex items-center justify-center z-10"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                              <line x1="2" x2="22" y1="2" y2="22" />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <span className="text-red-500 text-sm mt-0">
                          {errors.confirmPassword.message}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* STEP 4: Review Step */}
                {step === 4 && (
                  <div className="space-y-4 text-xs">
                    {/* Personal Details Group */}
                    <div className="border border-zinc-200 rounded-md p-3.5 bg-zinc-50/50">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80">
                        <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
                          Personal Details
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid grid-cols-3 gap-y-1.5 text-zinc-600">
                        <dt className="text-zinc-500">Name:</dt>
                        <dd className="col-span-2 font-medium text-zinc-800">
                          {getValues("firstName") + " " + getValues("lastName")}
                        </dd>
                        <dt className="text-zinc-500">Contact:</dt>
                        <dd className="col-span-2 font-medium text-zinc-800">
                          {getValues("contactNumber")}
                        </dd>
                        <dt className="text-zinc-500">Photo:</dt>
                        <dd className="col-span-2 truncate text-zinc-700">
                          {getValues("profilePicture")?.[0]?.name}
                        </dd>
                      </dl>
                    </div>

                    {/* Verification Documents Group */}
                    <div className="border border-zinc-200 rounded-md p-3.5 bg-zinc-50/50">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80">
                        <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
                          Verification Documents
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid grid-cols-3 gap-y-1.5 text-zinc-600">
                        <dt className="text-zinc-500">Valid ID:</dt>
                        <dd className="col-span-2 truncate text-zinc-700">
                          {getValues("validId")?.[0]?.name}
                        </dd>
                        <dt className="text-zinc-500">Income proof:</dt>
                        <dd className="col-span-2 truncate text-zinc-700">
                          {getValues("proofOfIncome")?.[0]?.name}
                        </dd>
                      </dl>
                    </div>

                    {/* Address Group */}
                    <div className="border border-zinc-200 rounded-md p-3.5 bg-zinc-50/50">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80">
                        <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
                          Address
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid grid-cols-3 gap-y-1.5 text-zinc-600">
                        <dt className="text-zinc-500">Street / Unit:</dt>
                        <dd className="col-span-2 font-medium text-zinc-800">
                          {getValues("street")}
                        </dd>
                        <dt className="text-zinc-500">Barangay:</dt>
                        <dd className="col-span-2 font-medium text-zinc-800">
                          {getValues("barangay")}
                        </dd>
                        <dt className="text-zinc-500">City / Postal:</dt>
                        <dd className="col-span-2 font-medium text-zinc-800">
                          {getValues("city") + ", " + getValues("postalCode")}
                        </dd>
                      </dl>
                    </div>

                    {/* Account Credentials Group */}
                    <div className="border border-zinc-200 rounded-md p-3.5 bg-zinc-50/50">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80">
                        <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
                          Account Credentials
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep(3)}
                          className="text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      </div>
                      <dl className="grid grid-cols-3 gap-y-1.5 text-zinc-600">
                        <dt className="text-zinc-500">Email:</dt>
                        <dd className="col-span-2 font-medium text-zinc-800">
                          {getValues("email")}
                        </dd>
                        <dt className="text-zinc-500">Password:</dt>
                        <dd className="col-span-2 font-mono text-zinc-700">
                          {"*".repeat(getValues("password").length)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-4">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={decrement}
                      className="h-10! px-4 rounded-md border border-zinc-300 bg-white text-zinc-700 text-sm font-medium hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  )}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={increment}
                      className="h-10! px-4 flex-1 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit(onSubmit)}
                      className="h-10! px-4 flex-1 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium transition-colors cursor-pointer"
                    >
                      Submit registration
                    </button>
                  )}
                </div>
              </form>

              {/* Card Footer */}
              <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
                <p className="text-xs text-zinc-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Bottom Metadata */}
        <p className="text-center text-[11px] text-zinc-400 mt-4">
          By signing up, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
};
