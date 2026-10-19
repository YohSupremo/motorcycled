import { Box, Stepper, Step, StepLabel } from "@mui/material";

const CHECKOUT_STEPS = [
  "Cart",
  "Fulfillment and verification",
  "Review and terms",
  "Complete",
];

export const CheckoutStepper = ({ activeStep = 0 }) => {
  return (
    <Box sx={{ width: "100%", py: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {CHECKOUT_STEPS.map((label) => (
          <Step key={label}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  fontSize: { xs: "0.7rem", sm: "0.78rem" },
                  fontWeight: 600,
                  color: "#6b7280",
                  mt: 0.5,
                },
                "& .MuiStepLabel-label.Mui-active": {
                  color: "#059669 !important",
                  fontWeight: 700,
                },
                "& .MuiStepLabel-label.Mui-completed": {
                  color: "#059669 !important",
                  fontWeight: 600,
                },
                "& .MuiStepIcon-root": {
                  color: "#9ca3af",
                  width: 28,
                  height: 28,
                },
                "& .MuiStepIcon-root.Mui-active": {
                  color: "#059669 !important",
                },
                "& .MuiStepIcon-root.Mui-completed": {
                  color: "#059669 !important",
                },
                "& .MuiStepConnector-line": {
                  borderColor: "#e5e7eb",
                  borderTopWidth: 2,
                },
                "& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
                  borderColor: "#059669",
                },
                "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line": {
                  borderColor: "#059669",
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
