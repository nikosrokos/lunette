"use client";

import { ContactSellerForm } from "./ContactSellerForm";
import type { Studio } from "@/lib/types";

interface ContactModalProps {
  studio: Studio;
  frameName?: string;
  open: boolean;
  onClose: () => void;
}

export function ContactModal({
  studio,
  frameName,
  open,
  onClose,
}: ContactModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="contact-title">Contact {studio.name}</h2>
        <p className="meta-sub">
          Ask about availability, sizing, or shipping.
        </p>
        <ContactSellerForm
          studio={studio}
          frameName={frameName}
          onDone={onClose}
        />
        <button
          type="button"
          className="btn-text"
          style={{ marginTop: "0.75rem" }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
