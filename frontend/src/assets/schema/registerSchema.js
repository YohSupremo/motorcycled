import { z } from "zod";

const imageSchema = (maxSize) =>
  z
    .instanceof(FileList)
    .transform((files) => files[0])
    .pipe(
      z.instanceof(File, {
        message: "Please select an image",
      }),
    )
    .refine((file) => file.type.startsWith("image/"), {
      message: "File must be an image",
    })
    .refine((file) => file.size <= maxSize * 1024 * 1024, {
      message: `Image must be ${maxSize} MB or smaller`,
    });

const registerSchema = z
  .object({
    profilePicture: imageSchema(2),
    validId: imageSchema(5),
    proofOfIncome: imageSchema(5),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    contactNumber: z
      .string()
      .regex(/^09\d{9}$/, "11-digit contact number is required"),
    street: z.string().min(1, "Street is required"),
    barangay: z.string().min(1, "Barangay is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().regex(/^\d{4}$/, "Postal code is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "At least 8 characters is required"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default registerSchema;
