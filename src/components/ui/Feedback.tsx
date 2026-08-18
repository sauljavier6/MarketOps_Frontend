export function LoadingState({ text = "Cargando..." }: { text?: string }) {
  return <div className="feedback-state">{text}</div>;
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Ocurrió un error";
  return <div className="feedback-state error">{message}</div>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="feedback-state">{text}</div>;
}
