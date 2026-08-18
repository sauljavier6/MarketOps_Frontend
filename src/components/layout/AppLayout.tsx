import { useQuery } from "@tanstack/react-query";
import { BarChart3, Boxes, BrainCircuit, CircleDollarSign, Database, PackagePlus, PackageSearch, PieChart, Radar, Search, Settings, ShoppingCart, Store, Truck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { getCapital } from "../../api/marketOpsApi";

const items = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/radar", label: "Radar", icon: Radar },
  { to: "/portfolio", label: "Cartera", icon: PieChart },
  { to: "/products", label: "Productos", icon: PackageSearch },
  { to: "/purchases", label: "Compras", icon: ShoppingCart },
  { to: "/suppliers", label: "Proveedores", icon: Truck },
  { to: "/sourcing", label: "Sourcing", icon: Search },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/replenishment", label: "Reabastecer", icon: PackagePlus },
  { to: "/learning", label: "Aprendizaje", icon: BrainCircuit },
  { to: "/listings", label: "Publicaciones", icon: Store },
  { to: "/finance", label: "Finanzas", icon: CircleDollarSign },
  { to: "/data-sources", label: "Fuentes", icon: Database },
  { to: "/settings", label: "Configuración", icon: Settings },
];

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(value || 0));

export default function AppLayout() {
  const capital = useQuery({ queryKey: ["capital"], queryFn: getCapital });

  return <div className="shell">
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand"><div className="brand-mark">M</div><div><strong>MarketOps</strong><span>Commerce Intelligence</span></div></div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}><Icon size={18}/>{label}</NavLink>)}
      </nav>

      <div className="sidebar-footer">
        <div className="capital-card">
          <span>Capital disponible</span>
          <strong>{capital.isLoading ? "—" : money(capital.data?.currentCash || 0)}</strong>
          <small>Presupuesto total: {capital.isLoading ? "—" : money(capital.data?.initialCapital || 0)}</small>
        </div>
      </div>
    </aside>
    <main className="content"><Outlet/></main>
  </div>;
}
