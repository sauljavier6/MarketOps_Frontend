import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { getCapital, getInventory } from "../api/marketOpsApi";
import { ErrorState, LoadingState } from "../components/ui/Feedback";

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

export default function FinancePage() {
  const capital = useQuery({ queryKey: ["capital"], queryFn: getCapital });
  const inventory = useQuery({ queryKey: ["inventory"], queryFn: getInventory });

  if (capital.isLoading) return <LoadingState/>;
  if (capital.isError) return <ErrorState error={capital.error}/>;
  if (!capital.data) return <LoadingState/>;

  const capitalData = capital.data;
  const inventoryValue = (inventory.data || []).reduce((sum, row) => sum + row.inventoryValue, 0);
  const equity = Number(capitalData.currentCash) + inventoryValue;

  return <div>
    <header className="page-header"><div><p className="eyebrow">CAPITAL</p><h1>Finanzas</h1><p className="subtitle">Movimientos reales registrados por el backend.</p></div></header>
    <section className="metrics">
      <article className="metric-card"><span>Capital inicial</span><strong>{money(capitalData.initialCapital)}</strong><small>Base</small></article>
      <article className="metric-card"><span>Efectivo</span><strong>{money(capitalData.currentCash)}</strong><small>Disponible</small></article>
      <article className="metric-card"><span>Inventario</span><strong>{money(inventoryValue)}</strong><small>A costo promedio</small></article>
      <article className="metric-card"><span>Patrimonio operativo</span><strong>{money(equity)}</strong><small className={equity >= capitalData.initialCapital ? "positive" : ""}>Efectivo + inventario</small></article>
    </section>

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">MOVIMIENTOS</p><h2>Flujo de capital</h2></div></div>
      <div className="movement-list">{capitalData.movements.map((m) => {
        const positive = Number(m.Amount) >= 0;
        return <div className="movement" key={m.ID_CapitalMovement}><div className={positive ? "movement-icon positive-bg" : "movement-icon"}>{positive ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}</div><div><b>{m.Notes || m.Type}</b><small>{m.Reference || "Sin referencia"}</small></div><strong className={positive ? "positive" : ""}>{money(m.Amount)}</strong></div>;
      })}</div>
    </section>
  </div>;
}
