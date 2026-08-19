import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, Search } from "lucide-react";
import { createRadarCandidate, createSupplierOffer, getDataSourceStatus, getInvestmentRecommendation, getRadarCandidates, getSupplierOffers, runAutoDiscovery } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";

const money = (v?: number | null) => v == null || !Number.isFinite(Number(v)) || Number(v) <= 0 ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(v));
const pct = (v?: number | null) => v == null || !Number.isFinite(Number(v)) ? "—" : `${Number(v).toFixed(1)}%`;

export default function RadarPage() {
  const [cm, setCm] = useState(false);
  const [om, setOm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const qc = useQueryClient();

  const candidates = useQuery({ queryKey: ["radar-candidates"], queryFn: getRadarCandidates });
  const sourceStatus = useQuery({ queryKey: ["radar-data-sources"], queryFn: getDataSourceStatus });
  const offers = useQuery({ queryKey: ["supplier-offers", selected?.Title], queryFn: () => getSupplierOffers(selected?.Title), enabled: !!selected });

  const cMut = useMutation({ mutationFn: createRadarCandidate, onSuccess: async () => { setCm(false); await qc.invalidateQueries({ queryKey: ["radar-candidates"] }); } });
  const oMut = useMutation({ mutationFn: createSupplierOffer, onSuccess: async () => { setOm(false); await qc.invalidateQueries({ queryKey: ["supplier-offers", selected?.Title] }); } });
  const rMut = useMutation({ mutationFn: getInvestmentRecommendation, onSuccess: setResult });
  const autoDiscovery = useMutation({ mutationFn: runAutoDiscovery, onSuccess: async () => { setSelected(null); setResult(null); await Promise.all([qc.invalidateQueries({ queryKey: ["radar-candidates"] }), qc.invalidateQueries({ queryKey: ["radar-data-sources"] })]); } });

  function subC(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    cMut.mutate({ title: String(f.get("title")), season: String(f.get("season") || ""), estimatedSalePrice: Number(f.get("sale")), estimatedMarketplaceFee: Number(f.get("fee") || 0), estimatedShippingCost: Number(f.get("ship") || 0), packagingCost: Number(f.get("pack") || 0), demandScore: Number(f.get("demand") || 50), competitionScore: Number(f.get("competition") || 50), seasonalScore: Number(f.get("seasonal") || 50), trendScore: Number(f.get("trend") || 50) });
  }

  function subO(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    oMut.mutate({ productQuery: selected.Title, supplierName: String(f.get("supplier")), source: String(f.get("source") || ""), sourceUrl: String(f.get("url") || ""), unitPrice: Number(f.get("price")), moq: Number(f.get("moq") || 1), shippingCost: Number(f.get("shipping") || 0), importCost: Number(f.get("import") || 0), deliveryDays: Number(f.get("days") || 0), reliabilityScore: Number(f.get("reliability") || 50) });
  }

  function calc() {
    if (!selected || !Number(selected.EstimatedSalePrice)) return;
    rMut.mutate({ title: selected.Title, marketScore: selected.MarketScore, estimatedSalePrice: Number(selected.EstimatedSalePrice), marketplaceFeePerUnit: Number(selected.EstimatedMarketplaceFee), outboundShippingPerUnit: Number(selected.EstimatedShippingCost), packagingCostPerUnit: Number(selected.PackagingCost), seasonDaysRemaining: selected.Evidence?.season?.daysToPeak ?? undefined, offers: (offers.data || []).map((o: any) => ({ supplierName: o.SupplierName, source: o.Source, sourceUrl: o.SourceUrl, unitPrice: Number(o.UnitPrice), moq: Number(o.MOQ), shippingCost: Number(o.ShippingCost), importCost: Number(o.ImportCost), deliveryDays: o.DeliveryDays, reliabilityScore: Number(o.ReliabilityScore) })) });
  }

  const catalogSource = sourceStatus.data?.sources?.find((source: any) => source.id === "meli_catalog_products");
  const supplierSource = sourceStatus.data?.sources?.find((source: any) => source.id === "supplier_discovery");
  const summary = autoDiscovery.data?.summary;
  const sourcing = selected?.Evidence?.sourcing;
  const prelim = sourcing?.preliminaryEconomics;

  return <div>
    <header className="page-header"><div><p className="eyebrow">DISCOVERY · VALIDATION · SOURCING · ECONOMICS</p><h1>Radar de inversión</h1><p className="subtitle">Encuentra productos concretos, valida el mercado en Mercado Libre y busca costos de compra antes de recomendar capital.</p></div><button className="primary" onClick={() => setCm(true)}><Plus size={16}/> Captura manual</button></header>

    <section className="panel auto-discovery-panel"><div className="auto-discovery-copy"><p className="eyebrow">AUTO DISCOVERY · MERCADO LIBRE MÉXICO</p><h2>¿Qué conviene comprar para revender?</h2><p>Mercado Libre aporta tendencias, producto exacto, precios de mercado, competencia y comisión de venta. Brave se usa después para localizar proveedores y señales de costo de compra.</p><p className="source-note">El Radar solo publica candidatos con precio de mercado validado y confianza mínima; los hallazgos incompletos quedan fuera de la lista principal.</p></div><div className="auto-discovery-actions"><span className={sourceStatus.data?.marketplaceAccount && catalogSource?.status === "READY" ? "source-status ready" : "source-status auth_required"}>{sourceStatus.data?.marketplaceAccount && catalogSource?.status === "READY" ? `ML listo · Brave ${supplierSource?.status === "READY" ? "listo" : "pendiente"}` : "Requiere OAuth"}</span><button className="primary" disabled={!sourceStatus.data?.marketplaceAccount || autoDiscovery.isPending} onClick={() => autoDiscovery.mutate({ maxTrends: 20 })}><Search size={15}/>{autoDiscovery.isPending ? "Investigando mercado..." : "Ejecutar investigación"}</button></div>{autoDiscovery.isError && <div className="form-error">{autoDiscovery.error.message}</div>}</section>

    {summary && <section className="panel"><div className="panel-header"><div><p className="eyebrow">ÚLTIMA INVESTIGACIÓN</p><h2>Embudo de oportunidades</h2></div></div><div className="recommendation-metrics"><span>Tendencias ML<b>{summary.trendsFound}</b></span><span>Productos encontrados<b>{summary.concreteProductsFound}</b></span><span>Investigados<b>{summary.productsResearched}</b></span><span>Mercado validado<b>{summary.validatedMarketCandidates}</b></span><span>Sin precio confiable<b>{summary.skippedWithoutReliableMarketPrice}</b></span><span>Sourcing automático<b>{summary.sourcingShortlist}</b></span></div>{summary.failed > 0 && <div className="form-error">{summary.failed} productos fallaron durante investigación.</div>}</section>}

    <section className="panel">{candidates.isLoading ? <LoadingState/> : candidates.isError ? <ErrorState error={candidates.error}/> : !candidates.data?.length ? <EmptyState text="No hay oportunidades validadas todavía. Ejecuta la investigación."/> : <div className="radar-table"><div className="radar-row radar-head"><span>Oportunidad</span><span>Venta ML</span><span>Score</span><span>Estado</span><span></span></div>{candidates.data.map((r: any) => <div className={selected?.ID_RadarCandidate === r.ID_RadarCandidate ? "radar-row selected" : "radar-row"} key={r.ID_RadarCandidate}><span><b>{r.Title}</b><small>{r.Season ? `${r.Season} · ` : ""}Confianza {r.ConfidenceScore || 0}/100</small></span><span><b>{money(r.EstimatedSalePrice)}</b><small>{r.Evidence?.priceRange?.samples || 0} precios ML</small></span><span><b className={r.MarketScore >= 78 ? "score hot" : "score"}>{r.MarketScore}</b></span><span>{r.Status}</span><span><button className="secondary" onClick={() => { setSelected(r); setResult(null); }}>Analizar</button></span></div>)}</div>}</section>

    {selected && <section className="dashboard-grid radar-detail"><article className="panel"><div className="panel-header"><div><p className="eyebrow">MARKET VALIDATION + SOURCING</p><h2>{selected.Title}</h2><p className="subtitle">Origen: tendencia “{selected.Evidence?.sourceTrend || "—"}”</p></div><button className="secondary" onClick={() => setOm(true)}><Plus size={14}/> Cotización verificada</button></div>
      <div className="recommendation-metrics"><span>Confianza<b>{selected.ConfidenceScore || 0}/100</b></span><span>Demanda<b>{selected.DemandScore ?? "—"}/100</b></span><span>Competencia<b>{selected.CompetitionScore ?? "—"}/100</b></span><span>Publicaciones<b>{selected.Evidence?.competingListings ?? "—"}</b></span><span>Vendedores<b>{selected.Evidence?.uniqueSellerCount ?? "—"}</b></span><span>Ventas señal<b>{selected.Evidence?.soldQuantitySampleTotal ?? "—"}</b></span></div>
      <div className="recommendation-metrics"><span>Precio mínimo<b>{money(selected.Evidence?.priceRange?.min)}</b></span><span>Mediana ML<b>{money(selected.Evidence?.priceRange?.median)}</b></span><span>Precio máximo<b>{money(selected.Evidence?.priceRange?.max)}</b></span><span>Comisión clásica<b>{money(selected.EstimatedMarketplaceFee)}</b></span><span>Temporada<b>{selected.Season || "Sin señal"}</b></span><span>Días al pico<b>{selected.Evidence?.season?.daysToPeak ?? "—"}</b></span></div>

      {sourcing && <><div className="panel-header"><div><p className="eyebrow">SOURCING AUTOMÁTICO · BRAVE</p><h3>Señales de costo de compra</h3></div></div><div className="recommendation-metrics"><span>Leads encontrados<b>{sourcing.leadsFound}</b></span><span>Precios plausibles<b>{sourcing.plausiblePriceHints}</b></span><span>Costo estimado web<b>{money(sourcing.estimatedPurchasePrice)}</b></span><span>Margen preliminar<b>{pct(prelim?.preliminaryMarginBeforeShipping)}</b></span><span>Prueba sugerida<b>{money(prelim?.suggestedTestCapital)}</b></span><span>Unidades prueba<b>{prelim?.suggestedTestUnits ?? "—"}</b></span></div><div className="source-note">El costo de compra detectado por Brave es una señal no verificada. Antes de invertir hay que confirmar precio, MOQ, envío e importación con el proveedor.</div>{sourcing.supplierLeads?.length > 0 && <div className="supplier-offer-list">{sourcing.supplierLeads.map((lead: any, index: number) => <div key={`${lead.url}-${index}`}><div><b>{lead.name}</b><small>{lead.domain}</small></div><span><b>{money(lead.priceHint)}</b><small>señal web</small></span><span><b>{lead.leadScore}/100</b><small>lead score</small></span></div>)}</div>}</>}

      {offers.isLoading ? <LoadingState/> : !offers.data?.length ? <EmptyState text="Aún no hay cotización verificada. Los leads de Brave no se usan como precio final automáticamente."/> : <div className="supplier-offer-list">{offers.data.map((o: any) => <div key={o.ID_SupplierOffer}><div><b>{o.SupplierName}</b><small>{o.Source || "Manual"} · MOQ {o.MOQ}</small></div><span><b>{money(o.UnitPrice)}</b><small>cotizado</small></span><span><b>{o.DeliveryDays || "—"} días</b></span><span><b>{o.ReliabilityScore}/100</b></span></div>)}</div>}
      <button className="primary full-width" disabled={!offers.data?.length || rMut.isPending} onClick={calc}><Calculator size={15}/>{rMut.isPending ? "Calculando..." : offers.data?.length ? "Calcular inversión final" : "Falta cotización verificada"}</button>
    </article><article className="panel recommendation-panel"><p className="eyebrow">INVESTMENT ENGINE</p>{!result ? <div className="recommendation-empty"><h2>Recomendación pendiente</h2><p>El mercado ya está validado. Confirma una cotización de proveedor para calcular margen, unidades e inversión final.</p></div> : <div><div className={`decision ${result.decision.toLowerCase()}`}>{result.decision}</div><h2>{result.title}</h2><p>{result.reason}</p><div className="recommendation-metrics"><span>Proveedor<b>{result.bestSupplier?.supplierName || "—"}</b></span><span>Costo puesto<b>{money(result.bestSupplier?.landedUnitCost || 0)}</b></span><span>Comprar<b>{result.recommendedQuantity} u.</b></span><span>Invertir<b>{money(result.recommendedInvestment)}</b></span><span>Utilidad/u<b>{money(result.estimatedProfitPerUnit)}</b></span><span>Margen<b>{pct(result.estimatedMarginPct)}</b></span></div><div className="target-cost">Costo máximo objetivo <strong>{money(result.targetPurchaseCost)}</strong></div></div>}</article></section>}

    <Modal open={cm} title="Nueva oportunidad manual" onClose={() => setCm(false)}><form className="form-grid" onSubmit={subC}><label className="span-2">Producto<input name="title" required/></label><label>Temporada<input name="season"/></label><label>Venta estimada<input name="sale" type="number" step=".01" required/></label><label>Comisión<input name="fee" type="number" defaultValue="0"/></label><label>Envío venta<input name="ship" type="number" defaultValue="0"/></label><label>Empaque<input name="pack" type="number" defaultValue="0"/></label><label>Demanda<input name="demand" type="number" min="0" max="100" defaultValue="70"/></label><label>Competencia<input name="competition" type="number" min="0" max="100" defaultValue="50"/></label><label>Temporada score<input name="seasonal" type="number" min="0" max="100" defaultValue="50"/></label><label>Tendencia<input name="trend" type="number" min="0" max="100" defaultValue="65"/></label><div className="form-actions span-2"><button className="primary">Guardar</button></div></form></Modal>
    <Modal open={om} title="Cotización verificada" onClose={() => setOm(false)}><form className="form-grid" onSubmit={subO}><label className="span-2">Proveedor<input name="supplier" required/></label><label>Fuente<input name="source" placeholder="Mayorista / fabricante"/></label><label>URL<input name="url"/></label><label>Precio unitario<input name="price" type="number" step=".01" required/></label><label>MOQ<input name="moq" type="number" min="1" defaultValue="1"/></label><label>Envío total<input name="shipping" type="number" defaultValue="0"/></label><label>Importación<input name="import" type="number" defaultValue="0"/></label><label>Días entrega<input name="days" type="number" defaultValue="7"/></label><label>Confianza<input name="reliability" type="number" min="0" max="100" defaultValue="70"/></label><div className="form-actions span-2"><button className="primary">Guardar cotización</button></div></form></Modal>
  </div>;
}
