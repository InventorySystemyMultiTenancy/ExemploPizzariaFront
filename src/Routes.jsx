import { Navigate, Route, Routes } from "react-router-dom";
import AdminPanelPage from "./pages/AdminPanelPage.jsx";
import AdminProductsPage from "./pages/AdminProductsPage.jsx";
import SalesAnalyticsPage from "./pages/SalesAnalyticsPage.jsx";
import CardapioPage from "./pages/CardapioPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import ClientDashboardPage from "./pages/ClientDashboardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import KitchenPage from "./pages/KitchenPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PrivateRoute from "./routes/PrivateRoute.js";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cardapio" element={<CardapioPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />

      <Route element={<PrivateRoute allowedRoles={["CLIENTE"]} />}>
        <Route path="/dashboard" element={<ClientDashboardPage />} />
      </Route>

      <Route
        element={
          <PrivateRoute allowedRoles={["COZINHA", "ADMIN", "FUNCIONARIO"]} />
        }
      >
        <Route path="/cozinha" element={<KitchenPage />} />
      </Route>

      <Route element={<PrivateRoute allowedRoles={["ADMIN", "FUNCIONARIO"]} />}>
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="/admin/produtos" element={<AdminProductsPage />} />
        <Route path="/admin/vendas" element={<SalesAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
