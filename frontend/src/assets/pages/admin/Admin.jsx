// import { useState } from "react";
// import { AdminLayout } from "../../components/AdminLayout";
// import { AdminDashboard } from "./AdminDashboard";
// import { AdminProducts } from "./AdminProducts";
// import { AdminOrders } from "./AdminOrders";
// import { AdminPayments } from "./AdminPayments";
// import { AdminInventory } from "./AdminInventory";
// import { AdminReviews } from "./AdminReviews";
// import { AdminSettings } from "./AdminSettings";

// export const Admin = ({ onNavigate, defaultTab = "dashboard" }) => {
//   const [activeTab, setActiveTab] = useState(defaultTab);
//   const [selectedOrderId, setSelectedOrderId] = useState(null);

//   const handleSelectOrder = (orderId) => {
//     setSelectedOrderId(orderId);
//   };

//   return (
//     <AdminLayout
//       activeTab={activeTab}
//       onTabChange={setActiveTab}
//       onNavigate={onNavigate}
//     >
//       {activeTab === "dashboard" && (
//         <AdminDashboard
//           onNavigateTab={setActiveTab}
//           onSelectOrder={handleSelectOrder}
//         />
//       )}
//       {activeTab === "orders" && (
//         <AdminOrders initialSelectedOrderId={selectedOrderId} />
//       )}
//       {activeTab === "products" && <AdminProducts />}
//       {activeTab === "payments" && <AdminPayments />}
//       {activeTab === "inventory" && <AdminInventory />}
//       {activeTab === "reviews" && <AdminReviews />}
//       {activeTab === "settings" && <AdminSettings />}
//     </AdminLayout>
//   );
// };
