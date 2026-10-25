import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const api = import.meta.env.VITE_API;

const getErrorMessage = (error) =>
  error?.response?.data?.message || "Something went wrong";

const statusStyles = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
};

export const AdminCreditVerifications = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState([]);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadVerifications = useCallback(async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${api}/admin/credit-verifications`, {
        params: { status },
        withCredentials: true,
      });
      setVerifications(data.verifications || []);
    } catch (error) {
      if (
        error?.response?.status === 403 &&
        error?.response?.data?.message?.includes("Role")
      ) {
        navigate("/", { replace: true });
        return;
      }
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [navigate, status, user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    // Loading remote data is the synchronization this effect owns.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVerifications();
  }, [loadVerifications, user?.role]);

  const openDocuments = async (verification) => {
    try {
      const { data } = await axios.get(
        `${api}/admin/credit-verifications/${verification._id}`,
        { withCredentials: true },
      );
      setSelected(data.verification);
      setRejectionReason("");
    } catch (error) {
      if (
        error?.response?.status === 403 &&
        error?.response?.data?.message?.includes("Role")
      ) {
        navigate("/", { replace: true });
        return;
      }
      toast.error(getErrorMessage(error));
    }
  };

  const review = async (decision) => {
    if (!selected) return;
    if (decision === "reject" && !rejectionReason.trim()) {
      toast.error("Add a reason before rejecting this application.");
      return;
    }
    setActionLoading(true);
    try {
      await axios.put(
        `${api}/admin/credit-verifications/${selected._id}/${decision}`,
        decision === "reject" ? { rejectionReason } : {},
        { withCredentials: true },
      );
      toast.success(`Credit verification ${decision}d.`);
      setSelected(null);
      await loadVerifications();
    } catch (error) {
      if (
        error?.response?.status === 403 &&
        error?.response?.data?.message?.includes("Role")
      ) {
        navigate("/", { replace: true });
        return;
      }
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="min-h-full bg-zinc-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-zinc-900 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Customer & System
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950">
              Credit verification
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">
              Review customer identity and income documents before enabling
              installment financing.
            </p>
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-800"
          >
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr] gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span>Applicant</span>
            <span>Contact</span>
            <span>Submitted</span>
            <span className="text-right">Action</span>
          </div>
          {loading ? (
            <p className="p-8 text-center text-sm text-zinc-500">Loading records...</p>
          ) : verifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">
              No {status} credit verification records.
            </p>
          ) : (
            verifications.map((verification) => (
              <div
                key={verification._id}
                className="grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr] items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {verification.user?.firstName} {verification.user?.lastName}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{verification.user?.email}</p>
                </div>
                <p className="text-xs text-zinc-600">
                  {verification.user?.contactNumber || "No contact number"}
                </p>
                <div>
                  <p className="text-xs text-zinc-600">
                    {new Date(verification.createdAt).toLocaleDateString("en-PH")}
                  </p>
                  <span className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusStyles[verification.status]}`}>
                    {verification.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openDocuments(verification)}
                  className="justify-self-end rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-950">
                  {selected.user?.firstName} {selected.user?.lastName}
                </h2>
                <p className="text-xs text-zinc-500">{selected.user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Government ID", selected.governmentId],
                ["Proof of income", selected.proofOfIncome],
              ].map(([label, document]) => (
                <div key={label} className="rounded-lg border border-zinc-200 p-3">
                  <p className="mb-2 text-xs font-bold text-zinc-800">{label}</p>
                  {document?.url ? (
                    <a href={document.url} target="_blank" rel="noreferrer">
                      <img src={document.url} alt={label} className="h-56 w-full rounded-md object-contain bg-zinc-100" />
                    </a>
                  ) : (
                    <p className="flex h-56 items-center justify-center bg-zinc-50 text-xs text-zinc-500">
                      Document unavailable
                    </p>
                  )}
                </div>
              ))}
            </div>
            {selected.status === "pending" && (
              <div className="mt-5 border-t border-zinc-200 pt-4">
                <label className="block text-xs font-semibold text-zinc-700">
                  Rejection reason
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Required only when rejecting"
                    rows={2}
                    className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-xs"
                  />
                </label>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => review("reject")}
                    className="rounded-md border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => review("approve")}
                    className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    Approve verification
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
