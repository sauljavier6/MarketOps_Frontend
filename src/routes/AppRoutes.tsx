import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import DashboardPage from "../pages/DashboardPage";
import DataSourcesPage from "../pages/DataSourcesPage";
import FinancePage from "../pages/FinancePage";
import InventoryPage from "../pages/InventoryPage";
import LearningPage from "../pages/LearningPage";
import ListingsPage from "../pages/ListingsPage";
import OperationsPage from "../pages/OperationsPage";
import PortfolioPage from "../pages/PortfolioPage";
import ProductsPage from "../pages/ProductsPage";
import PurchasesPage from "../pages/PurchasesPage";
import RadarPage from "../pages/RadarPage";
import ReplenishmentPage from "../pages/ReplenishmentPage";
import SettingsPage from "../pages/SettingsPage";
import SupplierDiscoveryPage from "../pages/SupplierDiscoveryPage";
import SuppliersPage from "../pages/SuppliersPage";

const router = createBrowserRouter([{
  path: "/",
  element: <AppLayout />,
  children: [
    { index: true, element: <DashboardPage /> },
    { path: "radar", element: <RadarPage /> },
    { path: "portfolio", element: <PortfolioPage /> },
    {
      path: "purchases",
      element: <OperationsPage />,
      children: [
        { index: true, element: <PurchasesPage /> },
        { path: "inventory", element: <InventoryPage /> },
        { path: "replenishment", element: <ReplenishmentPage /> },
      ],
    },
    { path: "inventory", element: <Navigate to="/purchases/inventory" replace /> },
    { path: "replenishment", element: <Navigate to="/purchases/replenishment" replace /> },
    { path: "products", element: <ProductsPage /> },
    { path: "suppliers", element: <SuppliersPage /> },
    { path: "sourcing", element: <SupplierDiscoveryPage /> },
    { path: "learning", element: <LearningPage /> },
    { path: "finance", element: <FinancePage /> },
    { path: "listings", element: <ListingsPage /> },
    { path: "data-sources", element: <DataSourcesPage /> },
    { path: "settings", element: <SettingsPage /> },
  ],
}]);

export default function AppRoutes() { return <RouterProvider router={router}/>; }
