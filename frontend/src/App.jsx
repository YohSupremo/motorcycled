import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Register } from "./assets/pages/Register";
import { Login } from "./assets/pages/Login";
import { loadUser } from "./actions/userActions";
import { Homepage } from "./assets/pages/customer/Homepage";
import { Shop } from "./assets/pages/customer/Shop";
import { Orders } from "./assets/pages/customer/Orders";
import { Profile } from "./assets/pages/customer/Profile";
import { Cart } from "./assets/pages/customer/Cart";
// import { Admin } from "./assets/pages/admin/Admin";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./assets/components/Layout";
import "./App.css";
import { AdminLayout } from "./assets/components/AdminLayout";
import { AdminDashboard } from "./assets/pages/admin/AdminDashboard";
import { AdminInventory } from "./assets/pages/admin/AdminInventory";
import { AdminOrders } from "./assets/pages/admin/AdminOrders";
import { AdminPayments } from "./assets/pages/admin/AdminPayments";
import { AdminProducts } from "./assets/pages/admin/AdminProducts";
import { AdminReviews } from "./assets/pages/admin/AdminReviews";
import { AdminSettings } from "./assets/pages/admin/AdminSettings";
function App() {
  const dispatch = useDispatch();

  // Restore the authenticated session (if any) from the JWT cookie on load.
  // Skipped when there's no session marker, avoiding a useless 401 call
  // (the cookie itself is httpOnly and invisible to JavaScript).
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
              path="/profile/verification"
              element={<Profile activeTab="verification" />}
            />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />}></Route>
            <Route path="/admin/inventory" element={<AdminInventory />}></Route>
            <Route path="/admin/orders" element={<AdminOrders />}></Route>
            <Route path="/admin/payments" element={<AdminPayments />}></Route>
            <Route path="/admin/products" element={<AdminProducts />}></Route>
            <Route path="/admin/reviews" element={<AdminReviews />}></Route>
            <Route path="/admin/settings" element={<AdminSettings />}></Route>
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
