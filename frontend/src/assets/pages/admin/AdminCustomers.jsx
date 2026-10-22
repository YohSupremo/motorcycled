import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { adminDataGridSx } from "../../../utils/adminDataGridTheme";

const api = import.meta.env.VITE_API;
const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  contactNumber: "",
  password: "",
  role: "customer",
};

const buildCustomerSchema = (isEditing) =>
  yup.object({
    firstName: yup.string().trim().required("First name is required"),
    lastName: yup.string().trim().required("Last name is required"),
    email: yup
      .string()
      .trim()
      .required("Email is required")
      .email("Enter a valid email address"),
    contactNumber: yup
      .string()
      .trim()
      .test(
        "valid-mobile",
        "Enter an 11-digit mobile number (09XXXXXXXXX)",
        (value) => !value || /^09\d{9}$/.test(value.replace(/[\s-]/g, "")),
      ),
    password: isEditing
      ? yup
          .string()
          .trim()
          .test(
            "min-if-present",
            "Password must be at least 8 characters",
            (value) => !value || value.length >= 8,
          )
      : yup
          .string()
          .trim()
          .required("Password is required")
          .min(8, "Password must be at least 8 characters"),
    role: yup
      .string()
      .oneOf(["customer", "admin"], "Select a valid role")
      .required(),
  });

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export const AdminCustomers = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const customerSchema = useMemo(
    () => buildCustomerSchema(Boolean(editingCustomer)),
    [editingCustomer],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(customerSchema),
    defaultValues: emptyForm,
  });

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${api}/admin/customers`, {
        params: {
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchQuery.trim() || undefined,
        },
        withCredentials: true,
      });
      setCustomers(data.customers || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(loadCustomers, 250);
    return () => clearTimeout(timeoutId);
  }, [loadCustomers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    reset({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = useCallback(
    (customer) => {
      setEditingCustomer(customer);
      reset({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        contactNumber: customer.contactNumber || "",
        password: "",
        role: customer.role || "customer",
      });
      setIsModalOpen(true);
    },
    [reset],
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    reset({ ...emptyForm });
  };

  const handleSaveCustomer = async (data) => {
    setActionLoading(true);
    try {
      const payload = { ...data };
      if (editingCustomer && !payload.password) delete payload.password;

      if (editingCustomer) {
        await axios.put(`${api}/admin/customers/${editingCustomer._id}`, payload, {
          withCredentials: true,
        });
        toast.success("User account updated.");
      } else {
        await axios.post(`${api}/admin/customers`, payload, {
          withCredentials: true,
        });
        toast.success("User account created.");
      }

      closeModal();
      await loadCustomers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = useCallback(async (customer) => {
    const isActive = Boolean(customer.isActive);
    const action = isActive ? "deactivate" : "reactivate";
    const result = await Swal.fire({
      icon: isActive ? "warning" : "question",
      title: `${isActive ? "Deactivate" : "Reactivate"} user account?`,
      html: `<p class="text-sm text-zinc-600">This will ${action} <strong>${customer.email}</strong>.</p>${
        isActive
          ? '<p class="mt-2 text-xs text-zinc-500">The user will not be able to sign in until the account is reactivated.</p>'
          : '<p class="mt-2 text-xs text-zinc-500">The user will be able to sign in again.</p>'
      }`,
      showCancelButton: true,
      confirmButtonText: isActive ? "Deactivate account" : "Reactivate account",
      cancelButtonText: "Keep account",
      reverseButtons: true,
      focusCancel: true,
      buttonsStyling: false,
      customClass: {
        popup: "rounded-xl border border-zinc-200 shadow-xl",
        title: "text-base font-bold text-zinc-900",
        htmlContainer: "text-left",
        actions: "gap-2",
        confirmButton: `rounded-md px-3.5 py-2 text-xs font-semibold text-white ${
          isActive
            ? "bg-rose-600 hover:bg-rose-700"
            : "bg-emerald-700 hover:bg-emerald-800"
        }`,
        cancelButton: "rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.patch(
        `${api}/admin/customers/${customer._id}/${isActive ? "deactivate" : "reactivate"}`,
        {},
        { withCredentials: true },
      );
      toast.success(`User account ${isActive ? "deactivated" : "reactivated"}.`);
      await loadCustomers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  }, [loadCustomers]);

  const columns = useMemo(
    () => [
      {
        field: "customer",
        headerName: "User",
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
        renderCell: (params) => (
          <div className="flex min-w-0 w-full flex-col justify-center leading-tight">
            <span className="truncate font-semibold text-zinc-900" title={`${params.row.firstName} ${params.row.lastName}`}>
              {params.row.firstName} {params.row.lastName}
            </span>
            <span className="mt-1 truncate text-[11px] font-mono text-zinc-500" title={params.row.email}>
              {params.row.email}
            </span>
          </div>
        ),
      },
      {
        field: "contactNumber",
        headerName: "Contact",
        width: 150,
        renderCell: (params) => (
          <span className="truncate text-xs text-zinc-600">{params.row.contactNumber || "No contact number"}</span>
        ),
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 130,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => (
          <span
            className={`admin-table-badge gap-1.5 text-[11px] font-medium ${
              params.row.isActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200"
            }`}
          >
            <span className={`admin-table-badge__dot h-1.5 w-1.5 rounded-full ${params.row.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
            {params.row.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        field: "role",
        headerName: "Role",
        width: 120,
        headerAlign: "center",
        align: "center",
        renderCell: (params) => (
          <span
            className={`admin-table-badge text-[11px] font-semibold ${
              params.row.role === "admin"
                ? "border border-amber-200 bg-amber-50 text-amber-700"
                : "border border-zinc-200 bg-zinc-100 text-zinc-600"
            }`}
          >
            {params.row.role === "admin" ? "Admin" : "Customer"}
          </span>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        headerAlign: "right",
        align: "right",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <div className="inline-flex w-full items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => openEditModal(params.row)}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-600 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 cursor-pointer"
              title="Edit user"
              aria-label="Edit user"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(params.row)}
              disabled={actionLoading || params.row._id === currentUser?._id}
              className={`inline-flex h-7 w-7 items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                params.row.isActive
                  ? "border-rose-200 bg-rose-50/50 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
                  : "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
              title={
                params.row._id === currentUser?._id
                  ? "You cannot deactivate your own account"
                  : params.row.isActive
                    ? "Deactivate user"
                    : "Reactivate user"
              }
              aria-label={
                params.row._id === currentUser?._id
                  ? "You cannot deactivate your own account"
                  : params.row.isActive
                    ? "Deactivate user"
                    : "Reactivate user"
              }
            >
              {params.row.isActive ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2v10" />
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              )}
            </button>
          </div>
        ),
      },
    ],
    [actionLoading, currentUser?._id, handleStatusChange, openEditModal],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            User Management
          </p>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">User Management</h1>
          <p className="mt-1 text-xs text-zinc-500">Create users, edit roles, and manage account access.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-700 px-3.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:ring-offset-2 cursor-pointer"
        >
          <span className="text-base font-normal leading-none">+</span>
          Add User
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search name, email, or contact number..."
          className="h-9 w-full max-w-md rounded border border-zinc-300 bg-white px-3 text-xs focus:border-emerald-600 focus:outline-none"
        />
        <div className="flex gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-1 text-xs">
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded px-3 py-1.5 capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600/20 cursor-pointer ${
                  statusFilter === status ? "bg-white font-semibold text-emerald-800 shadow-2xs ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <DataGrid
          rows={customers}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          rowHeight={68}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={adminDataGridSx}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4">
          <form
            onSubmit={handleSubmit(handleSaveCustomer)}
            noValidate
            className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">{editingCustomer ? "Edit User" : "Create User"}</h2>
                <p className="mt-0.5 text-[11px] text-zinc-500">Manage profile details, role, and account access.</p>
              </div>
              <button type="button" onClick={closeModal} className="inline-flex h-7 w-7 items-center justify-center rounded text-xl leading-none text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 cursor-pointer" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 text-xs sm:grid-cols-2">
              {[
                { name: "firstName", label: "First name", required: true },
                { name: "lastName", label: "Last name", required: true },
                { name: "email", label: "Email", required: true, type: "email" },
                { name: "contactNumber", label: "Contact number", required: false },
              ].map(({ name, label, required, type = "text" }) => (
                <label key={name} className="space-y-1">
                  <span className="font-semibold text-zinc-800">{label}{required ? " *" : ""}</span>
                  <input
                    {...register(name)}
                    type={type}
                    className={`h-9 w-full rounded border px-2.5 focus:outline-none ${
                      errors[name]
                        ? "border-red-500"
                        : "border-zinc-300 focus:border-emerald-600"
                    }`}
                  />
                  {errors[name] && (
                    <p className="text-[11px] text-red-600">{errors[name].message}</p>
                  )}
                </label>
              ))}
              <label className="space-y-1 sm:col-span-2">
                <span className="font-semibold text-zinc-800">Password {editingCustomer ? "(leave blank to keep current)" : "*"}</span>
                <input
                  {...register("password")}
                  type="password"
                  className={`h-9 w-full rounded border px-2.5 focus:outline-none ${
                    errors.password
                      ? "border-red-500"
                      : "border-zinc-300 focus:border-emerald-600"
                  }`}
                />
                {errors.password && (
                  <p className="text-[11px] text-red-600">{errors.password.message}</p>
                )}
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-zinc-800">Role *</span>
                <select
                  {...register("role")}
                  disabled={editingCustomer?._id === currentUser?._id}
                  className={`h-9 w-full rounded border bg-white px-2.5 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                    errors.role
                      ? "border-red-500"
                      : "border-zinc-300 focus:border-emerald-600"
                  }`}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="text-[11px] text-red-600">{errors.role.message}</p>
                )}
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
              <button type="button" onClick={closeModal} disabled={actionLoading} className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={actionLoading} className="inline-flex h-9 items-center rounded-md bg-emerald-700 px-3.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                {actionLoading ? "Saving..." : editingCustomer ? "Save Changes" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
