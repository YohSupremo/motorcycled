import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProductDetails, clearErrors } from "../../../actions/productActions";
import { addToCart } from "../../../actions/cartActions";
import { ProductImagePlaceholder } from "../../components/ProductImagePlaceholder";
import { ScrollReveal } from "../../components/ScrollReveal";

// Reference: itcp318-s3a-2026/frontend/src/Components/Product/ProductDetails.jsx
// Styled with Dealership & OEM aesthetic (zinc/emerald, monospace technical badges)
export const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, product } = useSelector(
    (state) => state.productDetails || {}
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState("");

  useEffect(() => {
    dispatch(getProductDetails(id));
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch, id]);

  const images = product?.images || [];
  const activeImage = images[selectedImageIndex]?.url;
  const categoryName = product?.category?.name || product?.category || "General";
  const brandName = product?.brand?.name || product?.brand || "OEM";
  const inStock = product?.stock || 0;

  // Financing calculation
  const minDown = Number(
    product?.minInstallmentPrice || (product?.price ? product.price * 0.2 : 0)
  );
  const financedAmount = Math.max(0, (product?.price || 0) - minDown);
  const monthlyEstimate = Math.round((financedAmount * 1.1) / 12);

  const handleIncreaseQty = () => {
    const current = Number(quantity) || 1;
    if (current < inStock) setQuantity(current + 1);
  };

  const handleDecreaseQty = () => {
    const current = Number(quantity) || 1;
    if (current > 1) setQuantity(current - 1);
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (num < 1) {
      setQuantity(1);
    } else if (inStock > 0 && num > inStock) {
      setQuantity(inStock);
    } else {
      setQuantity(num);
    }
  };

  const handleQuantityBlur = () => {
    const num = Number(quantity);
    if (!num || num < 1) {
      setQuantity(1);
    } else if (inStock > 0 && num > inStock) {
      setQuantity(inStock);
    }
  };


  const handleAddToCart = () => {
    const finalQty = Number(quantity) || 1;
    setQuantity(finalQty);
    dispatch(addToCart(product._id, finalQty));
    setAddedNotice(`Added ${finalQty} × "${product.name}" to cart!`);
    setTimeout(() => setAddedNotice(""), 3000);
  };


  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center py-16">
        <div className="max-w-5xl w-full mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="w-full h-96 bg-zinc-100 rounded-lg" />
          <div className="space-y-4">
            <div className="h-4 bg-zinc-100 rounded w-1/4" />
            <div className="h-8 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-1/2" />
            <div className="h-12 bg-zinc-100 rounded w-1/3" />
            <div className="h-24 bg-zinc-100 rounded w-full" />
            <div className="h-10 bg-zinc-100 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !product._id) {
    return (
      <div className="min-h-[60vh] bg-white flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center space-y-4 border border-zinc-200 rounded-lg p-8 bg-zinc-50">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">
            !
          </div>
          <h2 className="text-lg font-bold text-zinc-900">Product Not Found</h2>
          <p className="text-xs text-zinc-600">
            {error || "The requested product unit or part could not be located in our dealership database."}
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-4 py-2 rounded bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              &larr; Back to Shop Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-lg shadow-lg border border-emerald-700 text-xs flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{addedNotice}</span>
          <Link
            to="/cart"
            className="ml-2 font-bold underline text-white hover:text-emerald-200"
          >
            View Cart &rarr;
          </Link>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Link to="/" className="hover:text-zinc-900 transition-colors">
            Showroom
          </Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-zinc-900 transition-colors">
            Catalog
          </Link>
          <span>/</span>
          <Link
            to={`/shop?category=${encodeURIComponent(categoryName)}`}
            className="hover:text-zinc-900 transition-colors"
          >
            {categoryName}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold truncate max-w-xs">
            {product.name}
          </span>
        </nav>

        {/* Product Core Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-3">
            <div className="w-full aspect-4/3 rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden relative flex items-center justify-center group select-none">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-contain object-center transition-all duration-200"
                />
              ) : (
                <ProductImagePlaceholder
                  category={categoryName}
                  name={product.name}
                  brand={brandName}
                />
              )}

              {/* Status Pill */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-1 rounded font-semibold border ${
                    inStock === 0
                      ? "bg-red-50 text-red-800 border-red-200"
                      : inStock <= 3
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {inStock === 0 ? "Out of Stock" : `${inStock} Available in Inventory`}
                </span>
              </div>

              {/* Prev / Next Navigation Buttons on Image Frame */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-md border border-zinc-200 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer z-10 backdrop-blur-xs"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-md border border-zinc-200 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer z-10 backdrop-blur-xs"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Photo Counter Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded z-10">
                    {selectedImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Row - Fixed 4 slots max, NO ugly horizontal scrollbar */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2.5">
                {images.length <= 4 ? (
                  images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`aspect-square rounded-md border overflow-hidden transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-emerald-600 ring-2 ring-emerald-600/30"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))
                ) : (
                  <>
                    {/* First 3 Thumbnails */}
                    {images.slice(0, 3).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`aspect-square rounded-md border overflow-hidden transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-emerald-600 ring-2 ring-emerald-600/30"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}

                    {/* 4th Thumbnail Overlapped with + Sign */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedImageIndex < 3) {
                          setSelectedImageIndex(3);
                        } else {
                          setSelectedImageIndex((selectedImageIndex + 1) % images.length);
                        }
                      }}
                      className={`aspect-square rounded-md border overflow-hidden relative transition-all cursor-pointer group ${
                        selectedImageIndex >= 3
                          ? "border-emerald-600 ring-2 ring-emerald-600/30"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <img
                        src={
                          selectedImageIndex >= 3
                            ? images[selectedImageIndex].url
                            : images[3].url
                        }
                        alt={`${product.name} 4th and more`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex flex-col items-center justify-center text-white transition-colors group-hover:bg-black/55">
                        <span className="text-base sm:text-lg font-extrabold tracking-tight">
                          +{images.length - 3}
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-300">
                          Photos
                        </span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Spec & Action Panel */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2 border-b border-zinc-200 pb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {brandName}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  • {categoryName}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Ratings Summary (Reference: itcp318-s3a-2026/frontend/src/Components/Product/ProductDetails.jsx) */}
              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-600 font-mono">
                <div className="flex items-center text-amber-400">
                  {"★".repeat(Math.round(product.ratings || 5))}
                  {"☆".repeat(5 - Math.round(product.ratings || 5))}
                </div>
                <span>
                  {(product.ratings || 5).toFixed(1)} ({product.numOfReviews || 0} reviews)
                </span>
                <span>•</span>
                <span className="text-zinc-500">
                  ID: <span className="font-mono text-zinc-700">{product._id.slice(-8)}</span>
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
                    Cash / SRP Price (VAT Inc.)
                  </span>
                  <span className="text-3xl font-extrabold text-zinc-900 font-mono">
                    ₱{Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    Inventory Status
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      inStock > 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {inStock > 0 ? `In Stock (${inStock} units)` : "Temporarily Sold Out"}
                  </span>
                </div>
              </div>

              {/* Installment Financing Breakdown */}
              {product.installmentEligible && (
                <div className="pt-3 border-t border-zinc-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-emerald-900">
                    <span>In-House Financing Estimate (12 mos):</span>
                    <span className="font-mono">₱{monthlyEstimate.toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500 text-[11px] font-mono">
                    <span>Minimum Required Downpayment:</span>
                    <span>₱{minDown.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Compatible Models */}
            {product.compatibleModels && product.compatibleModels.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                  OEM Fit & Compatibility
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.compatibleModels.map((model, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 text-xs font-mono border border-zinc-200"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
                Overview & Description
              </span>
              <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">
                {product.description || "Official dealership motorcycle component or unit meeting OEM standards."}
              </p>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-zinc-300 rounded-md overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={handleDecreaseQty}
                    disabled={Number(quantity) <= 1}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold text-sm transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={inStock > 0 ? inStock : 1}
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    aria-label="Quantity"
                    className="w-14 h-9 text-center text-xs font-mono font-bold text-zinc-900 border-x border-zinc-200 focus:outline-none focus:bg-emerald-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={handleIncreaseQty}
                    disabled={Number(quantity) >= inStock}
                    aria-label="Increase quantity"
                    className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Max available: {inStock}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={inStock === 0}
                  onClick={handleAddToCart}
                  className="flex-1 h-11 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  {inStock === 0 ? "Sold Out" : "Add to Order Cart"}
                </button>

                {product.installmentEligible && (
                  <button
                    type="button"
                    onClick={() => navigate("/orders")}
                    className="h-11 px-5 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply for Financing
                  </button>
                )}
              </div>
            </div>

            {/* Dealership Assurance Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-200 text-xs">
              <div className="flex items-start gap-2 text-zinc-600">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <span className="font-semibold text-zinc-900 block">Official Dealership Release</span>
                  <span className="text-[11px] text-zinc-500">100% Genuine OEM with factory serial</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-zinc-600">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <span className="font-semibold text-zinc-900 block">Nationwide Delivery & Pickup</span>
                  <span className="text-[11px] text-zinc-500">Pick up at local hub or secure doorstep courier</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Technical Specifications Table */}
        <section className="pt-8 border-t border-zinc-200 space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Dealership Technical Specifications
          </h2>
          <div className="border border-zinc-200 rounded-md overflow-hidden bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-zinc-200">
                <tr className="bg-zinc-50/50">
                  <td className="py-2.5 px-4 font-mono font-semibold text-zinc-600 w-1/3">
                    Part / Unit Name
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">{product.name}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-semibold text-zinc-600">
                    Manufacturer / Brand
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">{brandName}</td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-2.5 px-4 font-mono font-semibold text-zinc-600">
                    Category Classification
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">{categoryName}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-semibold text-zinc-600">
                    Inventory Stock Count
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900 font-mono">
                    {product.stock} units
                  </td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="py-2.5 px-4 font-mono font-semibold text-zinc-600">
                    Installment Financing
                  </td>
                  <td className="py-2.5 px-4 text-zinc-900">
                    {product.installmentEligible ? "Supported (3, 6, 12, 24 mos)" : "Cash / Straight Payment Only"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-semibold text-zinc-600">
                    Internal System Ref
                  </td>
                  <td className="py-2.5 px-4 text-zinc-500 font-mono">{product._id}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductDetails;
