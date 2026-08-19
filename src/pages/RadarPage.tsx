import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Search } from "lucide-react";
import { createRadarCandidate, createSupplierOffer, getCommercialCalendar, getDataSourceStatus, getInvestmentRecommendation, getRadarCandidates, getSupplierOffers, runAutoDiscovery, setRadarSellingCosts } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";
import "./RadarPage.css";

const money = (v?: number | null) => v == null || !Number.isFinite(Number(v)) || Number(v) <= 0 ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(v));
const pct = (v?: number | null) => v == null || !Number.isFinite(Number(v)) ? "—" : `${Number(v).toFixed(1)}%`;

function stageLabel(stage?: string) {
  const labels: Record<string, string> = { RESEARCH_NOW: "Investigar ahora", SOURCE_NOW: "Buscar proveedor", BUY_NOW: "Ventana de compra", SELL_NOW: "Demanda activa", TOO_LATE: "Demasiado tarde", UPCOMING: "Próximamente", MARKET_RESEARCH: "Investigando mercado", MARKET_VALIDATED: "Mercado validado", SOURCING: "Buscando proveedor", ECONOMICS: "Calculando rentabilidad", DECISION: "Decisión lista" };
  return labels[stage || ""] || stage || "—";
}

function decisionLabel(decision?: string) {
  const labels: Record<string, string> = { BUY: "COMPRAR", TEST: "PRUEBA", WATCH: "VIGILAR", RESEARCH: "INVESTIGAR", REJECT: "DESCARTAR", TOO_LATE: "MUY TARDE" };
  return labels[decision || ""] || decision || "INVESTIGAR";
}

export default function RadarPage() {
  const [candidateModal, setCandidateModal] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [costModal, setCostModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [finalResult, setFinalResult] = useState<any>(null);
  const qc = useQueryClient();

  const calendar = useQuery({ queryKey: ["commercial-calendar"], queryFn: getCommercialCalendar });
  const candidates = useQuery({ queryKey: ["radar-candidates"], queryFn: getRadarCandidates });
  const sourceStatus = useQuery({ queryKey: ["radar-data-sources"], queryFn: getDataSourceStatus });
  const offers = useQuery({ queryKey: ["supplier-offers", selected?.Title], queryFn: () => getSupplierOffers(selected?.Title), enabled: !!selected });

  const createCandidate = useMutation({ mutationFn: createRadarCandidate, onSuccess: async () => { setCandidateModal(false); await qc.invalidateQueries({ queryKey: ["radar-candidates"] }); } });
  const createOffer = useMutation({ mutationFn: createSupplierOffer, onSuccess: async () => { setOfferModal(false); await qc.invalidateQueries({ queryKey: ["supplier-offers", selected?.Title] }); } });
  const saveSellingCosts = useMutation({ mutationFn: ({ candidateId, payload }: { candidateId: number; payload: { marketplaceShipping: number; packagingCost: number; otherSellingCosts: number; source?: string } }) => setRadarSellingCosts(candidateId, payload), onSuccess: async (row: any) => { setCostModal(false); setSelected(row); setFinalResult(null); await qc.invalidateQueries({ queryKey: ["radar-candidates"] }); } });
  const recommend = useMutation({ mutationFn: getInvestmentRecommendation, onSuccess: async (data: any) => { setFinalResult(data); await qc.invalidateQueries({ queryKey: ["radar-candidates"] }); } });
  const discovery = useMutation({ mutationFn: runAutoDiscovery, onSuccess: async () => { setSelected(null); setFinalResult(null); await Promise.all([qc.invalidateQueries({ queryKey: ["radar-candidates"] }), qc.invalidateQueries({ queryKey: ["commercial-calendar"] }), qc.invalidateQueries({ queryKey: ["radar-data-sources"] })]); } });

  function submitCandidate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    createCandidate.mutate({ title: String(f.get("title")), season: String(f.get("season") || ""), estimatedSalePrice: Number(f.get("sale")), estimatedMarketplaceFee: Number(f.get("fee") || 0), estimatedShippingCost: Number(f.get("ship") || 0), packagingCost: Number(f.get("pack") || 0), demandScore: Number(f.get("demand") || 50), competitionScore: Number(f.get("competition") || 50), seasonalScore: Number(f.get("seasonal") || 50), trendScore: Number(f.get("trend") || 50) });
  }

  function submitOffer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    createOffer.mutate({ productQuery: selected.Title, supplierName: String(f.get("supplier")), source: String(f.get("source") || ""), sourceUrl: String(f.get("url") || ""), unitPrice: Number(f.get("price")), moq: Number(f.get("moq") || 1), shippingCost: Number(f.get("shipping") || 0), importCost: Number(f.get("import") || 0), deliveryDays: Number(f.get("days") || 0), reliabilityScore: Number(f.get("reliability") || 50) });
  }

  function submitSellingCosts(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    saveSellingCosts.mutate({ candidateId: selected.ID_RadarCandidate, payload: { marketplaceShipping: Number(f.get("marketplaceShipping") || 0), packagingCost: Number(f.get("packagingCost") || 0), otherSellingCosts: Number(f.get("otherSellingCosts") || 0), source: "USER_VERIFIED" } });
  }

  function calculateFinal() {
    if (!selected) return;
    recommend.mutate({ candidateId: selected.ID_RadarCandidate });
  }

  const catalogReady = sourceStatus.data?.marketplaceAccount && sourceStatus.data?.sources?.find((s: any) => s.id === "meli_catalog_products")?.status === "READY";
  const summary = discovery.data?.summary;
  const evidence = selected?.Evidence || {};
  const sourcing = evidence.sourcing;
  const economics = evidence.economics;
  const timing = evidence.timing;
  const scoring = evidence.scoring || {};
  const recommendation = evidence.recommendation;
  const sellingCosts = evidence.sellingCosts;
  const canFinalize = Boolean(offers.data?.length && sellingCosts?.verified);

  return <div>
    <header className="page-header"><div><p className="eyebrow">TEMPORADA · VALIDACIÓN · PROVEEDORES · RENTABILIDAD</p><h1>Radar de inversión</h1><p className="subtitle">Anticipa demanda, valida productos en Mercado Libre y decide qué comprar hoy con tu capital disponible.</p></div><button className="primary" onClick={() => setCandidateModal(true)}><Plus size={16}/> Captura manual</button></header>

    <section className="panel auto-discovery-panel"><div className="auto-discovery-copy"><p className="eyebrow">DESCUBRIMIENTO AUTOMÁTICO · MÉXICO</p><h2>¿Qué debería comprar ahora para las próximas oportunidades?</h2><p>MarketOps parte del calendario comercial de los próximos 30/60/90/120 días. Genera hipótesis estacionales, usa Mercado Libre para validar producto, precio y demanda, y después usa Brave para buscar proveedores. Tendencias es una señal de validación y descubrimiento adicional, no el punto de partida principal.</p><p className="source-note">Estrategia inicial: 70% estacional / 30% demanda continua. Una decisión COMPRAR solo es válida cuando mercado, momento, proveedor, rentabilidad, capital y riesgo pasan todos los filtros.</p></div><div className="auto-discovery-actions"><span className={catalogReady ? "source-status ready" : "source-status auth_required"}>{catalogReady ? "ML listo · análisis estacional listo" : "Requiere OAuth"}</span><button className="primary" disabled={!catalogReady || discovery.isPending} onClick={() => discovery.mutate({ maxTrends: 20 })}><Search size={15}/>{discovery.isPending ? "Investigando próximos meses..." : "Ejecutar investigación"}</button></div>{discovery.isError && <div className="form-error">{discovery.error.message}</div>}</section>

    <section className="panel"><div className="panel-header"><div><p className="eyebrow">PRÓXIMAS OPORTUNIDADES COMERCIALES</p><h2>Calendario 30 / 60 / 90 / 120 días</h2></div><span className="source-note">Capital actual: {money(calendar.data?.availableCapital)}</span></div>{calendar.isLoading ? <LoadingState/> : calendar.isError ? <ErrorState error={calendar.error}/> : <div className="recommendation-metrics">{(calendar.data?.opportunities || []).map((o: any) => <span key={o.id}>{o.name}<b>{o.daysUntilPeak} días al pico</b><small>{stageLabel(o.stage)} · demanda en {o.daysUntilDemand} días</small></span>)}</div>}</section>

    {summary && <section className="panel"><div className="panel-header"><div><p className="eyebrow">ÚLTIMA INVESTIGACIÓN</p><h2>Proceso de análisis estacional</h2></div></div><div className="recommendation-metrics"><span>Temporadas analizadas<b>{summary.seasonPlan?.length || 0}</b></span><span>Productos estacionales<b>{summary.seasonalProductsFound}</b></span><span>Demanda continua<b>{summary.evergreenProductsFound}</b></span><span>Con precio ML<b>{summary.productsWithMlPrice}</b></span><span>Buscando proveedores<b>{summary.sourcingShortlist}</b></span><span>Recomendados para comprar<b>{summary.buyOpportunities}</b></span></div>{summary.failed > 0 && <div className="form-error">{summary.failed} investigaciones fallaron; no se inventaron resultados.</div>}</section>}

    <section className="panel">{candidates.isLoading ? <LoadingState/> : candidates.isError ? <ErrorState error={candidates.error}/> : !candidates.data?.length ? <EmptyState text="Aún no hay productos investigados. Ejecuta el descubrimiento automático."/> : <div className="radar-table"><div className="radar-row radar-head"><span>Producto</span><span>Momento</span><span>Venta ML</span><span>Costo compra</span><span>Margen</span><span>Puntuación de inversión</span><span>Decisión</span><span></span></div>{candidates.data.map((r: any) => { const e = r.Evidence || {}; const score = e.scoring?.InvestmentScore; return <div className={selected?.ID_RadarCandidate === r.ID_RadarCandidate ? "radar-row selected" : "radar-row"} key={r.ID_RadarCandidate}><span><b>{r.Title}</b><small>{r.Season || (e.sourceStrategy === "EVERGREEN" ? "Demanda continua" : "Sin temporada")} · {e.sourceStrategy === "SEASONAL" ? "Estacional" : e.sourceStrategy === "EVERGREEN" ? "Demanda continua" : e.sourceStrategy || "—"}</small></span><span><b>{stageLabel(e.commercialOpportunity?.stage || e.stage)}</b><small>{e.commercialOpportunity ? `${e.commercialOpportunity.daysUntilPeak} días al pico` : "demanda continua"}</small></span><span><b>{money(r.EstimatedSalePrice)}</b><small>{e.priceRange?.samples || 0} muestra(s) ML · confianza {r.ConfidenceScore || 0}</small></span><span><b>{money(e.sourcing?.estimatedPurchasePrice)}</b><small>{e.sourcing?.supplierVerified ? "cotización verificada" : e.sourcing?.estimatedPurchasePrice ? "señal Brave" : "pendiente"}</small></span><span><b>{pct(e.economics?.netMarginPct ?? e.economics?.preliminaryMarginBeforeUnknownSellingCosts)}</b><small>{e.economics?.ready ? "rentabilidad completa" : "preliminar / incompleta"}</small></span><span><b className={Number(score) >= 80 ? "score hot" : "score"}>{score ?? "—"}</b></span><span><b>{decisionLabel(e.decision)}</b><small>{e.decisionReason || "Falta investigación"}</small></span><span><button className="secondary" onClick={() => { setSelected(r); setFinalResult(null); }}>Analizar</button></span></div>; })}</div>}</section>

    {selected && <section className="dashboard-grid radar-detail"><article className="panel"><div className="panel-header"><div><p className="eyebrow">ANÁLISIS DE INVERSIÓN</p><h2>{selected.Title}</h2><p className="subtitle">{selected.Season || (evidence.sourceStrategy === "EVERGREEN" ? "Demanda continua" : "Sin temporada")} · {stageLabel(evidence.stage)}</p></div><div className="form-actions"><button className="secondary" onClick={() => setOfferModal(true)}><Plus size={14}/> Cotización proveedor</button><button className="secondary" onClick={() => setCostModal(true)}><Plus size={14}/> Costos de venta</button></div></div>
      <div className="recommendation-metrics"><span>Puntuación de temporada<b>{scoring.SeasonScore ?? "—"}</b><small>Qué tan favorable es la temporada</small></span><span>Puntuación del momento<b>{scoring.TimingScore ?? "—"}</b><small>Si estamos a tiempo para comprar</small></span><span>Demanda estimada<b>{scoring.DemandScore ?? selected.DemandScore ?? "—"}</b><small>Fuerza esperada de la demanda</small></span><span>Atractivo del mercado<b>{scoring.MarketScore ?? selected.MarketScore ?? "—"}</b><small>Calidad general de la oportunidad</small></span><span>Nivel de competencia<b>{scoring.CompetitionScore ?? selected.CompetitionScore ?? "—"}</b><small>Mayor valor significa más competencia</small></span><span>Confianza de los datos<b>{scoring.DataConfidence ?? selected.ConfidenceScore ?? "—"}</b><small>Qué tan sólida es la evidencia</small></span></div>
      <div className="recommendation-metrics"><span>Precio de venta ML<b>{money(selected.EstimatedSalePrice)}</b></span><span>Rango de precios ML<b>{money(evidence.priceRange?.min)} – {money(evidence.priceRange?.max)}</b></span><span>Comisión Mercado Libre<b>{money(selected.EstimatedMarketplaceFee)}</b></span><span>Costo estimado proveedor<b>{money(sourcing?.estimatedPurchasePrice)}</b></span><span>Tiempo total de abastecimiento<b>{timing?.totalLeadTimeDays != null ? `${timing.totalLeadTimeDays} días` : "pendiente"}</b></span><span>Estado del momento de compra<b>{timing?.timingStatus ? stageLabel(timing.timingStatus) : "pendiente"}</b></span></div>
      <div className="recommendation-metrics"><span>Calidad del proveedor<b>{scoring.SupplierScore ?? "—"}</b><small>Precio, confiabilidad y entrega</small></span><span>Calidad del margen<b>{scoring.MarginScore ?? "—"}</b><small>Qué tan atractivo es el margen</small></span><span>Ajuste al capital disponible<b>{scoring.CapitalFitScore ?? "—"}</b><small>Qué tan bien cabe en tu presupuesto</small></span><span>Seguridad de la oportunidad<b>{scoring.RiskScore ?? "—"}</b><small>Mayor valor significa menor riesgo</small></span><span>Puntuación final de inversión<b>{scoring.InvestmentScore ?? "—"}</b><small>Resultado ponderado de todos los factores</small></span><span>Decisión recomendada<b>{decisionLabel(evidence.decision)}</b></span></div>
      {evidence.commercialOpportunity && <div className="source-note">{evidence.commercialOpportunity.name}: demanda inicia en {evidence.commercialOpportunity.daysUntilDemand} días y el pico está a {evidence.commercialOpportunity.daysUntilPeak} días. Ventana de compra: {evidence.commercialOpportunity.recommendedPurchaseStart} a {evidence.commercialOpportunity.recommendedPurchaseEnd}.</div>}
      {sourcing?.supplierLeads?.length > 0 && <><div className="panel-header"><div><p className="eyebrow">BÚSQUEDA DE PROVEEDORES · BRAVE</p><h3>Proveedores encontrados</h3></div></div><div className="supplier-offer-list">{sourcing.supplierLeads.map((lead: any, index: number) => <div key={`${lead.url}-${index}`}><div><b>{lead.name}</b><small>{lead.domain}</small></div><span><b>{money(lead.priceHint)}</b><small>señal web</small></span><span><b>{lead.leadScore}/100</b><small>calidad del resultado</small></span></div>)}</div></>}
      {sellingCosts?.verified && <div className="source-note">Costos de venta verificados: envío ML {money(sellingCosts.marketplaceShipping)} · empaque {money(sellingCosts.packagingCost)} · otros {money(sellingCosts.otherSellingCosts)}.</div>}
      {economics && <div className="source-note">Rentabilidad: costo puesto {money(economics.landedCost)} · utilidad/unidad {money(economics.unitProfit)} · margen {pct(economics.netMarginPct)} · ROI {pct(economics.roiPct)}. {!economics.ready && economics.note}</div>}
    </article><aside className="panel recommendation-panel"><p className="eyebrow">DECISIÓN</p><h2>{decisionLabel(finalResult?.decision || evidence.decision)}</h2><p>{finalResult?.reason || evidence.decisionReason || "Completa proveedor y costos antes de tomar una decisión de compra."}</p><div className="recommendation-metrics"><span>Puntuación final<b>{finalResult?.investmentScore ?? scoring.InvestmentScore ?? "—"}</b></span><span>Margen neto<b>{pct(finalResult?.economics?.netMarginPct ?? economics?.netMarginPct)}</b></span><span>ROI<b>{pct(finalResult?.economics?.roiPct ?? economics?.roiPct)}</b></span><span>Capital disponible<b>{money(recommendation?.availableCapital)}</b></span></div><button className="primary full-width" disabled={!canFinalize || recommend.isPending} onClick={calculateFinal}><Calculator size={15}/>{recommend.isPending ? "Calculando..." : "Calcular decisión final"}</button>{!canFinalize && <p className="verification-note">Para calcular la decisión final debes registrar una cotización real del proveedor y verificar los costos de venta.</p>}</aside></section>}

    {candidateModal && <Modal title="Captura manual" onClose={() => setCandidateModal(false)}><form className="form-grid" onSubmit={submitCandidate}><label className="span-2">Producto<input name="title" required/></label><label>Temporada<input name="season"/></label><label>Precio venta ML<input name="sale" type="number" required/></label><label>Comisión ML<input name="fee" type="number"/></label><label>Envío<input name="ship" type="number"/></label><label>Empaque<input name="pack" type="number"/></label><label>Demanda (0-100)<input name="demand" type="number" min="0" max="100" defaultValue="50"/></label><label>Competencia (0-100)<input name="competition" type="number" min="0" max="100" defaultValue="50"/></label><label>Temporada (0-100)<input name="seasonal" type="number" min="0" max="100" defaultValue="50"/></label><label>Tendencia (0-100)<input name="trend" type="number" min="0" max="100" defaultValue="50"/></label><div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setCandidateModal(false)}>Cancelar</button><button className="primary">Guardar</button></div></form></Modal>}

    {offerModal && selected && <Modal title="Cotización verificada del proveedor" onClose={() => setOfferModal(false)}><form className="form-grid" onSubmit={submitOffer}><label className="span-2">Proveedor<input name="supplier" required/></label><label>Precio unitario<input name="price" type="number" step="0.01" required/></label><label>Compra mínima (MOQ)<input name="moq" type="number" defaultValue="1"/></label><label>Envío total<input name="shipping" type="number" step="0.01" defaultValue="0"/></label><label>Importación total<input name="import" type="number" step="0.01" defaultValue="0"/></label><label>Días de entrega<input name="days" type="number"/></label><label>Confiabilidad (0-100)<input name="reliability" type="number" defaultValue="70"/></label><label>Fuente<input name="source" placeholder="Proveedor directo / web / cotización"/></label><label className="span-2">URL<input name="url"/></label><div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setOfferModal(false)}>Cancelar</button><button className="primary">Guardar cotización</button></div></form></Modal>}

    {costModal && selected && <Modal title="Costos de venta verificados" onClose={() => setCostModal(false)}><form className="form-grid" onSubmit={submitSellingCosts}><p className="span-2 source-note">Estos costos son necesarios para calcular margen y ROI reales. No se asumirán como cero si no están verificados.</p><label>Envío Mercado Libre / unidad<input name="marketplaceShipping" type="number" step="0.01" min="0" required defaultValue={sellingCosts?.marketplaceShipping ?? ""}/></label><label>Empaque / unidad<input name="packagingCost" type="number" step="0.01" min="0" required defaultValue={sellingCosts?.packagingCost ?? ""}/></label><label>Otros costos / unidad<input name="otherSellingCosts" type="number" step="0.01" min="0" required defaultValue={sellingCosts?.otherSellingCosts ?? ""}/></label><div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setCostModal(false)}>Cancelar</button><button className="primary">Guardar costos</button></div></form></Modal>}
  </div>;
}
