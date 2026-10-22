import * as yup from "yup";

export const installmentPaymentSchema = yup.object({
  paymentMethod: yup
    .string()
    .trim()
    .oneOf(["gcash", "maya", "bank_deposit", "counter"])
    .required(),
  referenceNumber: yup
    .string()
    .trim()
    .required("Payment reference number is required"),
});
