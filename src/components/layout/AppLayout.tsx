import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Boxes, Menu, Radar, Settings, Store, Truck, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { getCapital } from "../../api/marketOpsApi";
import "./AppLayout.mobile.css";
import "./AppLayout.compact.css";

const operationItems = [
  { to: "/", label: "Inicio", icon: BarChart3 },
  { to: "/products", label: "Productos", icon: Boxes },
  { to: "/purchases", label: "Pedidos", icon: Store },
  { to: "/suppliers", label: "Proveedores", icon: Truck },
  { to: "/listings", label: "Mercado Libre", icon: Store },
];

const toolItems = [
  { to: "/radar", label: "Radar de oportunidades", icon: Radar },
];

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(value || 0));

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const capital = useQuery({ queryKey: ["capital"], queryFn: getCapital });
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const renderItem = ({ to, label, icon: Icon }: (typeof operationItems)[number]) => <NavLink key={to} to={to} end={to === "/"} onClick={closeMobileMenu} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}><Icon size={18}/>{label}</NavLink>;

  return <div className="shell">
    <header className="mobile-header">
      <div className="brand mobile-brand"><div className="brand-mark">M</div><div><strong>MarketOps</strong><span>Operación de dropshipping</span></div></div>
      <button className="mobile-menu-button" type="button" aria-label="Abrir menú" onClick={() => setMobileMenuOpen(true)}><Menu size={22}/></button>
    </header>

    {mobileMenuOpen && <button className="sidebar-backdrop" type="button" aria-label="Cerrar menú" onClick={closeMobileMenu}/>} 

    <aside className={mobileMenuOpen ? "sidebar mobile-open" : "sidebar"}>
      <div className="sidebar-header">
        <div className="brand"><div className="brand-mark">M</div><div><strong>MarketOps</strong><span>Operación de dropshipping</span></div></div>
        <button className="mobile-close-button" type="button" aria-label="Cerrar menú" onClick={closeMobileMenu}><X size={21}/></button>
      </div>

      <nav className="sidebar-nav">
        {operationItems.map(renderItem)}
        <div className="nav-section-label">Herramientas</div>
        {toolItems.map(renderItem)}
        <NavLink to="/settings" onClick={closeMobileMenu} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}><Settings size={18}/>Configuración</NavLink>
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
