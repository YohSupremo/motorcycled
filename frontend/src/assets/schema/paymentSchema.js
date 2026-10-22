import * as yup from "yup";

const BANK_CODES = ["BDO", "BPI", "UBP", "Metrobank"];

const walletNumber = (label, formatHint = "") =>
  yup
    .string()
    .trim()
    .required(`${label} mobile number is required`)
    .test(
      "valid-mobile",
      `Enter an 11-digit ${label} mobile number${formatHint}`,
      (value) => /^09\d{9}$/.test((value || "").replace(/[\s-]/g, "")),
    );

export const buildPaymentSchema = (paymentMethod = "cash_on_releasing") => {
  if (paymentMethod === "gcash" || paymentMethod === "maya") {
    const isGcash = paymentMethod === "gcash";
    return yup.object({
      accountName: yup
        .string()
        .trim()
        .required(
          `${isGcash ? "GCash" : "Maya registered"} account name is required`,
        ),
      accountNumber: walletNumber(
        isGcash ? "GCash" : "Maya",
        isGcash ? " (09XXXXXXXXX)" : "",
      ),
      referenceNumber: yup.string().trim(),
      bankName: yup.string().trim(),
    });
  }

  if (paymentMethod === "bank_deposit") {
    return yup.object({
      accountName: yup
        .string()
        .trim()
        .required("Account holder name is required"),
      accountNumber: yup
        .string()
        .trim()
        .required("Bank account number is required"),
      referenceNumber: yup.string().trim(),
      bankName: yup
        .string()
        .trim()
        .oneOf(BANK_CODES, "Select a valid bank")
        .required("Select your bank"),
    });
  }

  return yup.object({
    accountName: yup.string().trim(),
    accountNumber: yup.string().trim(),
    referenceNumber: yup.string().trim(),
    bankName: yup.string().trim(),
  });
};
