import React from "react";

/**
 * ProductImagePlaceholder Component
 * Provides clean, automotive-grade OEM schematic placeholders
 * tailored to motorcycle models, engine components, brakes, tires, gear, and lubricants.
 */
export function ProductImagePlaceholder({
  category = "Motorcycles",
  name = "",
  brand = "",
  compact = false,
  className = "",
}) {
  const normCategory = (category || "").toLowerCase();

  // Category specific icons
  const renderIcon = () => {
    if (
      normCategory.includes("motorcycle") ||
      normCategory.includes("scooter") ||
      normCategory.includes("sportbike") ||
      normCategory.includes("units")
    ) {
      // Motorcycle silhouette with wheels & frame
      return (
        <svg
          className={compact ? "w-5 h-5 text-zinc-600" : "w-12 h-12 text-zinc-500"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Back wheel */}
          <circle cx="5.5" cy="17.5" r="3.5" />
          {/* Front wheel */}
          <circle cx="18.5" cy="17.5" r="3.5" />
          {/* Chassis & frame */}
          <path d="M15 6h-2.5l-3 5.5H5.5L8 14h7l3.5-6.5h-4" />
          <path d="M9.5 11.5L12 17.5" />
          {/* Handlebars */}
          <path d="M15 6l2-2.5h2" />
        </svg>
      );
    }

    if (normCategory.includes("engine") || normCategory.includes("transmission")) {
      // Mechanical gear / transmission
      return (
        <svg
          className={compact ? "w-5 h-5 text-zinc-600" : "w-12 h-12 text-zinc-500"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    }

    if (normCategory.includes("brake")) {
      // Ventilated disc brake rotor
      return (
        <svg
          className={compact ? "w-5 h-5 text-zinc-600" : "w-12 h-12 text-zinc-500"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="12" cy="6.5" r="0.75" fill="currentColor" />
          <circle cx="12" cy="17.5" r="0.75" fill="currentColor" />
          <circle cx="6.5" cy="12" r="0.75" fill="currentColor" />
          <circle cx="17.5" cy="12" r="0.75" fill="currentColor" />
          <path d="M14 3a9 9 0 0 1 7 7" strokeWidth="2.5" />
        </svg>
      );
    }

    if (normCategory.includes("tire") || normCategory.includes("wheel")) {
      // Alloy wheel / tire
      return (
        <svg
          className={compact ? "w-5 h-5 text-zinc-600" : "w-12 h-12 text-zinc-500"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9.5" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
          <line x1="12" y1="2.5" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="21.5" y2="12" />
        </svg>
      );
    }

    if (normCategory.includes("helmet") || normCategory.includes("gear") || normCategory.includes("protection")) {
      // Full face helmet
      return (
        <svg
          className={compact ? "w-5 h-5 text-zinc-600" : "w-12 h-12 text-zinc-500"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 14a8 8 0 0 1 16 0v2a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-2z" />
          <path d="M7 13h9a2 2 0 0 1 2 2v1H7v-3z" />
          <circle cx="18" cy="14" r="1" fill="currentColor" />
        </svg>
      );
    }

    if (normCategory.includes("oil") || normCategory.includes("lubricant")) {
      // Lubricant canister
      return (
        <svg
          className={compact ? "w-5 h-5 text-zinc-600" : "w-12 h-12 text-zinc-500"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 8h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
          <path d="M7 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
          <path d="M17 12l3-2v4l-3-1" />
          <circle cx="10" cy="15" r="1.5" />
        </svg>
      );
    }

    // Default OEM Part schematic
    return (
      <svg
        className={compact ? "w-5 h-5 text-zinc-600" : "w-12 h-12 text-zinc-500"}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  };

  if (compact) {
    return (
      <div
        className={`w-full h-full bg-zinc-100 flex items-center justify-center relative select-none overflow-hidden ${className}`}
        title={name || "Product Item"}
      >
        {renderIcon()}
      </div>
    );
  }

  // Full card header placeholder (Grid view)
  return (
    <div
      className={`w-full h-40 bg-linear-to-b from-zinc-100 to-zinc-200/70 flex flex-col items-center justify-center relative select-none overflow-hidden group ${className}`}
    >
      {/* Blueprint Grid Lines Pattern */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #d4d4d8 1px, transparent 1px), linear-gradient(to bottom, #d4d4d8 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Top Meta Chips */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-wider z-10">
        <span className="bg-white/90 border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded shadow-2xs font-semibold">
          {brand || "OEM"}
        </span>
        <span className="text-zinc-400 font-medium">
          {category}
        </span>
      </div>

      {/* Central Graphic */}
      <div className="relative z-10 flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <div className="p-3 rounded-full bg-white/80 shadow-2xs border border-zinc-200/80 mb-1 text-zinc-700">
          {renderIcon()}
        </div>
        <span className="text-[10px] font-mono text-zinc-500 tracking-tight font-medium">
          GENUINE SPECIFICATION
        </span>
      </div>

      {/* Subtle Corner Caliper Watermark */}
      <div className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-400 tracking-widest pointer-events-none opacity-60">
        2026•CATALOG
      </div>
    </div>
  );
}
