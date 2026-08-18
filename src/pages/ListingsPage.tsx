import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, RefreshCw } from "lucide-react";
import { getMarketplaceListings, getMercadoLibreStatus, getProducts, publishMarketplaceListing, updateMarketplaceListingStock } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

export default function ListingsPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const listings = useQuery({ queryKey: ["listings"], queryFn: getMarketplaceListings });
  const products = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  const status = useQuery({ queryKey: ["meli-status"], queryFn: getMercadoLibreStatus });

  const publish = useMutation({
    mutationFn: publishMarketplaceListing,
    onSuccess: async () => { setOpen(false); await qc.invalidateQueries({ queryKey: ["listings"] }); },
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => updateMarketplaceListingStock(id, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listings"] }),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    publish.mutate({
      productId: Number(form.get("productId")),
      listing: {
        title: String(form.get("title")),
        category_id: String(form.get("categoryId")),
        price: Number(form.get("price")),
        currency_id: "MXN",
        available_quantity: Number(form.get("quantity")),
        buying_mode: "buy_it_now",
        condition: "new",
        listing_type_id: String(form.get("listingTypeId") || "gold_special"),
      },
    });
  }

  return <div>
    <header className="page-header"><div><p className="eyebrow">MARKETPLACE</p><h1>Publicaciones</h1><p className="subtitle">Esta pantalla ya consulta y publica mediante el backend.</p></div><button className="primary" disabled={!status.data?.connected} onClick={() => setOpen(true)}><Plus size={16}/> Nueva publicación</button></header>

    {!status.isLoading && !status.data?.connected && <div className="warning-banner">Conecta Mercado Libre en Configuración antes de publicar.</div>}

    <section className="panel">
      <div className="panel-header"><div><p className="eyebrow">MERCADO LIBRE</p><h2>Publicaciones</h2></div><button className="secondary" onClick={() => listings.refetch()}><RefreshCw size={14}/> Actualizar</button></div>
      {listings.isLoading ? <LoadingState/> : listings.isError ? <ErrorState error={listings.error}/> : !listings.data?.length ? <EmptyState text="No hay publicaciones todavía."/> :
        <div className="listing-table"><div className="listing-row listing-head"><span>Producto ID</span><span>ID externo</span><span>Precio</span><span>Stock</span><span>Estado</span><span></span></div>
          {listings.data.map(row => <div className="listing-row" key={row.ID_Listing}><span><b>Producto #{row.ID_Product}</b></span><span>{row.ExternalId || "—"}</span><span>{money(row.Price)}</span><span><input className="stock-input" type="number" defaultValue={row.AvailableQuantity} min="0" onBlur={(e) => { const q=Number(e.target.value); if(q!==row.AvailableQuantity) stockMutation.mutate({id: row.ID_Listing, quantity:q}); }}/></span><span><i className="status ready">{row.Status}</i></span><span className="listing-actions">{row.Permalink && <button onClick={() => window.open(row.Permalink, "_blank")}><ExternalLink size={14}/></button>}</span></div>)}
        </div>
      }
    </section>

    <Modal open={open} title="Publicar en Mercado Libre" onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="span-2">Producto<select name="productId" required defaultValue=""><option value="" disabled>Seleccionar</option>{products.data?.map(p => <option key={p.ID_Product} value={p.ID_Product}>{p.Code} · {p.Description}</option>)}</select></label>
        <label className="span-2">Título<input name="title" required maxLength={60}/></label>
        <label>Categoría ML<input name="categoryId" required placeholder="MLM..."/></label>
        <label>Tipo publicación<select name="listingTypeId" defaultValue="gold_special"><option value="gold_special">Clásica</option><option value="gold_pro">Premium</option></select></label>
        <label>Precio<input name="price" type="number" step="0.01" required/></label>
        <label>Cantidad<input name="quantity" type="number" min="1" required/></label>
        {publish.isError && <div className="form-error span-2">{publish.error.message}</div>}
        <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={publish.isPending}>{publish.isPending ? "Publicando..." : "Publicar"}</button></div>
      </form>
    </Modal>
  </div>;
}
