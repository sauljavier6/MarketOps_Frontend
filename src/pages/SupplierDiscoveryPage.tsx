import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search, ShieldCheck, Sparkles } from "lucide-react";
import { convertSupplierLeadToOffer, getSupplierDiscoveryStatus, getSupplierLeads, runSupplierDiscovery } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";
import type { SupplierLead } from "../types";

const money = (value?: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

export default function SupplierDiscoveryPage() {
  const [productQuery, setProductQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<SupplierLead | null>(null);
  const qc = useQueryClient();

  const status = useQuery({ queryKey: ["supplier-discovery-status"], queryFn: getSupplierDiscoveryStatus });
  const leads = useQuery({
    queryKey: ["supplier-leads", productQuery],
    queryFn: () => getSupplierLeads(productQuery || undefined),
  });

  const discover = useMutation({
    mutationFn: runSupplierDiscovery,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["supplier-leads", productQuery] });
    },
  });

  const convert = useMutation({
    mutationFn: ({ leadId, payload }: any) => convertSupplierLeadToOffer(leadId, payload),
    onSuccess: async () => {
      setSelectedLead(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["supplier-leads", productQuery] }),
        qc.invalidateQueries({ queryKey: ["supplier-offers"] }),
      ]);
    },
  });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productQuery.trim()) return;
    discover.mutate(productQuery.trim());
  }

  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLead) return;
    const form = new FormData(event.currentTarget);
    convert.mutate({
      leadId: selectedLead.ID_SupplierLead,
      payload: {
        unitPrice: Number(form.get("unitPrice")),
        moq: Number(form.get("moq") || 1),
        shippingCost: Number(form.get("shippingCost") || 0),
        importCost: Number(form.get("importCost") || 0),
        deliveryDays: Number(form.get("deliveryDays") || 0),
        reliabilityScore: Number(form.get("reliabilityScore") || selectedLead.LeadScore),
      },
    });
  }

  return <div>
    <header className="page-header">
      <div><p className="eyebrow">SOURCING AUTOMÁTICO</p><h1>Descubrir proveedores</h1><p className="subtitle">Busca proveedores candidatos en la web y conviértelos en cotizaciones verificadas antes de invertir.</p></div>
    </header>

    <section className="panel sourcing-search">
      <div>
        <p className="eyebrow">BRAVE SEARCH API</p>
        <h2>Buscar dónde comprar</h2>
        <p>MarketOps prioriza resultados con señales de mayoreo, proveedor, distribuidor, fabricante e importador.</p>
      </div>
      <form onSubmit={submitSearch}>
        <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Ej. Cempasúchil LED 3m"/>
        <button className="primary" disabled={!status.data?.configured || discover.isPending}><Search size={15}/>{discover.isPending ? "Buscando..." : "Buscar proveedores"}</button>
      </form>
      {!status.isLoading && !status.data?.configured && <div className="warning-banner">Agrega `BRAVE_SEARCH_API_KEY` al backend para activar Supplier Discovery automático.</div>}
      {discover.isError && <div className="form-error">{discover.error.message}</div>}
    </section>

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">LEADS</p><h2>Proveedores candidatos</h2></div><span className="data-badge"><ShieldCheck size={13}/> Requieren verificación</span></div>

      {leads.isLoading ? <LoadingState/> : leads.isError ? <ErrorState error={leads.error}/> : !leads.data?.length ? <EmptyState text="Todavía no hay proveedores candidatos para esta búsqueda."/> :
        <div className="lead-list">{leads.data.map((lead: SupplierLead) => <article className="supplier-lead" key={lead.ID_SupplierLead}>
          <div className="lead-score">{lead.LeadScore}</div>
          <div className="lead-main"><b>{lead.Name}</b><span>{lead.Domain}</span><p>{lead.Snippet || "Sin descripción disponible."}</p></div>
          <div className="lead-price"><span>Precio detectado</span><b>{lead.PriceHint ? money(lead.PriceHint) : "No disponible"}</b><small>{lead.PriceHint ? "Solo indicio; verificar" : "Cotizar"}</small></div>
          <div className="lead-actions">
            <button className="secondary" onClick={() => window.open(lead.Url, "_blank")}><ExternalLink size={13}/> Abrir</button>
            <button className="primary" onClick={() => setSelectedLead(lead)} disabled={lead.VerificationStatus === "QUOTED"}><Sparkles size={13}/>{lead.VerificationStatus === "QUOTED" ? "Cotizado" : "Registrar cotización"}</button>
          </div>
        </article>)}</div>
      }
    </section>

    <Modal open={Boolean(selectedLead)} title="Verificar cotización" onClose={() => setSelectedLead(null)}>
      <form className="form-grid" onSubmit={submitQuote}>
        <div className="span-2 verification-note">Estás convirtiendo un resultado de búsqueda en una cotización real. Verifica estos datos directamente con el proveedor.</div>
        <label className="span-2">Proveedor<input value={selectedLead?.Name || ""} disabled/></label>
        <label>Precio unitario verificado<input name="unitPrice" type="number" min="0" step="0.01" required defaultValue={selectedLead?.PriceHint || ""}/></label>
        <label>MOQ<input name="moq" type="number" min="1" defaultValue="1"/></label>
        <label>Envío total<input name="shippingCost" type="number" min="0" step="0.01" defaultValue="0"/></label>
        <label>Importación total<input name="importCost" type="number" min="0" step="0.01" defaultValue="0"/></label>
        <label>Días de entrega<input name="deliveryDays" type="number" min="0" defaultValue="7"/></label>
        <label>Confianza<input name="reliabilityScore" type="number" min="0" max="100" defaultValue={selectedLead?.LeadScore || 50}/></label>
        {convert.isError && <div className="form-error span-2">{convert.error.message}</div>}
        <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setSelectedLead(null)}>Cancelar</button><button className="primary" disabled={convert.isPending}>{convert.isPending ? "Guardando..." : "Guardar cotización verificada"}</button></div>
      </form>
    </Modal>
  </div>;
}
