import { useMutation, useQuery } from "@tanstack/react-query";
import { BrainCircuit, RefreshCw, Target, TrendingUp } from "lucide-react";
import { evaluateAllLearning, getLearningOutcomes } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";

const money = (v:number) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(Number(v||0));

export default function LearningPage() {
  const outcomes = useQuery({ queryKey:["learning-outcomes"], queryFn:getLearningOutcomes });
  const evaluate = useMutation({
    mutationFn:evaluateAllLearning,
    onSuccess:()=>outcomes.refetch(),
  });

  const rows = outcomes.data || [];
  const avgAccuracy = rows.length
    ? Math.round(rows.reduce((s:any,x:any)=>s+Number(x.PredictionAccuracyScore||0),0)/rows.length)
    : 0;

  return <div>
    <header className="page-header">
      <div><p className="eyebrow">APRENDIZAJE HISTÓRICO</p><h1>Predicción vs realidad</h1><p className="subtitle">MarketOps compara lo que esperaba contra lo que realmente vendiste y ajusta la confianza de futuras recomendaciones.</p></div>
      <button className="primary" disabled={evaluate.isPending} onClick={()=>evaluate.mutate({windowDays:60})}><RefreshCw size={15}/>{evaluate.isPending?"Evaluando...":"Actualizar aprendizaje"}</button>
    </header>

    <section className="metrics">
      <article className="metric-card"><span>Productos aprendidos</span><strong>{rows.length}</strong><small>con resultado real</small></article>
      <article className="metric-card"><span>Precisión promedio</span><strong>{avgAccuracy}%</strong><small>predicción histórica</small></article>
      <article className="metric-card"><span>Ventana</span><strong>60 días</strong><small>resultado reciente</small></article>
      <article className="metric-card"><span>Peso en score</span><strong>15%</strong><small>máximo histórico</small></article>
    </section>

    {evaluate.isError && <div className="form-error">{evaluate.error.message}</div>}

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">RESULTADOS</p><h2>Qué tan bien predijo MarketOps</h2></div><BrainCircuit size={20}/></div>
      {outcomes.isLoading ? <LoadingState/> : outcomes.isError ? <ErrorState error={outcomes.error}/> : !rows.length ? <EmptyState text="Todavía no hay suficiente historial de ventas para aprender."/> :
        <div className="learning-list">{rows.map((row:any)=><article key={row.ID_LearningOutcome}>
          <div className="accuracy-circle">{row.PredictionAccuracyScore}</div>
          <div className="learning-main"><b>{row.ProductTitle}</b><p>{row.Notes}</p></div>
          <span>Precio predicho<b>{money(row.PredictedSalePrice)}</b><small>real {money(row.ActualAverageSalePrice)}</small></span>
          <span>Margen predicho<b>{Number(row.PredictedMarginPct).toFixed(1)}%</b><small>real {Number(row.ActualMarginPct).toFixed(1)}%</small></span>
          <span>Rotación<b>{row.PredictedSellThroughDays || "—"} d</b><small>real {row.ActualSellThroughDays || "—"} d</small></span>
          <span>Error precio<b>{Number(row.PriceErrorPct).toFixed(1)}%</b></span>
          <span>Confianza<b>{row.ConfidenceAdjustment}/100</b></span>
        </article>)}</div>
      }
    </section>

    <section className="learning-explain">
      <article className="panel"><Target size={20}/><div><b>No sobreajusta</b><p>El histórico solo modifica una parte del score; mercado y margen siguen siendo principales.</p></div></article>
      <article className="panel"><TrendingUp size={20}/><div><b>Mejora con ventas</b><p>Mientras más ciclos completes, mejores serán los ajustes para productos similares.</p></div></article>
    </section>
  </div>;
}
