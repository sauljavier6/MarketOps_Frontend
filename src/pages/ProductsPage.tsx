import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { createProduct, deactivateProduct, getProducts, updateProduct } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";
import type { Product } from "../types";

const money = (value?: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

type ProductFormPayload = {
  description: string;
  code: string;
  brand?: string;
  category?: string;
  targetPurchasePrice?: number;
  salePrice?: number;
  state?: boolean;
};

export default function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const qc = useQueryClient();

  const query = useQuery({ queryKey: ["products", includeInactive], queryFn: () => getProducts({ includeInactive }) });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await refreshProducts();
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductFormPayload }) => updateProduct(id, payload),
    onSuccess: async () => {
      await refreshProducts();
      closeModal();
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateProduct,
    onSuccess: refreshProducts,
  });

  async function refreshProducts() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["products"] }),
      qc.invalidateQueries({ queryKey: ["inventory"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function startCreate() {
    setEditing(null);
    setOpen(true);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: ProductFormPayload = {
      description: String(form.get("description") || ""),
      code: String(form.get("code") || ""),
      brand: String(form.get("brand") || ""),
      category: String(form.get("category") || ""),
      targetPurchasePrice: Number(form.get("targetPurchasePrice") || 0),
      salePrice: Number(form.get("salePrice") || 0),
      state: form.get("state") === "true",
    };

    if (editing) updateMutation.mutate({ id: editing.ID_Product, payload });
    else createMutation.mutate(payload);
  }

  function requestDeactivate(product: Product) {
    if (!window.confirm(`¿Desactivar ${product.Description}?\n\nNo se elimina el historial de compras, ventas ni inventario.`)) return;
    deactivateMutation.mutate(product.ID_Product);
  }

  const rows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return query.data || [];

    return (query.data || []).filter((product) => [product.Description, product.Code, product.Brand, product.Category].some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [query.data, search]);

  const mutationError = createMutation.error || updateMutation.error || deactivateMutation.error;
  const saving = createMutation.isPending || updateMutation.isPending;

  return <div>
    <header className="page-header">
      <div><p className="eyebrow">CATÁLOGO</p><h1>Productos</h1><p className="subtitle">Administra productos, precios y estado sin perder historial operativo.</p></div>
      <button className="primary" onClick={startCreate}><Plus size={16}/> Nuevo producto</button>
    </header>

    <section className="product-toolbar">
      <div className="product-search"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, SKU, marca o categoría..."/></div>
      <label className="inactive-toggle"><input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)}/> Mostrar inactivos</label>
    </section>

    {mutationError && <div className="form-error product-page-error">{mutationError.message}</div>}

    <section className="panel">
      {query.isLoading ? <LoadingState/> : query.isError ? <ErrorState error={query.error}/> : !rows.length ? <EmptyState text="No hay productos que coincidan con los filtros."/> :
        <div className="product-grid">{rows.map((product) => {
          const stock = product.Stock?.[0];
          return <article className={`product-card ${product.State ? "" : "inactive"}`} key={product.ID_Product}>
            <div className="product-img">{product.Description.slice(0, 1).toUpperCase()}</div>
            <div className="product-card-content">
              <div className="product-card-top"><div><small>{product.Code}</small><h3>{product.Description}</h3></div><span className={product.State ? "status ready" : "status disabled"}>{product.State ? "Activo" : "Inactivo"}</span></div>
              <p>{product.Category || "Sin categoría"} · {product.Brand || "Sin marca"}</p>
              <div className="product-data"><span>Costo objetivo <b>{money(product.TargetPurchasePrice)}</b></span><span>Venta <b>{money(stock?.SalePrice)}</b></span><span>Stock <b>{Number(stock?.Amount || 0)}</b></span></div>
              <div className="product-actions">
                <button className="secondary" onClick={() => startEdit(product)}><Pencil size={14}/> Editar</button>
                {product.State && <button className="danger-button" disabled={deactivateMutation.isPending} onClick={() => requestDeactivate(product)}><Trash2 size={14}/> Desactivar</button>}
              </div>
            </div>
          </article>;
        })}</div>
      }
    </section>

    <Modal open={open} title={editing ? "Editar producto" : "Nuevo producto"} onClose={closeModal}>
      <form className="form-grid" onSubmit={submit} key={editing?.ID_Product || "new"}>
        <label className="span-2">Descripción<input name="description" required defaultValue={editing?.Description || ""} placeholder="Cempasúchil LED 3m"/></label>
        <label>SKU<input name="code" required defaultValue={editing?.Code || ""} placeholder="DM-CEMP-001"/></label>
        <label>Marca<input name="brand" defaultValue={editing?.Brand || ""} placeholder="Genérico"/></label>
        <label>Categoría<input name="category" defaultValue={editing?.Category || ""} placeholder="Temporada"/></label>
        <label>Costo objetivo<input name="targetPurchasePrice" type="number" min="0" step="0.01" defaultValue={editing?.TargetPurchasePrice || 0}/></label>
        <label>Precio de venta<input name="salePrice" type="number" min="0" step="0.01" defaultValue={editing?.Stock?.[0]?.SalePrice || 0}/></label>
        {editing && <label>Estado<select name="state" defaultValue={editing.State ? "true" : "false"}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>}
        {!editing && <input type="hidden" name="state" value="true"/>}
        {(createMutation.isError || updateMutation.isError) && <div className="form-error span-2">{(createMutation.error || updateMutation.error)?.message}</div>}
        <div className="form-actions span-2"><button type="button" className="secondary" onClick={closeModal}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar producto"}</button></div>
      </form>
    </Modal>
  </div>;
}
