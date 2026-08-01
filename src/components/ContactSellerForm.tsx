"use client";

import { useState, type FormEvent } from "react";
import type { Studio } from "@/lib/types";

interface ContactSellerFormProps {
  studio: Studio;
  frameName?: string;
  onDone?: () => void;
}

export function ContactSellerForm({
  studio,
  frameName,
  onDone,
}: ContactSellerFormProps) {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <p className="success">Message sent to {studio.name}.</p>
        <p className="meta-sub" style={{ marginTop: "0.5rem" }}>
          Demo mode — in production this emails the seller and opens their inbox.
        </p>
        {onDone ? (
          <button type="button" className="btn btn-ghost" style={{ marginTop: "1rem" }} onClick={onDone}>
            Close
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Your name
        <input name="name" required placeholder="Alex" />
      </label>
      <label>
        Email
        <input name="email" type="email" required placeholder="you@email.com" />
      </label>
      <label>
        Message
        <textarea
          name="message"
          required
          defaultValue={
            frameName
              ? `Hi ${studio.name}, I'm interested in ${frameName}. Is it available?`
              : `Hi ${studio.name}, I'd like to know more about your frames.`
          }
        />
      </label>
      <button type="submit" className="btn btn-gold">
        Send message
      </button>
      <p className="meta-sub">{studio.replyTime}</p>
    </form>
  );
}
