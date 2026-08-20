import { Boxes, PackagePlus, RefreshCw } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/purchases", label: "Compras", icon: PackagePlus, end: true },
  { to: "/purchases/inventory", label: "Inventario", icon: Boxes },
  { to: "/purchases/replenishment", label: "Reabastecimiento", icon: RefreshCw },
];

export default function OperationsPage() {
  return <div>
    <header className="page-header">
      <div>
        <p className="eyebrow">OPERACIÓN</p>
        <h1>Compras e inventario</h1>
        <p className="subtitle">Administra lo que compras, lo que tienes disponible y cuándo conviene volver a abastecer.</p>
      </div>
    </header>

    <nav className="operation-tabs" aria-label="Secciones de operación">
      {tabs.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? "operation-tab active" : "operation-tab"}><Icon size={16}/>{label}</NavLink>)}
    </nav>

    <Outlet/>
  </div>;
}
