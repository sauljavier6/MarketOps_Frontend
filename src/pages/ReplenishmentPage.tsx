import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, PackagePlus, PauseCircle, RefreshCw, TrendingDown } from "lucide-react";
import { evaluateAllReplenishment } from "../api/marketOpsApi";

const money = (v:number) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(Number(v||0));

function decisionMeta(decision:string) {
  if (decision === "REORDER") return { label:"REABASTECER", cls:"reorder", icon:<PackagePlus size={15}/> };
  if (decision === "EXIT") return { label:"SALIR", cls:"exit", icon:<TrendingDown size={15}/> };
  if (decision === "STOP") return { label:"NO REABASTECER", cls:"stop", icon:<PauseCircle size={15}/> };
  return { label:"MANTENER", cls:"hold", icon:<RefreshCw size={15}/> };
}

export default function ReplenishmentPage() {
  const mutation = useMutation({ mutationFn: evaluateAllReplenishment });
  const rows = mutation.data || [];

  return <div>
    <header className="page-header">
      <div><p className="eyebrow">POST-VENTA</p><h1>Reabastecimiento & salida</h1><p className="subtitle">Decide qué volver a comprar, qué detener y cuándo salir de inventario antes de que termine la temporada.</p></div>
      <button className="primary" disabled={mutation.isPending} onClick={()=>mutation.mutate({windowDays:14,leadTimeDays:7,targetCoverDays:21,minHealthyMarginPct:18})}><RefreshCw size={15}/>{mutation.isPending?"Evaluando...":"Evaluar catálogo"}</button>
    </header>

    <section className="panel replenish-rules">
      <div><p className="eyebrow">REGLAS ACTUALES</p><h2>Motor conservador de inventario</h2></div>
      <div className="rule-chips"><span>Ventana 14 días</span><span>Lead time 7 días</span><span>Cobertura objetivo 21 días</span><span>Margen mínimo 18%</span></div>
    </section>

    {mutation.isError && <div className="form-error">{mutation.error.message}</div>}

    {!rows.length ? <section className="panel replenish-empty"><AlertTriangle size={28}/><h2>Aún no hay evaluación</h2><p>Cuando existan ventas reales, el sistema calculará velocidad de venta, días de cobertura y margen real.</p></section> :
    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">DECISIONES</p><h2>Catálogo activo</h2></div></div>
      <div className="replenish-list">{rows.map((row:any)=>{
        const meta=decisionMeta(row.decision);
        return <article key={row.analytics.productId}>
          <div className={`decision-icon ${meta.cls}`}>{meta.icon}</div>
          <div className="replenish-main"><b>{row.analytics.productName}</b><p>{row.reason}</p></div>
          <span>Stock<b>{row.analytics.currentStock}</b></span>
          <span>Vendidas 14d<b>{row.analytics.unitsSold}</b></span>
          <span>Venta diaria<b>{row.averageDailySales}</b></span>
          <span>Cobertura<b>{row.daysOfCover >= 900 ? "Sin rotación" : `${row.daysOfCover} d`}</b></span>
          <span>Margen real<b>{row.analytics.realMarginPct}%</b></span>
          <span className={`decision-pill ${meta.cls}`}>{meta.label}</span>
          <span>Comprar<b>{row.recommendedQuantity} u.</b></span>
        </article>
      })}</div>
    </section>}
  </div>;
}
