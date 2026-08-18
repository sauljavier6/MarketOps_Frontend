import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, PieChart, ShieldCheck, Sparkles } from "lucide-react";
import { generatePortfolio, getCapital, updateCapitalBudget } from "../api/marketOpsApi";

const money = (v:number) => new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(Number(v||0));

export default function PortfolioPage() {
  const qc = useQueryClient();
  const capitalQuery = useQuery({ queryKey: ["capital"], queryFn: getCapital });
  const [capital,setCapital]=useState(0);

  useEffect(() => {
    if (capitalQuery.data && capital === 0) setCapital(Number(capitalQuery.data.initialCapital));
  }, [capitalQuery.data, capital]);

  const portfolio=useMutation({
    mutationFn: async () => {
      await updateCapitalBudget(capital);
      return generatePortfolio({availableCapital:capital,reservePct:.40,maxProductPct:.25,maxProducts:5});
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["capital"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });

  const data=portfolio.data;

  return <div>
    <header className="page-header"><div><p className="eyebrow">PORTFOLIO ENGINE</p><h1>¿Dónde pongo mi dinero?</h1><p className="subtitle">Distribuye el capital entre las mejores oportunidades sin concentrar demasiado riesgo en un producto.</p></div></header>

    <section className="panel portfolio-builder">
      <div><p className="eyebrow">CAPITAL PARA ANALIZAR</p><h2>Construir cartera de inversión</h2><p>Al generar la cartera, este monto se guarda como presupuesto real de MarketOps y se actualiza en la sidebar.</p></div>
      <div className="portfolio-controls"><label>Capital disponible<input type="number" min="0" value={capital} onChange={e=>setCapital(Number(e.target.value))}/></label><button className="primary" disabled={portfolio.isPending || capitalQuery.isLoading} onClick={()=>portfolio.mutate()}><Sparkles size={15}/>{portfolio.isPending?"Guardando y calculando...":"Generar cartera"}</button></div>
    </section>

    {portfolio.isError && <div className="form-error">{portfolio.error.message}</div>}
    {!data ? <section className="panel portfolio-empty"><PieChart size={30}/><h2>Aún no hay cartera</h2><p>Primero necesitas recomendaciones individuales BUY o TEST con proveedor cotizado.</p></section> :
    <>
      <section className="portfolio-kpis">
        <article><CircleDollarSign size={18}/><span>Capital</span><b>{money(data.availableCapital)}</b></article>
        <article><Sparkles size={18}/><span>Invertir</span><b>{money(data.recommendedInvestment)}</b></article>
        <article><ShieldCheck size={18}/><span>Reserva</span><b>{money(data.reserveCapital)}</b></article>
        <article><PieChart size={18}/><span>Riesgo</span><b>{data.riskLevel}</b></article>
      </section>
      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">ASIGNACIÓN RECOMENDADA</p><h2>{data.productCount} productos</h2></div><span className="portfolio-exposure">Exposición {data.exposurePct}%</span></div>
        {!data.allocation.length ? <p className="subtitle">No hay oportunidades que cumplan los filtros de inversión actuales.</p> :
        <div className="allocation-list">{data.allocation.map((x:any,i:number)=><article key={x.title}>
          <div className="allocation-rank">#{i+1}</div>
          <div><b>{x.title}</b><small>{x.supplierName||"Proveedor pendiente"} · {x.decision}</small></div>
          <span>Comprar<b>{x.quantity} u.</b></span>
          <span>Invertir<b>{money(x.investment)}</b></span>
          <span>Utilidad pot.<b>{money(x.expectedProfit)}</b></span>
          <span>ROI est.<b>{x.roiPct}%</b></span>
          <span>Score<b>{x.score}/100</b></span>
        </article>)}</div>}
      </section>
    </>}
  </div>;
}
