import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Search } from "lucide-react";
import { createRadarCandidate, createSupplierOffer, getCommercialCalendar, getDataSourceStatus, getInvestmentRecommendation, getRadarCandidates, getSupplierOffers, runAutoDiscovery } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";
import "./RadarPage.css";

const money = (v?: number | null) => v == null || !Number.isFinite(Number(v)) || Number(v) <= 0 ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(v));
const pct = (v?: number | null) => v == null || !Number.isFinite(Number(v)) ? "—" : `${Number(v).toFixed(1)}%`;

function stageLabel(stage?: string) {
  const labels: Record<string, string> = { RESEARCH_NOW: "Investigar ahora", SOURCE_NOW: "Buscar proveedor", BUY_NOW: "Ventana de compra", SELL_NOW: "Demanda activa", TOO_LATE: "Demasiado tarde", UPCOMING: "Próximamente", MARKET_RESEARCH: "Investigando mercado", MARKET_VALIDATED: "Mercado validado", SOURCING: "Buscando proveedor", ECONOMICS: "Calculando economía", DECISION: "Decisión lista" };
  return labels[stage || ""] || stage || "—";
}

function decisionLabel(decision?: string) {
  const labels: Record<string, string> = { BUY: "COMPRAR", TEST: "PRUEBA", WATCH: "VIGILAR", RESEARCH: "INVESTIGAR", REJECT: "DESCARTAR", TOO_LATE: "MUY TARDE" };
  return labels[decision || ""] || decision || "INVESTIGAR";
}

export default function RadarPage() {
  const [candidateModal, setCandidateModal] = useState(false);
  const [offerModal, setOfferModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [finalResult, setFinalResult] = useState<any>(null);
  const qc = useQueryClient();

  const calendar = useQuery({ queryKey: ["commercial-calendar"], queryFn: getCommercialCalendar });
  const candidates = useQuery({ queryKey: ["radar-candidates"], queryFn: getRadarCandidates });
  const sourceStatus = useQuery({ queryKey: ["radar-data-sources"], queryFn: getDataSourceStatus });
  const offers = useQuery({ queryKey: ["supplier-offers", selected?.Title], queryFn: () => getSupplierOffers(selected?.Title), enabled: !!selected });

  const createCandidate = useMutation({ mutationFn: createRadarCandidate, onSuccess: async () => { setCandidateModal(false); await qc.invalidateQueries({ queryKey: ["radar-candidates"] }); } });
  const createOffer = useMutation({ mutationFn: createSupplierOffer, onSuccess: async () => { setOfferModal(false); await qc.invalidateQueries({ queryKey: ["supplier-offers", selected?.Title] }); } });
  const recommend = useMutation({ mutationFn: getInvestmentRecommendation, onSuccess: setFinalResult });
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

  function calculateFinal() {
    if (!selected || !Number(selected.EstimatedSalePrice)) return;
    recommend.mutate({ title: selected.Title, marketScore: Number(selected.MarketScore), estimatedSalePrice: Number(selected.EstimatedSalePrice), marketplaceFeePerUnit: Number(selected.EstimatedMarketplaceFee), outboundShippingPerUnit: Number(selected.EstimatedShippingCost), packagingCostPerUnit: Number(selected.PackagingCost), seasonDaysRemaining: selected.Evidence?.commercialOpportunity?.daysUntilPeak ?? undefined, offers: (offers.data || []).map((o: any) => ({ supplierName: o.SupplierName, source: o.Source, sourceUrl: o.SourceUrl, unitPrice: Number(o.UnitPrice), moq: Number(o.MOQ), shippingCost: Number(o.ShippingCost), importCost: Number(o.ImportCost), deliveryDays: o.DeliveryDays, reliabilityScore: Number(o.ReliabilityScore) })) });
  }

  const catalogReady = sourceStatus.data?.marketplaceAccount && sourceStatus.data?.sources?.find((s: any) => s.id === "meli_catalog_products")?.status === "READY";
  const summary = discovery.data?.summary;
  const evidence = selected?.Evidence || {};
  const sourcing = evidence.sourcing;
  const economics = evidence.economics;
  const timing = evidence.timing;
  const scoring = evidence.scoring || {};
  const recommendation = evidence.recommendation;

  return <div>
    <header className="page-header"><div><p className="eyebrow">SEASON-FIRST · VALIDATION · SOURCING · ECONOMICS</p><h1>Radar de inversión</h1><p className="subtitle">Anticipa demanda, valida productos en Mercado Libre y decide qué comprar hoy con tu capital disponible.</p></div><button className="primary" onClick={() => setCandidateModal(true)}><Plus size={16}/> Captura manual</button></header>

    <section className="panel auto-discovery-panel"><div className="auto-discovery-copy"><p className="eyebrow">AUTO DISCOVERY · MÉXICO</p><h2>¿Qué debería comprar ahora para las próximas oportunidades?</h2><p>MarketOps parte del calendario comercial de los próximos 30/60/90/120 días. Genera hipótesis estacionales, usa Mercado Libre para validar producto, precio y demanda, y después usa Brave para sourcing. Trends es señal de validación y descubrimiento adicional, no el punto de partida principal.</p><p className="source-note">Estrategia inicial: 70% Season-First / 30% Evergreen. Un BUY solo es válido cuando mercado, timing, proveedor, economía, capital y riesgo pasan los quality gates.</p></div><div className="auto-discovery-actions"><span className={catalogReady ? "source-status ready" : "source-status auth_required"}>{catalogReady ? "ML listo · Season-First listo" : "Requiere OAuth"}</span><button className="primary" disabled={!catalogReady || discovery.isPending} onClick={() => discovery.mutate({ maxTrends: 20 })}><Search size={15}/>{discovery.isPending ? "Investigando próximos meses..." : "Ejecutar investigación"}</button></div>{discovery.isError && <div className="form-error">{discovery.error.message}</div>}</section>

    <section className="panel"><div className="panel-header"><div><p className="eyebrow">PRÓXIMAS OPORTUNIDADES COMERCIALES</p><h2>Calendario 30 / 60 / 90 / 120 días</h2></div><span className="source-note">Capital actual: {money(calendar.data?.availableCapital)}</span></div>{calendar.isLoading ? <LoadingState/> : calendar.isError ? <ErrorState error={calendar.error}/> : <div className="recommendation-metrics">{(calendar.data?.opportunities || []).map((o: any) => <span key={o.id}>{o.name}<b>{o.daysUntilPeak} días al pico</b><small>{stageLabel(o.stage)} · demanda en {o.daysUntilDemand} días</small></span>)}</div>}</section>

    {summary && <section className="panel"><div className="panel-header"><div><p className="eyebrow">ÚLTIMA INVESTIGACIÓN</p><h2>Pipeline Season-First</h2></div></div><div className="recommendation-metrics"><span>Temporadas analizadas<b>{summary.seasonPlan?.length || 0}</b></span><span>Productos estacionales<b>{summary.seasonalProductsFound}</b></span><span>Evergreen<b>{summary.evergreenProductsFound}</b></span><span>Con precio ML<b>{summary.productsWithMlPrice}</b></span><span>Sourcing<b>{summary.sourcingShortlist}</b></span><span>BUY reales<b>{summary.buyOpportunities}</b></span></div>{summary.failed > 0 && <div className="form-error">{summary.failed} investigaciones fallaron; no se inventaron resultados.</div>}</section>}

    <section className="panel">{candidates.isLoading ? <LoadingState/> : candidates.isError ? <ErrorState error={candidates.error}/> : !candidates.data?.length ? <EmptyState text="Aún no hay productos investigados. Ejecuta Season-First Discovery."/> : <div className="radar-table"><div className="radar-row radar-head"><span>Producto</span><span>Momento</span><span>Venta ML</span><span>Costo compra</span><span>Margen</span><span>Investment Score</span><span>Decisión</span><span></span></div>{candidates.data.map((r: any) => { const e = r.Evidence || {}; const score = e.scoring?.InvestmentScore; return <div className={selected?.ID_RadarCandidate === r.ID_RadarCandidate ? "radar-row selected" : "radar-row"} key={r.ID_RadarCandidate}><span><b>{r.Title}</b><small>{r.Season || (e.sourceStrategy === "EVERGREEN" ? "Evergreen" : "Sin temporada")} · {e.sourceStrategy || "—"}</small></span><span><b>{stageLabel(e.commercialOpportunity?.stage || e.stage)}</b><small>{e.commercialOpportunity ? `${e.commercialOpportunity.daysUntilPeak} días al pico` : "demanda continua"}</small></span><span><b>{money(r.EstimatedSalePrice)}</b><small>{e.priceRange?.samples || 0} muestra(s) ML · confianza {r.ConfidenceScore || 0}</small></span><span><b>{money(e.sourcing?.estimatedPurchasePrice)}</b><small>{e.sourcing?.supplierVerified ? "cotización verificada" : e.sourcing?.estimatedPurchasePrice ? "señal Brave" : "pendiente"}</small></span><span><b>{pct(e.economics?.netMarginPct ?? e.economics?.preliminaryMarginBeforeUnknownSellingCosts)}</b><small>{e.economics?.ready ? "economía completa" : "preliminar / incompleta"}</small></span><span><b className={Number(score) >= 80 ? "score hot" : "score"}>{score ?? "—"}</b></span><span><b>{decisionLabel(e.decision)}</b><small>{e.decisionReason || "Falta investigación"}</small></span><span><button className="secondary" onClick={() => { setSelected(r); setFinalResult(null); }}>Analizar</button></span></div>; })}</div>}</section>

    {selected && <section className="dashboard-grid radar-detail"><article className="panel"><div className="panel-header"><div><p className="eyebrow">INVESTMENT ANALYSIS</p><h2>{selected.Title}</h2><p className="subtitle">{selected.Season || (evidence.sourceStrategy === "EVERGREEN" ? "Evergreen" : "Sin temporada")} · {stageLabel(evidence.stage)}</p></div><button className="secondary" onClick={() => setOfferModal(true)}><Plus size={14}/> Cotización verificada</button></div>
      <div className="recommendation-metrics"><span>Season Score<b>{scoring.SeasonScore ?? "—"}</b></span><span>Timing Score<b>{scoring.TimingScore ?? "—"}</b></span><span>Demand Score<b>{scoring.DemandScore ?? selected.DemandScore ?? "—"}</b></span><span>Market Score<b>{scoring.MarketScore ?? selected.MarketScore ?? "—"}</b></span><span>Competition<b>{scoring.CompetitionScore ?? selected.CompetitionScore ?? "—"}</b></span><span>Confidence<b>{scoring.DataConfidence ?? selected.ConfidenceScore ?? "—"}</b></span></div>
      <div className="recommendation-metrics"><span>Venta ML<b>{money(selected.EstimatedSalePrice)}</b></span><span>Rango ML<b>{money(evidence.priceRange?.min)} – {money(evidence.priceRange?.max)}</b></span><span>Comisión ML<b>{money(selected.EstimatedMarketplaceFee)}</b></span><span>Proveedor estimado<b>{money(sourcing?.estimatedPurchasePrice)}</b></span><span>Lead time<b>{timing?.totalLeadTimeDays != null ? `${timing.totalLeadTimeDays} días` : "pendiente"}</b></span><span>Timing<b>{timing?.timingStatus || "pendiente"}</b></span></div>
      <div className="recommendation-metrics"><span>Supplier Score<b>{scoring.SupplierScore ?? "—"}</b></span><span>Margin Score<b>{scoring.MarginScore ?? "—"}</b></span><span>Capital Fit<b>{scoring.CapitalFitScore ?? "—"}</b></span><span>Risk Score<b>{scoring.RiskScore ?? "—"}</b></span><span>Investment Score<b>{scoring.InvestmentScore ?? "—"}</b></span><span>Decisión<b>{decisionLabel(evidence.decision)}</b></span></div>
      {evidence.commercialOpportunity && <div className="source-note">{evidence.commercialOpportunity.name}: demanda inicia en {evidence.commercialOpportunity.daysUntilDemand} días y el pico está a {evidence.commercialOpportunity.daysUntilPeak} días. Ventana de compra: {evidence.commercialOpportunity.recommendedPurchaseStart} a {evidence.commercialOpportunity.recommendedPurchaseEnd}.</div>}
      {sourcing?.supplierLeads?.length > 0 && <><div className="panel-header"><div><p className="eyebrow">SOURCING · BRAVE</p><h3>Proveedores encontrados</h3></div></div><div className="supplier-offer-list">{sourcing.supplierLeads.map((lead: any, index: number) => <div key={`${lead.url}-${index}`}><div><b>{lead.name}</b><small>{lead.domain}</small></div><span><b>{money(lead.priceHint)}</b><small>señal web</small></span><span><b>{lead.leadScore}/100</b><small>lead score</small></span></div>)}</div></>}
      {economics && <div className="source-note">{economics.ready ? `Costo puesto ${money(economics.landedCost)} · utilidad/u ${money(economics.unitProfit)} · margen ${pct(economics.netMarginPct)} · ROI ${pct(economics.roiPct)}` : economics.note || `Faltan: ${(economics.missing || []).join(", ")}`}</div>}
      <div className="source-note">Quality gates: {evidence.qualityGates ? Object.entries(evidence.qualityGates).map(([k, v]) => `${v ? "✓" : "✕"} ${k}`).join(" · ") : "pendientes"}</div>
      {offers.isLoading ? <LoadingState/> : !offers.data?.length ? <EmptyState text="No hay cotización verificada todavía. Brave solo genera leads; confirma proveedor, precio, MOQ, envío y lead time antes de BUY."/> : <div className="supplier-offer-list">{offers.data.map((o: any) => <div key={o.ID_SupplierOffer}><div><b>{o.SupplierName}</b><small>{o.Source || "Manual"} · MOQ {o.MOQ}</small></div><span><b>{money(o.UnitPrice)}</b><small>cotizado</small></span><span><b>{o.DeliveryDays || "—"} días</b></span><span><b>{o.ReliabilityScore}/100</b></span></div>)}</div>}
      <button className="primary full-width" disabled={!offers.data?.length || recommend.isPending} onClick={calculateFinal}><Calculator size={15}/>{recommend.isPending ? "Calculando..." : offers.data?.length ? "Calcular inversión final" : "Falta cotización verificada"}</button>
    </article><article className="panel recommendation-panel"><p className="eyebrow">DECISIÓN</p>{!finalResult ? <div className="recommendation-empty"><h2>{decisionLabel(evidence.decision)}</h2><p>{evidence.decisionReason || "MarketOps seguirá en RESEARCH hasta que todos los datos críticos estén disponibles."}</p>{recommendation && <div className="recommendation-metrics"><span>Capital disponible<b>{money(recommendation.availableCapital)}</b></span><span>Reserva objetivo<b>{money(recommendation.reserveTarget)}</b></span><span>Unidades<b>{recommendation.quantity || 0}</b></span><span>Inversión<b>{money(recommendation.investment)}</b></span></div>}</div> : <div><div className={`decision ${String(finalResult.decision).toLowerCase()}`}>{finalResult.decision}</div><h2>{finalResult.title}</h2><p>{finalResult.reason}</p><div className="recommendation-metrics"><span>Proveedor<b>{finalResult.bestSupplier?.supplierName || "—"}</b></span><span>Costo puesto<b>{money(finalResult.bestSupplier?.landedUnitCost)}</b></span><span>Comprar<b>{finalResult.recommendedQuantity} u.</b></span><span>Invertir<b>{money(finalResult.recommendedInvestment)}</b></span><span>Utilidad/u<b>{money(finalResult.estimatedProfitPerUnit)}</b></span><span>Margen<b>{pct(finalResult.estimatedMarginPct)}</b></span></div></div>}</article></section>}

    <Modal open={candidateModal} title="Nueva oportunidad manual" onClose={() => setCandidateModal(false)}><form className="form-grid" onSubmit={submitCandidate}><label className="span-2">Producto<input name="title" required/></label><label>Temporada<input name="season"/></label><label>Venta estimada<input name="sale" type="number" step=".01" required/></label><label>Comisión<input name="fee" type="number" defaultValue="0"/></label><label>Envío venta<input name="ship" type="number" defaultValue="0"/></label><label>Empaque<input name="pack" type="number" defaultValue="0"/></label><label>Demanda<input name="demand" type="number" min="0" max="100" defaultValue="70"/></label><label>Competencia<input name="competition" type="number" min="0" max="100" defaultValue="50"/></label><label>Temporada score<input name="seasonal" type="number" min="0" max="100" defaultValue="50"/></label><label>Tendencia<input name="trend" type="number" min="0" max="100" defaultValue="65"/></label><div className="form-actions span-2"><button className="primary">Guardar</button></div></form></Modal>
    <Modal open={offerModal} title="Cotización verificada" onClose={() => setOfferModal(false)}><form className="form-grid" onSubmit={submitOffer}><label className="span-2">Proveedor<input name="supplier" required/></label><label>Fuente<input name="source" placeholder="Mayorista / fabricante"/></label><label>URL<input name="url"/></label><label>Precio unitario<input name="price" type="number" step=".01" required/></label><label>MOQ<input name="moq" type="number" min="1" defaultValue="1"/></label><label>Envío total<input name="shipping" type="number" defaultValue="0"/></label><label>Importación<input name="import" type="number" defaultValue="0"/></label><label>Lead time total (días)<input name="days" type="number" defaultValue="7"/></label><label>Confianza proveedor<input name="reliability" type="number" min="0" max="100" defaultValue="70"/></label><div className="form-actions span-2"><button className="primary">Guardar cotización</button></div></form></Modal>
  </div>;
}
