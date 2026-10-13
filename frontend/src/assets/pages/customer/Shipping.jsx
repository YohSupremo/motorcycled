import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Stepper,
  Step,
  StepLabel,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { saveShippingInfo } from "../../../actions/cartActions";
import { ScrollReveal } from "../../components/ScrollReveal";

const BRANCHES = [
  "Pasig City — Central Dealership & Service Bay",
  "Quezon City — North Boulevard Showroom",
  "Cebu City — Visayas Releasing Depot",
];

const CHECKOUT_STEPS = ["Cart", "Fulfillment & Shipping", "Review & Pay", "Complete"];

export const Shipping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { shippingInfo } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    recipientName:
      shippingInfo?.recipientName ||
      (user ? `${user.firstName} ${user.lastName}` : ""),
    contactNumber: shippingInfo?.contactNumber || user?.contactNumber || "",
    address: shippingInfo?.address || "",
    barangay: shippingInfo?.barangay || "",
    city: shippingInfo?.city || "",
    postalCode: shippingInfo?.postalCode || "",
    fulfillmentMethod: shippingInfo?.fulfillmentMethod || "delivery",
    branch: shippingInfo?.branch || BRANCHES[0],
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = {};
    if (!form.recipientName.trim()) errs.recipientName = "Recipient name is required";
    if (!form.contactNumber.trim()) errs.contactNumber = "Contact number is required";
    if (form.fulfillmentMethod === "delivery") {
      if (!form.address.trim()) errs.address = "Street address is required";
      if (!form.barangay.trim()) errs.barangay = "Barangay is required";
      if (!form.city.trim()) errs.city = "City is required";
      if (!form.postalCode.trim()) errs.postalCode = "Postal code is required";
    }
    if (form.fulfillmentMethod === "pickup" && !form.branch) {
      errs.branch = "Please select a branch";
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch(saveShippingInfo(form));
    navigate("/checkout/confirm");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased flex flex-col font-sans">
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* MUI Stepper (20pts requirement) */}
        <Box sx={{ width: "100%", pb: 2 }}>
          <Stepper activeStep={1} alternativeLabel>
            {CHECKOUT_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    },
                    "& .Mui-active": {
                      color: "#059669 !important",
                      fontWeight: 700,
                    },
                    "& .Mui-completed": {
                      color: "#059669 !important",
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Header */}
        <div className="pb-4 border-b border-zinc-900">
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Fulfillment Details
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Provide your recipient and delivery address or select a verified dealership pickup branch.
          </p>
        </div>

        <ScrollReveal threshold={0.05} duration={400}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Information Card */}
            <Card variant="outlined" sx={{ borderRadius: "8px", borderColor: "#e4e4e7" }}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 }, spaceY: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#18181b", mb: 2 }}>
                  Recipient Information
                </Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Full Name"
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                    value={form.recipientName}
                    onChange={(e) => handleChange("recipientName", e.target.value)}
                    error={Boolean(errors.recipientName)}
                    helperText={errors.recipientName}
                    placeholder="Juan Dela Cruz"
                  />
                  <TextField
                    label="Contact Number"
                    variant="outlined"
                    size="small"
                    required
                    fullWidth
                    value={form.contactNumber}
                    onChange={(e) => handleChange("contactNumber", e.target.value)}
                    error={Boolean(errors.contactNumber)}
                    helperText={errors.contactNumber}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fulfillment Method Card */}
            <Card variant="outlined" sx={{ borderRadius: "8px", borderColor: "#e4e4e7" }}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#18181b", mb: 2 }}>
                  Fulfillment Method
                </Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                  <label
                    className={`border rounded-md p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                      form.fulfillmentMethod === "delivery"
                        ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="fulfillmentMethod"
                        value="delivery"
                        checked={form.fulfillmentMethod === "delivery"}
                        onChange={() => handleChange("fulfillmentMethod", "delivery")}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-zinc-900 block">
                          Door-to-Door Delivery
                        </span>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                          Official transport carrier with inspection before delivery.
                        </p>
                      </div>
                    </div>
                    <span className="mt-2 text-[11px] font-mono font-bold text-emerald-800 self-end">
                      ₱350.00 Freight (parts only)
                    </span>
                  </label>

                  <label
                    className={`border rounded-md p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                      form.fulfillmentMethod === "pickup"
                        ? "border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600"
                        : "border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="fulfillmentMethod"
                        value="pickup"
                        checked={form.fulfillmentMethod === "pickup"}
                        onChange={() => handleChange("fulfillmentMethod", "pickup")}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-zinc-900 block">
                          Dealership Pickup
                        </span>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                          Pick up directly from the showroom with technician walkthrough.
                        </p>
                      </div>
                    </div>
                    <span className="mt-2 text-[11px] font-mono font-bold text-emerald-800 self-end">
                      FREE (₱0.00)
                    </span>
                  </label>
                </div>

                {/* Delivery address fields */}
                {form.fulfillmentMethod === "delivery" && (
                  <div className="pt-3 border-t border-zinc-100 space-y-3">
                    <TextField
                      label="Street Address"
                      variant="outlined"
                      size="small"
                      required
                      fullWidth
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      error={Boolean(errors.address)}
                      helperText={errors.address}
                      placeholder="Block 14 Lot 8 Emerald Avenue"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TextField
                        label="Barangay"
                        variant="outlined"
                        size="small"
                        required
                        fullWidth
                        value={form.barangay}
                        onChange={(e) => handleChange("barangay", e.target.value)}
                        error={Boolean(errors.barangay)}
                        helperText={errors.barangay}
                      />
                      <TextField
                        label="City / Municipality"
                        variant="outlined"
                        size="small"
                        required
                        fullWidth
                        value={form.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        error={Boolean(errors.city)}
                        helperText={errors.city}
                        placeholder="Pasig City"
                      />
                      <TextField
                        label="Postal Code"
                        variant="outlined"
                        size="small"
                        required
                        fullWidth
                        value={form.postalCode}
                        onChange={(e) => handleChange("postalCode", e.target.value)}
                        error={Boolean(errors.postalCode)}
                        helperText={errors.postalCode}
                        placeholder="1600"
                      />
                    </div>
                  </div>
                )}

                {/* Branch picker */}
                {form.fulfillmentMethod === "pickup" && (
                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                    <FormControl fullWidth size="small">
                      <InputLabel id="branch-select-label">Select Dealership Branch</InputLabel>
                      <Select
                        labelId="branch-select-label"
                        value={form.branch}
                        label="Select Dealership Branch"
                        onChange={(e) => handleChange("branch", e.target.value)}
                      >
                        {BRANCHES.map((b) => (
                          <MenuItem key={b} value={b} sx={{ fontSize: "0.8rem" }}>
                            {b}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {errors.branch && (
                      <p className="text-[11px] text-red-600">{errors.branch}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions with MUI Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outlined"
                onClick={() => navigate("/cart")}
                sx={{
                  borderColor: "#d4d4d8",
                  color: "#3f3f46",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  "&:hover": { borderColor: "#a1a1aa", bgcolor: "#f4f4f5" },
                }}
              >
                ← Back to Cart
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: "#059669",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  px: 4,
                  py: 1,
                  "&:hover": { bgcolor: "#047857" },
                }}
              >
                Continue to Review →
              </Button>
            </div>
          </form>
        </ScrollReveal>
      </main>
    </div>
  );
};
