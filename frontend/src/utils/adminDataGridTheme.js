/**
 * Shared aesthetic theme configuration for MUI X DataGrid
 * Designed for dealership admin telemetry, inventory, and backoffice management.
 */
export const adminDataGridSx = {
  border: "none",
  fontFamily: "inherit",
  fontSize: "0.75rem",
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #e4e4e7",
    color: "#52525b",
    fontWeight: 600,
    fontSize: "0.6875rem",
    textTransform: "uppercase",
    fontFamily: "ui-monospace, monospace",
    letterSpacing: "0.05em",
  },
  "& .MuiDataGrid-columnSeparator": {
    display: "none !important",
  },
  "& .MuiDataGrid-columnHeader": {
    paddingLeft: "16px",
    paddingRight: "16px",
  },
  "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none !important",
  },
  "& .MuiDataGrid-row": {
    borderBottom: "1px solid #f4f4f5",
    transition: "background-color 0.15s ease",
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "rgba(244, 244, 245, 0.7)",
  },
  "& .MuiDataGrid-row.Mui-selected": {
    backgroundColor: "rgba(236, 253, 245, 0.6) !important",
    "&:hover": {
      backgroundColor: "rgba(209, 250, 229, 0.8) !important",
    },
  },
  "& .MuiDataGrid-cell": {
    display: "flex",
    alignItems: "center",
    paddingLeft: "16px",
    paddingRight: "16px",
  },
  "& .MuiCheckbox-root": {
    color: "#d4d4d8",
    "&.Mui-checked": {
      color: "#059669",
    },
    "&.MuiCheckbox-indeterminate": {
      color: "#059669",
    },
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "1px solid #e4e4e7",
    backgroundColor: "#fafafa",
  },
  "& .MuiTablePagination-root": {
    fontSize: "0.75rem",
  },
};
