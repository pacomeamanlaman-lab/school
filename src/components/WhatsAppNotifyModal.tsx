"use client";

import Modal from "./Modal";
import type { WhatsAppNotifyContext } from "@/lib/whatsapp-templates-mvp";
import { MessageCircleWarning, Smartphone } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  context: WhatsAppNotifyContext | null;
  /** MVP : pas d’appel Meta ; appelé au clic « Envoyer » */
  onConfirmSend?: (ctx: WhatsAppNotifyContext) => void;
};

export default function WhatsAppNotifyModal({ isOpen, onClose, context, onConfirmSend }: Props) {
  if (!context) return null;

  const handleSend = () => {
    onConfirmSend?.(context);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="WhatsApp — confirmation d’envoi" size="lg">
      <div className="space-y-5">
        <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">
          <MessageCircleWarning className="h-5 w-5 shrink-0 text-warning" />
          <p>
            <span className="font-semibold">Mode démonstration.</span> Aucun message n’est envoyé pour l’instant. Ce
            panneau préfigure les templates Meta et le branchement backend.
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Template (Meta)</p>
          <p className="font-mono text-sm text-foreground">{context.metaTemplateName}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{context.title}</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Aperçu du message</p>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
            {context.bodyPreview}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Variables</p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {context.fields.map((row) => (
              <li key={row.label} className="flex justify-between gap-4 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-right font-medium text-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`flex items-start gap-3 rounded-lg border p-3 ${
            context.whatsappE164
              ? "border-success/30 bg-success/5"
              : "border-danger/30 bg-danger/5"
          }`}
        >
          <Smartphone className={`mt-0.5 h-5 w-5 shrink-0 ${context.whatsappE164 ? "text-success" : "text-danger"}`} />
          <div>
            <p className="text-sm font-medium text-foreground">Numéro WhatsApp</p>
            {context.whatsappE164 ? (
              <p className="font-mono text-sm text-foreground">{context.whatsappE164}</p>
            ) : (
              <p className="text-sm text-danger">Aucun numéro enregistré — compléter la fiche parent avant envoi.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-input bg-background px-4 py-2.5 font-medium text-foreground transition hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!context.whatsappE164}
            className="rounded-lg bg-[#25D366] px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-[#20bd5a] disabled:pointer-events-none disabled:opacity-50"
          >
            Envoyer (simulation)
          </button>
        </div>
      </div>
    </Modal>
  );
}
