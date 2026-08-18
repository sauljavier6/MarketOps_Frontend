import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import DashboardPage from "../pages/DashboardPage";
import FinancePage from "../pages/FinancePage";
import InventoryPage from "../pages/InventoryPage";
import ProductsPage from "../pages/ProductsPage";
import PurchasesPage from "../pages/PurchasesPage";
import RadarPage from "../pages/RadarPage";
import SettingsPage from "../pages/SettingsPage";
import ListingsPage from "../pages/ListingsPage";
import SuppliersPage from "../pages/SuppliersPage";
import DataSourcesPage from "../pages/DataSourcesPage";
import SupplierDiscoveryPage from "../pages/SupplierDiscoveryPage";
import PortfolioPage from "../pages/PortfolioPage";
import ReplenishmentPage from "../pages/ReplenishmentPage";
import LearningPage from "../pages/LearningPage";

const router = createBrowserRouter([{
  path: "/",
  element: <AppLayout />,
  children: [
    { index: true, element: <DashboardPage /> },
    { path: "radar", element: <RadarPage /> },
    { path: "portfolio", element: <PortfolioPage /> },
    { path: "products", element: <ProductsPage /> },
    { path: "purchases", element: <PurchasesPage /> },
    { path: "suppliers", element: <SuppliersPage /> },
    { path: "sourcing", element: <SupplierDiscoveryPage /> },
    { path: "inventory", element: <InventoryPage /> },
    { path: "replenishment", element: <ReplenishmentPage /> },
    { path: "learning", element: <LearningPage /> },
    { path: "finance", element: <FinancePage /> },
    { path: "listings", element: <ListingsPage /> },
    { path: "data-sources", element: <DataSourcesPage /> },
    { path: "settings", element: <SettingsPage /> },
  ],
}]);

export default function AppRoutes() { return <RouterProvider router={router}/>; }
