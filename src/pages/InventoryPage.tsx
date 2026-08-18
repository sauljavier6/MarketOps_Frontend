import { useQuery } from "@tanstack/react-query";
import { getInventory } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

export default function InventoryPage() {
  const query = useQuery({ queryKey: ["inventory"], queryFn: getInventory });
  const rows = query.data || [];
  const units = rows.reduce((sum, row) => sum + row.available, 0);
  const value = rows.reduce((sum, row) => sum + row.inventoryValue, 0);

  return <div>
    <header className="page-header"><div><p className="eyebrow">OPERACIÓN FÍSICA</p><h1>Inventario</h1><p className="subtitle">Se actualiza al confirmar recepciones.</p></div></header>
    <section className="metrics">
      <article className="metric-card"><span>Disponibles</span><strong>{units}</strong><small>unidades</small></article>
      <article className="metric-card"><span>Valor inventario</span><strong>{money(value)}</strong><small>costo promedio</small></article>
      <article className="metric-card"><span>SKUs</span><strong>{rows.length}</strong><small>con stock</small></article>
      <article className="metric-card"><span>Reservado</span><strong>{rows.reduce((s,r)=>s+r.reserved,0)}</strong><small>unidades</small></article>
    </section>
    <section className="panel">
      {query.isLoading ? <LoadingState/> : query.isError ? <ErrorState error={query.error}/> : !rows.length ? <EmptyState text="No hay inventario todavía. Recibe una compra para generar stock."/> :
        <div className="inventory-table"><div className="inventory-row inventory-head"><span>Producto</span><span>Stock</span><span>Reservado</span><span>Costo prom.</span><span>Venta</span><span>Valor</span></div>
          {rows.map(row => <div className="inventory-row" key={row.productId}><span><b>{row.description}</b><small>{row.code || `#${row.productId}`}</small></span><span>{row.available}</span><span>{row.reserved}</span><span>{money(row.averagePurchasePrice)}</span><span>{money(row.salePrice)}</span><span>{money(row.inventoryValue)}</span></div>)}
        </div>
      }
    </section>
  </div>;
}
