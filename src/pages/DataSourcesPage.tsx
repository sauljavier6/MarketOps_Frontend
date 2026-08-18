import { useQuery } from "@tanstack/react-query";
import { Database, KeyRound, Search, ShieldCheck } from "lucide-react";
import { getDataSourceStatus } from "../api/marketOpsApi";
import { ErrorState, LoadingState } from "../components/ui/Feedback";

export default function DataSourcesPage() {
  const query = useQuery({ queryKey: ["data-sources"], queryFn: getDataSourceStatus });

  if (query.isLoading) return <LoadingState/>;
  if (query.isError) return <ErrorState error={query.error}/>;

  return <div>
    <header className="page-header">
      <div><p className="eyebrow">TRANSPARENCIA</p><h1>Fuentes de datos</h1><p className="subtitle">Aquí puedes ver qué información es real, manual o todavía requiere conexión.</p></div>
    </header>

    <section className="source-grid">
      {query.data.sources.map((source: any) => <article className="panel source-card" key={source.id}>
        <div className="source-icon">{source.id.includes("meli") ? <Database size={20}/> : <Search size={20}/>}</div>
        <div className="source-title"><div><h2>{source.name}</h2><p>{source.provider}</p></div><span className={`source-status ${String(source.status).toLowerCase()}`}>{source.status}</span></div>
        <p className="source-purpose">{source.purpose}</p>
        <div className="source-meta"><span><ShieldCheck size={14}/>{source.dataType === "REAL" ? "Dato real" : "Dato manual"}</span>{source.status === "AUTH_REQUIRED" && <span><KeyRound size={14}/>Requiere OAuth</span>}</div>
      </article>)}
    </section>
  </div>;
}
