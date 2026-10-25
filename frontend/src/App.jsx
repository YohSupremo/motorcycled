import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { Register } from "./assets/pages/Register";
import { Login } from "./assets/pages/Login";
import { ForgotPassword } from "./assets/pages/ForgotPassword";
import { ResetPassword } from "./assets/pages/ResetPassword";
import { isDeactivationError, loadUser } from "./actions/userActions";
import { Homepage } from "./assets/pages/customer/Homepage";
import { Shop } from "./assets/pages/customer/Shop";
import { ProductDetails } from "./assets/pages/customer/ProductDetails";
import { Orders } from "./assets/pages/customer/Orders";
import { Profile } from "./assets/pages/customer/Profile";
import { Cart } from "./assets/pages/customer/Cart";
import { Shipping } from "./assets/pages/customer/Shipping";
import { ConfirmOrder } from "./assets/pages/customer/ConfirmOrder";
import { About } from "./assets/pages/customer/About";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "./assets/components/Layout";
import { ScrollToTop } from "./assets/components/ScrollToTop";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AdminLayout } from "./assets/components/AdminLayout";
import { AdminDashboard } from "./assets/pages/admin/AdminDashboard";
import { AdminInventory } from "./assets/pages/admin/AdminInventory";
import { AdminOrders } from "./assets/pages/admin/AdminOrders";
import { AdminPayments } from "./assets/pages/admin/AdminPayments";
import { AdminProducts } from "./assets/pages/admin/AdminProducts";
import { AdminCategories } from "./assets/pages/admin/AdminCategories";
import { AdminBrands } from "./assets/pages/admin/AdminBrands";
import { AdminReviews } from "./assets/pages/admin/AdminReviews";
import { AdminSettings } from "./assets/pages/admin/AdminSettings";
import { AdminCustomers } from "./assets/pages/admin/AdminCustomers";
import { AdminReports } from "./assets/pages/admin/AdminReports";
import { AdminCreditVerifications } from "./assets/pages/admin/AdminCreditVerifications";
import ProtectedRoute from "./assets/components/ProtectedRoute";
import { LOGOUT_SUCCESS } from "./constants/userConstants";

let deactivationHandlingPromise = null;

const DashboardRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  return <Navigate to={user?.role === "admin" ? "/admin/dashboard" : "/"} replace />;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (isDeactivationError(error) && !error?.config?.skipDeactivationRedirect) {
          if (!deactivationHandlingPromise) {
            const message = error.response.data.message;
            deactivationHandlingPromise = Swal.fire({
              icon: "warning",
              title: "Account deactivated",
              text: message,
              confirmButtonText: "Go to login",
              allowOutsideClick: false,
              allowEscapeKey: false,
              buttonsStyling: false,
              customClass: {
                popup: "rounded-xl border border-zinc-200 shadow-xl",
                title: "text-base font-bold text-zinc-900",
                htmlContainer: "text-sm text-zinc-600",
                confirmButton:
                  "rounded-md bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800",
              },
            }).then(() => {
              try {
                localStorage.removeItem("isLoggedIn");
              } catch {
                // Redux still clears the session if storage is unavailable.
              }
              dispatch({ type: LOGOUT_SUCCESS });
              window.location.assign("/login");
            });
          }
          await deactivationHandlingPromise;
        }
        return Promise.reject(error);
      },
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, [dispatch]);

  // Restore the authenticated session (if any) from the JWT cookie on load.
  // This effect runs after the interceptor setup above.
  useEffect(() => {
    let shouldLoad;
    try {
      shouldLoad = !!localStorage.getItem("isLoggedIn");
    } catch {
      shouldLoad = false;
    }
    if (shouldLoad) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Homepage />} />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/profile/personal-info"
              element={<Profile activeTab="profile" />}
            />
            <Route
              path="/profile/address"
              element={<Profile activeTab="address" />}
            />
            <Route
              path="/profile/security"
              element={<Profile activeTab="security" />}
            />
            <Route
              path="/profile/verification"
              element={<Profile activeTab="verification" />}
            />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/checkout/shipping"
              element={
                <ProtectedRoute>
                  <Shipping />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/confirm"
              element={
                <ProtectedRoute>
                  <ConfirmOrder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            {/* Compatibility aliases matching reference repo routes */}
            <Route path="/shipping" element={<Navigate to="/checkout/shipping" replace />} />
            <Route path="/confirm" element={<Navigate to="/checkout/confirm" replace />} />
            <Route path="/orders/me" element={<Navigate to="/orders" replace />} />
          </Route>

          {/* Admin routes — requires authenticated admin role
              Reference: itcp318-s3a-2026/frontend/src/Components/Route/ProtectedRoute.jsx */}
          <Route
            element={
              <ProtectedRoute isAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/credit-verifications" element={<AdminCreditVerifications />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/brands" element={<AdminBrands />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/password/reset/:token" element={<ResetPassword />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
        </Routes>
        <ToastContainer
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="text-xs font-sans font-medium"
        />
      </BrowserRouter>
    </>
  );
}

export default App;
