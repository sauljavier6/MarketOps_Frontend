import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageSearch, Plus, Search } from "lucide-react";
import { createSupplier, getSuppliers, getSyscomStatus, searchSyscomProducts } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";

const money = (value?: number | null) => value == null || !Number.isFinite(Number(value)) ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(Number(value));

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("accesorios");
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const syscomStatus = useQuery({ queryKey: ["supplier-syscom-status"], queryFn: getSyscomStatus });
  const mutation = useMutation({ mutationFn: createSupplier, onSuccess: async () => { setOpen(false); await qc.invalidateQueries({ queryKey: ["suppliers"] }); } });
  const syscomProducts = useMutation({ mutationFn: (search: string) => searchSyscomProducts(search, 1, 30) });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({ name: String(form.get("name")), contact: String(form.get("contact") || ""), phone: String(form.get("phone") || ""), website: String(form.get("website") || "") });
  }

  function submitSyscomSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = catalogSearch.trim();
    if (value) syscomProducts.mutate(value);
  }

  return <div>
    <header className="page-header"><div><p className="eyebrow">ABASTECIMIENTO</p><h1>Proveedores</h1><p className="subtitle">Proveedores manuales y catálogos conectados por API para comparar productos, precio y disponibilidad.</p></div><button className="primary" onClick={() => setOpen(true)}><Plus size={16}/> Nuevo proveedor</button></header>

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">PRIMER CONECTOR</p><h2>Catálogo SYSCOM</h2><p className="subtitle">Consulta productos con precio y existencia directamente desde la API oficial de SYSCOM.</p></div><span className={syscomStatus.data?.configured ? "source-status ready" : "source-status auth_required"}>{syscomStatus.isLoading ? "Revisando conexión..." : syscomStatus.data?.configured ? "API configurada" : "Falta configurar credenciales"}</span></div>
      {!syscomStatus.isLoading && !syscomStatus.data?.configured && <div className="source-note">Agrega <b>SYSCOM_CLIENT_ID</b> y <b>SYSCOM_CLIENT_SECRET</b> en Railway. Después podrás buscar el catálogo desde aquí.</div>}
      <form className="form-actions" onSubmit={submitSyscomSearch} style={{ marginTop: 14 }}><input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} placeholder="Ej. cámaras, router, SSD, audífonos" style={{ flex: 1 }}/><button className="primary" disabled={!syscomStatus.data?.configured || syscomProducts.isPending}><Search size={15}/>{syscomProducts.isPending ? "Consultando..." : "Buscar productos"}</button></form>
      {syscomProducts.isError && <div className="form-error">{(syscomProducts.error as any)?.response?.data?.message || syscomProducts.error.message}</div>}
      {syscomProducts.data && <div style={{ marginTop: 18 }}><div className="panel-header"><div><p className="eyebrow">RESULTADOS DEL PROVEEDOR</p><h3>{syscomProducts.data.products.length} productos encontrados</h3></div><span className="source-note">Búsqueda: {syscomProducts.data.query}</span></div>{!syscomProducts.data.products.length ? <EmptyState text="SYSCOM no devolvió productos para esta búsqueda."/> : <div className="supplier-grid">{syscomProducts.data.products.map(product => <article className="supplier-card" key={`${product.providerProductId}-${product.sku}`}><div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>{product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: 58, height: 58, objectFit: "contain", borderRadius: 8, background: "#fff" }}/> : <div style={{ width: 58, height: 58, display: "grid", placeItems: "center" }}><PackageSearch size={24}/></div>}<div><b>{product.title}</b><small>{product.brand || "Sin marca"} · {product.sku || product.providerProductId}</small></div></div><span>{money(product.price)}</span><small>Existencia: {product.stock == null ? "Consultar detalle" : product.stock}</small><small>{product.category || "Categoría no disponible"}</small></article>)}</div>}</div>}
    </section>

    <section className="panel"><div className="panel-header"><div><p className="eyebrow">PROVEEDORES REGISTRADOS</p><h2>Directorio manual</h2></div></div>{query.isLoading ? <LoadingState/> : query.isError ? <ErrorState error={query.error}/> : !query.data?.length ? <EmptyState text="No hay proveedores registrados."/> : <div className="supplier-grid">{query.data.map(s => <article className="supplier-card" key={s.ID_Supplier}><b>{s.Name}</b><span>{s.Contact || "Sin contacto"}</span><small>{s.Phone || "Sin teléfono"}</small><small>{s.Website || "Sin sitio web"}</small></article>)}</div>}</section>

    <Modal open={open} title="Nuevo proveedor" onClose={() => setOpen(false)}><form className="form-grid" onSubmit={submit}><label className="span-2">Nombre<input name="name" required/></label><label>Contacto<input name="contact"/></label><label>Teléfono<input name="phone"/></label><label className="span-2">Sitio web<input name="website"/></label>{mutation.isError && <div className="form-error span-2">{mutation.error.message}</div>}<div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={mutation.isPending}>Guardar</button></div></form></Modal>
  </div>;
}
