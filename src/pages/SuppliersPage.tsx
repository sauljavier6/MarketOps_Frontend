import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { createSupplier, getSuppliers } from "../api/marketOpsApi";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/Feedback";
import Modal from "../components/ui/Modal";

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliers });
  const mutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: async () => { setOpen(false); await qc.invalidateQueries({ queryKey: ["suppliers"] }); },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      name: String(form.get("name")),
      contact: String(form.get("contact") || ""),
      phone: String(form.get("phone") || ""),
      website: String(form.get("website") || ""),
    });
  }

  return <div>
    <header className="page-header"><div><p className="eyebrow">ABASTECIMIENTO</p><h1>Proveedores</h1><p className="subtitle">Alta real para usar los proveedores en órdenes de compra.</p></div><button className="primary" onClick={() => setOpen(true)}><Plus size={16}/> Nuevo proveedor</button></header>
    <section className="panel">
      {query.isLoading ? <LoadingState/> : query.isError ? <ErrorState error={query.error}/> : !query.data?.length ? <EmptyState text="No hay proveedores registrados."/> :
        <div className="supplier-grid">{query.data.map(s => <article className="supplier-card" key={s.ID_Supplier}><b>{s.Name}</b><span>{s.Contact || "Sin contacto"}</span><small>{s.Phone || "Sin teléfono"}</small><small>{s.Website || "Sin sitio web"}</small></article>)}</div>
      }
    </section>
    <Modal open={open} title="Nuevo proveedor" onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={submit}>
        <label className="span-2">Nombre<input name="name" required/></label>
        <label>Contacto<input name="contact"/></label>
        <label>Teléfono<input name="phone"/></label>
        <label className="span-2">Sitio web<input name="website"/></label>
        {mutation.isError && <div className="form-error span-2">{mutation.error.message}</div>}
        <div className="form-actions span-2"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancelar</button><button className="primary" disabled={mutation.isPending}>Guardar</button></div>
      </form>
    </Modal>
  </div>;
}
