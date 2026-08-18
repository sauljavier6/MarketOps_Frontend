import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, TrendingUp } from "lucide-react";
import { getDashboard, getOpportunities } from "../api/marketOpsApi";
import { ErrorState, LoadingState } from "../components/ui/Feedback";
import MetricCard from "../components/ui/MetricCard";

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(value || 0));

export default function DashboardPage() {
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const opportunities = useQuery({ queryKey: ["opportunities"], queryFn: getOpportunities });

  if (dashboard.isLoading) return <LoadingState text="Cargando operación..."/>;
  if (dashboard.isError) return <ErrorState error={dashboard.error}/>;
  if (!dashboard.data?.capital) return <ErrorState error={new Error("La respuesta del dashboard no contiene información de capital. Revisa VITE_API_URL y el endpoint /api/dashboard.")}/>;

  const data = dashboard.data;
  const capital = data.capital;
  const rows = opportunities.data || [];

  return <div>
    <header className="page-header"><div><p className="eyebrow">OPERACIÓN ACTUAL</p><h1>Tu capital, trabajando.</h1><p className="subtitle">Los datos de esta pantalla ya vienen del backend.</p></div></header>

    <section className="metrics">
      <MetricCard label="Capital inicial" value={money(capital.initial)} helper="Base de operación"/>
      <MetricCard label="Disponible" value={money(capital.available)} helper="Efectivo líquido"/>
      <MetricCard label="Inventario" value={money(capital.inventoryValue)} helper="A costo promedio"/>
      <MetricCard label="Compras activas" value={String(data.activePurchases || 0)} helper="Ordenadas / tránsito"/>
    </section>

    <section className="dashboard-grid">
      <article className="panel opportunity-panel">
        <div className="panel-header"><div><p className="eyebrow">RADAR</p><h2>Oportunidades recomendadas</h2></div></div>
        {opportunities.isLoading ? <LoadingState/> : opportunities.isError ? <ErrorState error={opportunities.error}/> :
          <div className="op-table">
            <div className="op-row op-head"><span>Producto</span><span>Compra</span><span>Venta</span><span>Utilidad</span><span>Score</span><span></span></div>
            {rows.map((item) => <div className="op-row" key={item.id}><span><b>{item.title}</b><small>{item.season}</small></span><span>{money(item.purchasePrice)}</span><span>{money(item.salePrice)}</span><span className="positive">+{money(item.estimatedProfit)}</span><span><b className={item.score > 80 ? "score hot" : "score"}>{item.score}</b></span><span><button className="mini">{item.recommendation}</button></span></div>)}
          </div>
        }
      </article>

      <article className="panel dark-panel">
        <div className="trend-icon"><TrendingUp size={22}/></div><p className="eyebrow">ESTADO</p><h2>{data.season?.name || "Temporada"}</h2>
        <p>MarketOps ya puede reflejar capital, compras e inventario almacenados en PostgreSQL.</p>
        <div className="suggestion"><span>Efectivo disponible</span><strong>{money(capital.available)}</strong><small>{data.activePurchases || 0} compras activas</small></div>
        <button className="lime-btn" onClick={() => window.location.href = "/purchases"}><ShoppingBag size={16}/> Ir a compras</button>
      </article>
    </section>
  </div>;
}
