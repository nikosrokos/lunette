"use client";

import type { ReactNode } from "react";

interface AdminPanelProps {
  id: string;
  title: string;
  summary?: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export function AdminPanel({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: AdminPanelProps) {
  return (
    <section className={`admin-panel${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="admin-panel-trigger"
        aria-expanded={open}
        onClick={() => onToggle(id)}
      >
        <span>
          <strong>{title}</strong>
          {summary ? <span className="meta-sub">{summary}</span> : null}
        </span>
        <span className="admin-panel-chevron" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="admin-panel-body">{children}</div> : null}
    </section>
  );
}
