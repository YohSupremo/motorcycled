import * as yup from "yup";

const fileSchema = (maxSizeMB, isRequired = false) =>
  yup
    .mixed()
    .test("required", "Please select an image", (value) => {
      if (!isRequired) return true;
      if (!value) return false;
      if (typeof FileList !== "undefined" && value instanceof FileList) {
        return value.length > 0;
      }
      if (typeof File !== "undefined" && value instanceof File) {
        return true;
      }
      return false;
    })
    .test("fileType", "File must be an image", (value) => {
      if (!value) return true;
      const file =
        typeof FileList !== "undefined" && value instanceof FileList
          ? value[0]
          : value;
      if (!file) return true;
      return file && file.type ? file.type.startsWith("image/") : true;
    })
    .test("fileSize", `Image must be ${maxSizeMB} MB or smaller`, (value) => {
      if (!value) return true;
      const file =
        typeof FileList !== "undefined" && value instanceof FileList
          ? value[0]
          : value;
      if (!file) return true;
      return file ? file.size <= maxSizeMB * 1024 * 1024 : true;
    });

const registerSchema = yup.object({
  profilePicture: fileSchema(2, false),
  firstName: yup.string().trim().required("First name is required"),
  lastName: yup.string().trim().required("Last name is required"),
  contactNumber: yup
    .string()
    .trim()
    .required("Contact number is required")
    .matches(/^09\d{9}$/, "11-digit contact number is required"),
  street: yup.string().trim().required("Street is required"),
  barangay: yup.string().trim().required("Barangay is required"),
  city: yup.string().trim().required("City is required"),
  postalCode: yup
    .string()
    .trim()
    .required("Postal code is required")
    .matches(/^\d{4}$/, "Postal code is required"),
  email: yup
    .string()
    .trim()
    .required("Email is required")
    .email("Invalid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "At least 8 characters is required"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password"), null], "Passwords do not match"),
});

export default registerSchema;
