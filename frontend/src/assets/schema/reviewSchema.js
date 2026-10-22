import * as yup from "yup";

export const reviewSchema = yup.object({
  rating: yup
    .number()
    .typeError("Please select a star rating.")
    .min(1, "Please select a star rating.")
    .max(5, "Please select a star rating.")
    .required("Please select a star rating."),
  title: yup
    .string()
    .trim()
    .max(80, "Title must be 80 characters or less"),
  comment: yup
    .string()
    .trim()
    .max(1000, "Review must be 1000 characters or less"),
});
