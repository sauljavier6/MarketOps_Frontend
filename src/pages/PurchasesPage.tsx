import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Plus, Truck } from "lucide-react";
import { createPurchase, getProducts, getPurchases, getSuppliers, receivePurchase } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";
import type { Purchase } from "../types";

const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(value || 0));

export default function PurchasesPage() {
  const [open, setOpen] = useState(false);
  const [receiving, setReceiving] = useState<Purchase | null>(null);
  const qc = useQueryClient();

  const purchases = useQuery({ queryKey: ["purchases"], queryFn: getPurchases });
  const products = useQuery({ queryKey: ["products"], queryFn: () => getProducts() });
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });

  const createMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: async () => {
      setOpen(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["purchases"] }),
        qc.invalidateQueries({ queryKey: ["capital"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({ purchaseId, items }: { purchaseId: number; items: Array<{ purchaseItemId: number; receivedQuantity: number }> }) => receivePurchase(purchaseId, { items }),
    onSuccess: async () => {
      setReceiving(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["purchases"] }),
        qc.invalidateQueries({ queryKey: ["inventory"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });

  function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createMutation.mutate({
      supplierId: Number(form.get("supplierId")),
      shippingCost: Number(form.get("shippingCost") || 0),
      expectedDate: String(form.get("expectedDate") || "") || undefined,
      items: [{
        productId: Number(form.get("productId")),
        quantity: Number(form.get("quantity")),
        unitCost: Number(form.get("unitCost")),
      }],
    });
  }

  function submitReceive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receiving) return;
    const form = new FormData(event.currentTarget);
    receiveMutation.mutate({
      purchaseId: receiving.ID_Purchase,
      items: (receiving.Items || []).map((item) => ({
        purchaseItemId: item.ID_PurchaseItem,
        receivedQuantity: Number(form.get(`qty_${item.ID_PurchaseItem}`) || 0),
      })),
    });
  }

  const totalCommitted = useMemo(() => (purchases.data || []).filter(p => p.Status === "ORDERED" || p.Status === "IN_TRANSIT").reduce((s,p) => s + Number(p.Total), 0), [purchases.data]);

  return <div>
    <header className="page-header"><div><p className="eyebrow">ABASTECIMIENTO</p><h1>Compras</h1><p className="subtitle">Crear compra descuenta capital; recibirla aumenta stock.</p></div><button className="primary" onClick={() => setOpen(true)}><Plus size={16}/> Nueva compra</button></header>

    <section className="metrics">
      <article className="metric-card"><span>Compras</span><strong>{purchases.data?.length || 0}</strong><small>registradas</small></article>
      <article className="metric-card"><span>Capital comprometido</span><strong>{money(totalCommitted)}</strong><small>ordenado / tránsito</small></article>
      <article className="metric-card"><span>Productos</span><strong>{products.data?.length || 0}</strong><small>disponibles para comprar</small></article>
      <article className="metric-card"><span>Proveedores</span><strong>{suppliers.data?.length || 0}</strong><small>registrados</small></article>
    </section>

    <section className="panel">
      {purchases.isLoading ? <LoadingState/> : purchases.isError ? <ErrorState error={purchases.error}/> : !purchases.data?.length ? <EmptyState text="Aún no hay compras."/> :
        <div className="purchase-list">{purchases.data.map((row) => <div className="purchase-row" key={row.ID_Purchase}>
          <div className="purchase-icon">{row.Status === "IN_TRANSIT" ? <Truck size={18}/> : <PackageCheck size={18}/>}</div>
          <div><b>PO-{String(row.ID_Purchase).padStart(4,"0")}</b><small>{row.Supplier?.Name || `Proveedor ${row.ID_Supplier}`}</small></div>
          <div><span>Productos</span><b>{row.Items?.reduce((sum, item) => sum + Number(item.Quantity), 0) || 0} unidades</b></div>
          <div><span>Total</span><b>{money(row.Total)}</b></div>
          <div><span>Entrega</span><b>{row.ExpectedDate || "—"}</b></div>
          <div><span className="status ordered">{row.Status}</span></div>
          <button className="secondary" disabled={row.Status === "RECEIVED"} onClick={() => setReceiving(row)}>{row.Status === "RECEIVED" ? "Recibida" : "Recibir"}</button>
        </div>)}</div>
      }
    </section>

    <Modal open={open} title="Nueva compra" onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submitPurchase}>
        <label className="span-2">Proveedor<select name="supplierId" required defaultValue=""><option value="" disabled>Seleccionar</option>{suppliers.data?.map(s => <option key={s.ID_Supplier} value={s.ID_Supplier}>{s.Name}</option>)}</select></label>
        <label className="span-2">Producto<select name="productId" required defaultValue=""><option value="" disabled>Seleccionar</option>{products.data?.map(p => <option key={p.ID_Product} value={p.ID_Product}>{p.Code} · {p.Description}</option>)}</select></label>
        <label>Cantidad<input name="quantity" type="number" min="1" required/></label>
        <label>Costo unitario<input name="unitCost" type="number" step="0.01" min="0" required/></label>
        <label>Envío proveedor<input name="shippingCost" type="number" step="0.01" min="0" defaultValue="0"/></label>
        <label>Entrega estimada<input name="expectedDate" type="date"/></label>
        {createMutation.isError && <div className="form-error span-2">{createMutation.error.message}</div>}
        <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={createMutation.isPending}>{createMutation.isPending ? "Creando..." : "Crear compra"}</button></div>
      </form>
    </Modal>

    <Modal open={Boolean(receiving)} title={receiving ? `Recibir PO-${String(receiving.ID_Purchase).padStart(4,"0")}` : "Recibir compra"} onClose={() => setReceiving(null)}>
      <form className="form-grid" onSubmit={submitReceive}>
        {(receiving?.Items || []).map((item) => <label className="span-2" key={item.ID_PurchaseItem}>Producto #{item.ID_Product} · pendiente {Number(item.Quantity)-Number(item.ReceivedQuantity)}<input name={`qty_${item.ID_PurchaseItem}`} type="number" min="0" max={Number(item.Quantity)-Number(item.ReceivedQuantity)} defaultValue={Number(item.Quantity)-Number(item.ReceivedQuantity)}/></label>)}
        {receiveMutation.isError && <div className="form-error span-2">{receiveMutation.error.message}</div>}
        <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setReceiving(null)}>Cancelar</button><button className="primary" disabled={receiveMutation.isPending}>{receiveMutation.isPending ? "Recibiendo..." : "Confirmar recepción"}</button></div>
      </form>
    </Modal>
  </div>;
}
