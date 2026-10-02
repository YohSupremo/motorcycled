import { useState } from "react";

export const AdminReviews = () => {
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'active' | 'hidden'

  const [reviews, setReviews] = useState([
    {
      id: "REV-101",
      customer: "Mark Anthony Ramos",
      email: "mark.ramos@example.com",
      product: "Yamaha NMAX 155 ABS",
      rating: 5,
      title: "Smooth financing process & immediate release",
      body: "Digital screening was approved in less than 36 hours. The monthly amortization breakdown in the portal has zero hidden charges, and downpayment receipt was issued immediately upon turnover.",
      createdAt: "2026-08-14",
      isVerifiedPurchase: true, // Derived from Delivered order
      isHidden: false, // Admin moderation status
    },
    {
      id: "REV-102",
      customer: "Karlo Mendoza",
      email: "karlo.m@example.com",
      product: "Honda Click 125i (2026)",
      rating: 5,
      title: "Doorstep delivery with complete LTO papers",
      body: "Delivered straight to my doorstep in Quezon City complete with LTO registration papers and dealer warranty booklet. The pre-delivery checklist was thoroughly explained by the courier technician.",
      createdAt: "2026-09-02",
      isVerifiedPurchase: true,
      isHidden: false,
    },
    {
      id: "REV-103",
      customer: "Christian Bautista",
      email: "bautista.c@example.com",
      product: "Brembo 4-Piston Caliper + Sintered Pads",
      rating: 5,
      title: "Genuine OEM parts guaranteed",
      body: "Finding genuine OEM sprockets, sintered brake pads, and Motul 7100 oil under one roof used to be difficult. Motorshop's verified parts catalog and branch pickup in Cebu made maintenance seamless.",
      createdAt: "2026-07-29",
      isVerifiedPurchase: true,
      isHidden: false,
    },
    {
      id: "REV-104",
      customer: "Anonymous User",
      email: "guest_spammer@tempmail.com",
      product: "Kawasaki Ninja 400 SE",
      rating: 1,
      title: "Spam advertisement content",
      body: "Check out this alternative link for discounted counterfeit parts at scamwebsite.xyz with free delivery.",
      createdAt: "2026-09-21",
      isVerifiedPurchase: false,
      isHidden: true,
    },
  ]);

  const handleToggleHide = (reviewId) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, isHidden: !r.isHidden } : r))
    );
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterMode === "active") return !r.isHidden;
    if (filterMode === "hidden") return r.isHidden;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Customer Ratings & Review Moderation
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit customer product reviews, verify delivery history, and manage content visibility (<code className="font-mono text-zinc-600">reviews</code> collection).
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-md font-medium border transition-colors cursor-pointer ${
              filterMode === "all"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-2xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("active")}
            className={`px-3 py-1.5 rounded-md font-medium border transition-colors cursor-pointer ${
              filterMode === "active"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-2xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Public ({reviews.filter((r) => !r.isHidden).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("hidden")}
            className={`px-3 py-1.5 rounded-md font-medium border transition-colors cursor-pointer ${
              filterMode === "hidden"
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-2xs"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Hidden Moderated ({reviews.filter((r) => r.isHidden).length})
          </button>
        </div>
      </div>

      {/* Flat Reviews Table (NO CARDS) */}
      <div className="border border-zinc-200 bg-white overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-mono uppercase text-zinc-500">
                <th className="py-2.5 px-4 font-semibold">Review ID</th>
                <th className="py-2.5 px-4 font-semibold">Customer & Status</th>
                <th className="py-2.5 px-4 font-semibold">Reviewed Product</th>
                <th className="py-2.5 px-4 font-semibold">Rating</th>
                <th className="py-2.5 px-4 font-semibold">Review Content</th>
                <th className="py-2.5 px-4 font-semibold">Moderation State</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredReviews.map((r) => (
                <tr key={r.id} className={`hover:bg-zinc-50/70 transition-colors ${r.isHidden ? "opacity-60 bg-zinc-50/40" : ""}`}>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-900">{r.id}</td>
                  
                  <td className="py-3 px-4">
                    <p className="font-semibold text-zinc-900">{r.customer}</p>
                    <span className="font-mono text-[10px] text-zinc-400 block">{r.email}</span>
                    {r.isVerifiedPurchase ? (
                      <span className="inline-block mt-0.5 text-[9px] font-mono font-semibold px-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ✓ Verified Purchase
                      </span>
                    ) : (
                      <span className="inline-block mt-0.5 text-[9px] font-mono px-1 rounded bg-zinc-100 text-zinc-500">
                        Unverified
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-medium text-zinc-900">
                    {r.product}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center text-amber-500 text-sm">
                      {"★".repeat(r.rating)}
                      <span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <p className="font-bold text-zinc-900">{r.title}</p>
                    <p className="text-zinc-600 leading-relaxed mt-0.5 text-[11px] line-clamp-2">{r.body}</p>
                    <span className="text-[10px] font-mono text-zinc-400 block mt-1">Submitted: {r.createdAt}</span>
                  </td>

                  <td className="py-3 px-4">
                    {r.isHidden ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-800 border border-red-200">
                        Hidden from Store
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Publicly Displayed
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleHide(r.id)}
                      className={`!h-6 px-2.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                        r.isHidden
                          ? "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50"
                          : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {r.isHidden ? "Unhide Review" : "Hide Review"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
