import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: Props) {
  if (!open) return null;

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose}><X size={18}/></button>
      </div>
      {children}
    </section>
  </div>;
}
