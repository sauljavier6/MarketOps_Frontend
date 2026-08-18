type Props = { label: string; value: string; helper: string; positive?: boolean };
export default function MetricCard({ label, value, helper, positive }: Props) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small className={positive ? "positive" : ""}>{helper}</small></article>;
}
