import * as yup from "yup";

export const MONTHLY_INCOME_RANGES = [
  "Below ₱10,000",
  "₱10,000 – ₱19,999",
  "₱20,000 – ₱39,999",
  "₱40,000 – ₱59,999",
  "₱60,000 – ₱79,999",
  "₱80,000 and above",
];

const contactNumber = () =>
  yup
    .string()
    .trim()
    .required("Mobile number is required")
    .matches(
      /^09\d{9}$/,
      "Enter a valid 11-digit mobile number (e.g. 09171234567)",
    );

const postalCode = () =>
  yup
    .string()
    .trim()
    .required("Postal code is required")
    .matches(/^\d{4}$/, "Postal code is required");

export const shippingAddressSchema = yup.object({
  label: yup.string().trim(),
  street: yup.string().trim().required("Street address is required"),
  barangay: yup.string().trim().required("Barangay is required"),
  city: yup.string().trim().required("City / Municipality is required"),
  postalCode: postalCode(),
  isDefault: yup.boolean().default(false),
});

export const buildShippingSchema = ({
  hasMotorcycles = false,
  hasInstallment = false,
  requireAddress = false,
} = {}) => {
  const addressField = (message) =>
    yup
      .string()
      .trim()
      .when("partsFulfillmentMethod", {
        is: "delivery",
        then: (schema) => (requireAddress ? schema.required(message) : schema),
      });

  return yup.object({
    recipientName: yup.string().trim().required("Full name is required"),
    contactNumber: contactNumber(),
    email: yup
      .string()
      .trim()
      .required("Email address is required")
      .email("Enter a valid email address"),
    partsFulfillmentMethod: yup
      .string()
      .oneOf(["delivery", "pickup"])
      .required(),
    branch: yup
      .string()
      .trim()
      .when([], {
        is: () => hasMotorcycles,
        then: (schema) =>
          schema.required("Please select an authorized showroom"),
        otherwise: (schema) =>
          schema.when("partsFulfillmentMethod", {
            is: "pickup",
            then: (s) => s.required("Please select an authorized showroom"),
          }),
      }),
    address: addressField("Street address is required"),
    barangay: addressField("Barangay is required"),
    city: addressField("City / Municipality is required"),
    postalCode: yup
      .string()
      .trim()
      .matches(/^\d{4}$/, {
        message: "Postal code is required",
        excludeEmptyString: true,
      })
      .when("partsFulfillmentMethod", {
        is: "delivery",
        then: (schema) =>
          requireAddress ? schema.required("Postal code is required") : schema,
      }),
    deliveryNotes: yup.string().trim(),
    governmentIdType: yup.string().trim(),
    governmentIdNumber: hasInstallment
      ? yup
          .string()
          .trim()
          .required("Valid ID number is required for credit evaluation")
      : yup.string().trim(),
    employerName: hasInstallment
      ? yup.string().trim().required("Employer or business name is required")
      : yup.string().trim(),
    monthlyIncome: hasInstallment
      ? yup
          .string()
          .trim()
          .required("Approximate monthly income is required")
          .oneOf(
            MONTHLY_INCOME_RANGES,
            "Select your approximate monthly income",
          )
      : yup.string().trim(),
  });
};
