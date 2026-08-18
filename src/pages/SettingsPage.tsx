import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Link2, ShieldCheck, Unplug, Webhook } from "lucide-react";
import { getMercadoLibreAuthUrl, getMercadoLibreStatus } from "../api/marketOpsApi";
import { ErrorState, LoadingState } from "../components/ui/Feedback";

export default function SettingsPage() {
  const status = useQuery({ queryKey: ["meli-status"], queryFn: getMercadoLibreStatus });

  async function connectMercadoLibre() {
    const { url } = await getMercadoLibreAuthUrl();
    window.location.href = url;
  }

  return <div>
    <header className="page-header"><div><p className="eyebrow">CONFIGURACIÓN</p><h1>Integraciones</h1><p className="subtitle">El estado ya se consulta al backend.</p></div></header>

    {status.isLoading ? <LoadingState/> : status.isError ? <ErrorState error={status.error}/> :
      <section className="integration-grid">
        <article className="panel integration-card">
          <div className="integration-top"><div className="meli-logo">ML</div><div><h2>Mercado Libre</h2><p>{status.data.connected ? `Cuenta: ${status.data.account?.Nickname || status.data.account?.ExternalUserId}` : "Publicaciones, inventario, órdenes y notificaciones."}</p></div><span className={status.data.connected ? "integration-status connected" : "integration-status pending"}>{status.data.connected ? "Conectado" : "Sin conectar"}</span></div>
          <div className="integration-features"><span><CheckCircle2 size={15}/> OAuth 2.0</span><span><KeyRound size={15}/> Refresh automático</span><span><Webhook size={15}/> orders_v2</span><span><ShieldCheck size={15}/> Tokens cifrados</span></div>
          {!status.data.connected && <button className="meli-button" onClick={connectMercadoLibre}><Link2 size={16}/> Conectar Mercado Libre</button>}
          {status.data.connected && <div className="connected-box"><CheckCircle2 size={18}/><span>La cuenta está lista para publicar y sincronizar órdenes.</span></div>}
        </article>

        <article className="panel setup-card">
          <p className="eyebrow">ENDPOINTS</p><h2>Mercado Libre App</h2>
          <div className="setup-fields"><span>OAuth callback <code>/api/marketplaces/mercadolibre/callback</code></span><span>Webhook <code>/api/marketplaces/mercadolibre/webhook</code></span></div>
        </article>
      </section>
    }
  </div>;
}
