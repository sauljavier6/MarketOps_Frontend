import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageSearch, Plus, Search, Truck } from "lucide-react";
import { createSupplier, getSupplierIntegrations, getSuppliers, searchSupplierCatalog } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";

const money = (value?: number | null) => value == null || !Number.isFinite(Number(value)) ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(Number(value));
const capabilityLabel: Record<string, string> = { catalog: "Catálogo", prices: "Precios", stock: "Stock", dropshipping: "Dropshipping", orderQuote: "Cotización", orderCreate: "Pedido automático", shippingGuide: "Guías", tracking: "Tracking" };

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("accesorios");
  const [provider, setProvider] = useState("SYSCOM");
  const qc = useQueryClient();
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const integrations = useQuery({ queryKey: ["supplier-integrations"], queryFn: getSupplierIntegrations });
  const mutation = useMutation({ mutationFn: createSupplier, onSuccess: async () => { setOpen(false); await qc.invalidateQueries({ queryKey: ["suppliers"] }); } });
  const catalog = useMutation({ mutationFn: ({ providerId, search }: { providerId: string; search: string }) => searchSupplierCatalog(providerId, search, 1, 30) });
  const selectedIntegration = useMemo(() => integrations.data?.find(item => item.provider === provider) || null, [integrations.data, provider]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({ name: String(form.get("name")), contact: String(form.get("contact") || ""), phone: String(form.get("phone") || ""), website: String(form.get("website") || "") });
  }

  function submitCatalogSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = catalogSearch.trim();
    if (value && selectedIntegration?.capabilities.catalog) catalog.mutate({ providerId: provider, search: value });
  }

  return <div>
    <header className="page-header"><div><p className="eyebrow">RED DE ABASTECIMIENTO</p><h1>Proveedores</h1><p className="subtitle">Aquí viven los proveedores manuales y los proveedores conectados por API. El Radar podrá usarlos después para comparar inventario, dropshipping, precio y disponibilidad.</p></div><button className="primary" onClick={() => setOpen(true)}><Plus size={16}/> Nuevo proveedor</button></header>

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">INTEGRACIONES</p><h2>Red de proveedores</h2><p className="subtitle">No son módulos distintos: todos son proveedores dentro de la misma red. Algunos son manuales y otros tienen API.</p></div></div>
      {integrations.isLoading ? <LoadingState/> : integrations.isError ? <ErrorState error={integrations.error}/> : <div className="supplier-grid">{(integrations.data || []).map(item => <article className="supplier-card" key={item.provider}><div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}><div><b>{item.name}</b><small>{item.mode === "API" ? "Conectado por API" : item.mode === "MANUAL" ? "Gestión manual" : "Falta configuración"}</small></div><Truck size={20}/></div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{Object.entries(item.capabilities).filter(([, enabled]) => enabled).map(([key]) => <span className="source-status ready" key={key}>{capabilityLabel[key] || key}</span>)}</div><small>{item.configured ? "Disponible para MarketOps" : "Requiere credenciales antes de usarlo"}</small></article>)}</div>}
    </section>

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">CATÁLOGOS CON API</p><h2>Buscar productos directamente en proveedores</h2><p className="subtitle">Solo aparecen para búsqueda automática los proveedores cuyo conector permite consultar catálogo.</p></div></div>
      <form className="form-actions" onSubmit={submitCatalogSearch} style={{ marginTop: 14 }}>
        <select value={provider} onChange={event => { setProvider(event.target.value); catalog.reset(); }}>{(integrations.data || []).filter(item => item.capabilities.catalog).map(item => <option key={item.provider} value={item.provider}>{item.name}</option>)}</select>
        <input value={catalogSearch} onChange={event => setCatalogSearch(event.target.value)} placeholder="Ej. cámaras, router, SSD, audífonos" style={{ flex: 1 }}/>
        <button className="primary" disabled={!selectedIntegration?.configured || !selectedIntegration?.capabilities.catalog || catalog.isPending}><Search size={15}/>{catalog.isPending ? "Consultando..." : "Buscar productos"}</button>
      </form>
      {selectedIntegration && !selectedIntegration.configured && <div className="source-note">{selectedIntegration.name} está registrado, pero todavía faltan sus credenciales para consultar el catálogo.</div>}
      {catalog.isError && <div className="form-error">{(catalog.error as any)?.response?.data?.message || catalog.error.message}</div>}
      {catalog.data && <div style={{ marginTop: 18 }}><div className="panel-header"><div><p className="eyebrow">RESULTADOS DEL PROVEEDOR</p><h3>{catalog.data.products.length} productos encontrados en {catalog.data.provider}</h3></div><span className="source-note">Búsqueda: {catalog.data.query}</span></div>{!catalog.data.products.length ? <EmptyState text="El proveedor no devolvió productos para esta búsqueda."/> : <div className="supplier-grid">{catalog.data.products.map(product => <article className="supplier-card" key={`${product.providerProductId}-${product.sku}`}><div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>{product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: 58, height: 58, objectFit: "contain", borderRadius: 8, background: "#fff" }}/> : <div style={{ width: 58, height: 58, display: "grid", placeItems: "center" }}><PackageSearch size={24}/></div>}<div><b>{product.title}</b><small>{product.brand || "Sin marca"} · {product.sku || product.providerProductId}</small></div></div><span>{money(product.price)}</span><small>Existencia: {product.stock == null ? "Consultar detalle" : product.stock}</small><small>{product.category || "Categoría no disponible"}</small></article>)}</div>}</div>}
    </section>

    <section className="panel"><div className="panel-header"><div><p className="eyebrow">DIRECTORIO</p><h2>Proveedores registrados manualmente</h2><p className="subtitle">Estos sirven para cotizaciones aunque todavía no tengan API.</p></div></div>{suppliers.isLoading ? <LoadingState/> : suppliers.isError ? <ErrorState error={suppliers.error}/> : !suppliers.data?.length ? <EmptyState text="No hay proveedores registrados."/> : <div className="supplier-grid">{suppliers.data.map(item => <article className="supplier-card" key={item.ID_Supplier}><b>{item.Name}</b><span>{item.Contact || "Sin contacto"}</span><small>{item.Phone || "Sin teléfono"}</small><small>{item.Website || "Sin sitio web"}</small></article>)}</div>}</section>

    <Modal open={open} title="Nuevo proveedor" onClose={() => setOpen(false)}><form className="form-grid" onSubmit={submit}><label className="span-2">Nombre<input name="name" required/></label><label>Contacto<input name="contact"/></label><label>Teléfono<input name="phone"/></label><label className="span-2">Sitio web<input name="website"/></label>{mutation.isError && <div className="form-error span-2">{mutation.error.message}</div>}<div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={mutation.isPending}>Guardar</button></div></form></Modal>
  </div>;
}
